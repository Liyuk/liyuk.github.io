import { access, readFile, readdir, stat as statFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const imageExtension = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const markdownExtension = /\.(md|mdx)$/i;
const astroExtension = /\.astro$/i;

export function extractImageReferences(source) {
  const markdown = [...source.matchAll(/!\[[^\]]*\]\(<?([^>)]+?)>?\)/g)]
    .map((match) => match[1].trim())
    .map((reference) => reference.replace(/\s+(?:["'].*)?$/, ''));
  const frontmatter = [...source.matchAll(/^\s*src:\s*["']?(\/images\/[^"'\s]+)["']?\s*$/gm)]
    .map((match) => match[1]);
  const cover = [...source.matchAll(/^\s*cover:\s*["']?(\/images\/[^"'\s]+)["']?\s*$/gm)]
    .map((match) => match[1]);
  // .astro 组件里的 <img src="..."> 引用（如 TipCard 的打赏码）。
  const htmlImg = [...source.matchAll(/<img[^>]+src=["']([^"']+)["']/g)]
    .map((match) => match[1]);
  // 编程方式引用的图片路径（如 BaseLayout 的 og:image 兜底
  // new URL('/images/og-default.png', ...)）：任何带引号的 /images/... 字面量。
  const urlRef = [...source.matchAll(/['"`](\/images\/[^'"`\s]+)['"`]/g)]
    .map((match) => match[1]);
  return [...markdown, ...frontmatter, ...cover, ...htmlImg, ...urlRef];
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return [target];
  }));
  return nested.flat();
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function auditImages(root = process.cwd()) {
  const contentRoot = path.join(root, 'src/content');
  const srcRoot = path.join(root, 'src');
  const publicImageRoot = path.join(root, 'public/images');
  const contentFiles = await walk(contentRoot);
  const markdownFiles = contentFiles.filter((file) => markdownExtension.test(file) && path.basename(file) !== '_template.md');
  // .astro 组件也可能引用图片（如 TipCard 的打赏码），纳入引用扫描。
  const astroFiles = (await walk(srcRoot)).filter((file) => astroExtension.test(file));
  const assets = [
    ...contentFiles.filter((file) => imageExtension.test(file)),
    ...(await exists(publicImageRoot) ? (await walk(publicImageRoot)).filter((file) => imageExtension.test(file)) : []),
  ];
  const referenced = new Set();
  const missing = [];

  for (const file of [...markdownFiles, ...astroFiles]) {
    const source = await readFile(file, 'utf8');
    for (const reference of extractImageReferences(source)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(reference) || reference.startsWith('#')) continue;
      const target = reference.startsWith('/')
        ? path.join(root, 'public', reference)
        : path.resolve(path.dirname(file), reference);
      if (await exists(target)) referenced.add(target);
      else missing.push(`${path.relative(root, file)} → ${reference}`);
    }
  }

  const unreferenced = assets
    .filter((asset) => !referenced.has(asset))
    .map((asset) => path.relative(root, asset));

  return { missing, unreferenced, references: referenced.size };
}

// Image quality gates: flag images that should be optimized before shipping.
// - Photos / gradients should be WebP or AVIF, not PNG (PNG bloat).
// - Any committed image over `maxBytes` is a flag (usually a forgotten export
//   at full camera resolution or an unoptimized screenshot).
export async function auditImageQuality(root = process.cwd(), { maxBytes = 200 * 1024 } = {}) {
  const publicImageRoot = path.join(root, 'public/images');
  const contentImageRoot = path.join(root, 'src/content');
  const imageExtension = /\.(jpe?g|png|webp|avif)$/i;
  const candidates = [];
  if (await exists(publicImageRoot)) candidates.push(...(await walk(publicImageRoot)).filter((f) => imageExtension.test(f)));
  if (await exists(contentImageRoot)) candidates.push(...(await walk(contentImageRoot)).filter((f) => imageExtension.test(f)));

  const flags = [];
  for (const file of candidates) {
    const stat = await statFile(file);
    const rel = path.relative(root, file);
    if (stat.size > maxBytes) flags.push(`${rel} (${(stat.size / 1024).toFixed(0)} KB > ${maxBytes / 1024} KB)`);
    // PNG screenshots/photos should be WebP; SVG-only/transparent cases are rare here.
    if (/\.png$/i.test(file)) flags.push(`${rel} (PNG — prefer WebP for photos)`);
  }
  return { flags };
}

async function main() {
  const report = await auditImages();
  const issues = [...report.missing.map((m) => `Missing image: ${m}`), ...report.unreferenced.map((u) => `Unreferenced image: ${u}`)];
  if (issues.length) {
    for (const issue of issues) console.error(issue);
    process.exitCode = 1;
    return;
  }
  console.log(`Image audit passed: ${report.references} referenced assets.`);
  // Quality gate (non-blocking by default): report oversized/PNG images so they
  // can be optimized, but don't fail the build over them.
  const quality = await auditImageQuality();
  if (quality.flags.length) {
    console.log(`\nImage quality notes (${quality.flags.length}):`);
    for (const flag of quality.flags.slice(0, 20)) console.log(`  • ${flag}`);
    if (quality.flags.length > 20) console.log(`  … and ${quality.flags.length - 20} more`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
