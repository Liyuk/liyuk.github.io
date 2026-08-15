import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const imageExtension = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const markdownExtension = /\.(md|mdx)$/i;

export function extractImageReferences(source) {
  const markdown = [...source.matchAll(/!\[[^\]]*\]\(<?([^>)]+?)>?\)/g)]
    .map((match) => match[1].trim())
    .map((reference) => reference.replace(/\s+(?:["'].*)?$/, ''));
  const frontmatter = [...source.matchAll(/^\s*src:\s*["']?(\/images\/[^"'\s]+)["']?\s*$/gm)]
    .map((match) => match[1]);
  const cover = [...source.matchAll(/^\s*cover:\s*["']?(\/images\/[^"'\s]+)["']?\s*$/gm)]
    .map((match) => match[1]);
  return [...markdown, ...frontmatter, ...cover];
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
  const publicImageRoot = path.join(root, 'public/images');
  const contentFiles = await walk(contentRoot);
  const markdownFiles = contentFiles.filter((file) => markdownExtension.test(file) && path.basename(file) !== '_template.md');
  const assets = [
    ...contentFiles.filter((file) => imageExtension.test(file)),
    ...(await exists(publicImageRoot) ? (await walk(publicImageRoot)).filter((file) => imageExtension.test(file)) : []),
  ];
  const referenced = new Set();
  const missing = [];

  for (const file of markdownFiles) {
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

async function main() {
  const report = await auditImages();
  if (report.missing.length || report.unreferenced.length) {
    for (const issue of report.missing) console.error(`Missing image: ${issue}`);
    for (const issue of report.unreferenced) console.error(`Unreferenced image: ${issue}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Image audit passed: ${report.references} referenced assets.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
