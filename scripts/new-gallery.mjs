// Interactive gallery creator.
// Run: npm run new:gallery
// Drag a folder of photos into the terminal (macOS fills the path), or type a path.
// Converts photos to WebP under public/images/galleries/<slug>/ and writes
// src/content/galleries/<slug>.md with real dimensions. Source files are not deleted.
import { copyFile, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { buildFrontmatter, createPrompter, todayStr, validateSlug, validateDate } from './lib/cli.mjs';
import { columns } from '../src/lib/taxonomy.ts';

const GALLERY_CONTENT_DIR = path.join(process.cwd(), 'src/content/galleries');
const GALLERY_PUBLIC_DIR = path.join(process.cwd(), 'public/images/galleries');
const MAX_WIDTH = 1600;
const WEBP_QUALITY = '82';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif', '.tiff', '.tif', '.gif']);

// --- pure helpers (exported for tests) ---

// Turn a file name into a stable lowercase image id: base name kebab-ified,
// falling back to `photo-<n>` when there's nothing URL-safe to keep.
export function imageIdFromName(name, index) {
  const base = path.basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  const core = base || 'photo';
  return `${core}-${index + 1}`;
}

export function galleryFilePath(slug) {
  return path.join(GALLERY_CONTENT_DIR, `${slug}.md`);
}

export function galleryPublicDir(slug) {
  return path.join(GALLERY_PUBLIC_DIR, slug);
}

// Build the gallery frontmatter object (mirrors src/content.config.ts schema).
// New galleries default to draft so they don't publish until edited.
export function buildGalleryFrontmatter({ title, description, slug, createdAt, cover, images, column, draft = true }) {
  return {
    title,
    description,
    slug,
    createdAt,
    draft,
    ...(column ? { column } : {}),
    cover,
    images,
  };
}

// Galleries can join a column just like writing entries; `audit:columns` scans
// this collection, so an unregistered slug or a duplicate order fails the gate.
export async function askGalleryColumn(rl, registry = columns) {
  const names = Object.keys(registry);
  if (names.length === 0) return null;
  console.log('可选专栏（回车 = 无）：');
  names.forEach((c, i) => console.log(`  ${i + 1}) ${registry[c].label['zh-CN']}`));
  const answer = (await rl.ask('所属专栏（回车 = 无）: ', {
    validate: (v) => {
      if (!v) return null;
      const byIndex = names[Number(v) - 1];
      const byName = names.find((c) => c === v || registry[c].label['zh-CN'] === v);
      return byIndex || byName ? null : '请输入列表中的序号或专栏名，或直接回车跳过';
    },
  })).trim();
  if (!answer) return null;
  const slug = names[Number(answer) - 1] ?? names.find((c) => c === answer || registry[c].label['zh-CN'] === answer);
  if (!slug) return null;
  const order = await rl.ask('在专栏中的顺序（正整数）', {
    default: '1',
    validate: (v) => (/^[1-9][0-9]*$/.test(v) ? null : '顺序必须是正整数'),
  });
  return { slug, order: Number(order) };
}

// --- image handling ---

export function hasImageTools() {
  const cwebp = spawnSync('which', ['cwebp'], { encoding: 'utf8' }).status === 0;
  const sips = spawnSync('which', ['sips'], { encoding: 'utf8' }).status === 0;
  return { cwebp, sips };
}

export async function readImageDimensions(file) {
  const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`sips 读取尺寸失败: ${result.stderr?.trim() ?? ''}`);
  const width = Number(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error(`无法读取图片尺寸: ${file}`);
  return { width, height };
}

// Convert one source image to WebP in outDir. Returns the output file's
// absolute path. Leaves the source untouched.
export async function convertToWebP(srcFile, outFile) {
  const ext = path.extname(srcFile).toLowerCase();
  const { width } = await readImageDimensions(srcFile);
  const targetWidth = Math.min(width, MAX_WIDTH);
  const resizeFlag = targetWidth < width ? ['--resampleWidth', String(targetWidth)] : [];

  if (ext === '.webp') {
    if (targetWidth >= width) {
      await copyFile(srcFile, outFile);
      return outFile;
    }
    // webp but too wide → decode via sips then re-encode
    const tmp = `${outFile}.tmp.jpg`;
    spawnSync('sips', ['-s', 'format', 'jpeg', ...resizeFlag, srcFile, '--out', tmp], { encoding: 'utf8' });
    spawnSync('cwebp', ['-q', WEBP_QUALITY, tmp, '-o', outFile], { encoding: 'utf8' });
    await rm(tmp, { force: true });
    return outFile;
  }

  // HEIC/TIFF/PNG/JPG → intermediate JPEG (sips handles HEIC decode on macOS) → WebP.
  const tmp = `${outFile}.tmp.jpg`;
  const sipsArgs = ['-s', 'format', 'jpeg'];
  if (resizeFlag.length) sipsArgs.push(...resizeFlag);
  const sipsResult = spawnSync('sips', [...sipsArgs, srcFile, '--out', tmp], { encoding: 'utf8' });
  if (sipsResult.status !== 0) throw new Error(`sips 转换失败: ${sipsResult.stderr?.trim() ?? ''}`);
  const cwebpResult = spawnSync('cwebp', ['-q', WEBP_QUALITY, tmp, '-o', outFile], { encoding: 'utf8' });
  if (cwebpResult.status !== 0) throw new Error(`cwebp 转换失败: ${cwebpResult.stderr?.trim() ?? ''}`);
  await rm(tmp, { force: true });
  return outFile;
}

export async function processImage(srcFile, outDir, index) {
  const id = imageIdFromName(path.basename(srcFile), index);
  const outFile = path.join(outDir, `${id}.webp`);
  await convertToWebP(srcFile, outFile);
  const { width, height } = await readImageDimensions(outFile);
  return { id, src: `/images/galleries/${path.basename(outDir)}/${id}.webp`, width, height };
}

// List image files in a directory (skips .DS_Store and dotfiles).
export async function scanImageFiles(dir) {
  const entries = await readdir(dir);
  const files = entries
    .filter((name) => !name.startsWith('.'))
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()));
  const results = [];
  for (const name of files) {
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isFile()) results.push(full);
  }
  return results.sort();
}

// --- main flow ---

async function main() {
  const rl = createPrompter();
  try {
    const { cwebp, sips } = hasImageTools();
    if (!cwebp) console.log('  ⚠ 未找到 cwebp，需要 WebP 转换。安装：brew install webp');
    if (!sips) console.log('  ⚠ 未找到 sips，macOS 应自带。若缺失将无法处理 HEIC。');

    console.log('创建图集 — 默认标记为草稿（draft: true）。图片描述（alt/caption）请如实填写。\n');

    // slug
    const slug = await rl.ask('图集 slug（URL 用，小写连字符）: ', { validate: validateSlug });
    if (existsSync(galleryFilePath(slug))) {
      console.log(`  ⚠ 已存在图集：${galleryFilePath(slug)}，不会覆盖。`);
      return;
    }

    const title = await rl.ask('图集标题（必填）: ', { validate: (v) => (v ? null : '标题不能为空') });
    const description = await rl.ask('图集描述（一句话）: ');
    const createdAt = await rl.ask('图集日期（YYYY-MM-DD）', { default: todayStr(), validate: validateDate });

    // image source path
    const srcDir = await askImageDir(rl);
    const files = await scanImageFiles(srcDir);
    if (files.length === 0) {
      console.log('  未在该目录找到图片（支持 jpg/png/webp/avif/heic/tiff）。');
      return;
    }
    console.log(`  找到 ${files.length} 张图片。`);

    // convert + gather metadata
    const outDir = galleryPublicDir(slug);
    await mkdir(outDir, { recursive: true });
    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const meta = await processImage(file, outDir, i);
      console.log(`  ✔ 已处理 [${i + 1}/${files.length}] ${path.basename(file)} → ${path.basename(meta.src)} (${meta.width}×${meta.height})`);
      meta.alt = await rl.ask(`第 ${i + 1} 张 alt（图片内容描述，必填）: `, { validate: (v) => (v ? null : 'alt 必填') });
      meta.caption = await rl.ask(`第 ${i + 1} 张 caption（可留空）: `) || undefined;
      images.push(meta);
    }

    // cover
    let cover = images[0].id;
    if (images.length > 1) {
      console.log('选封面：');
      images.forEach((img, i) => console.log(`  ${i + 1}) ${img.id} — ${img.alt.slice(0, 40)}`));
      const coverRaw = await rl.ask('封面序号', { default: '1' });
      const idx = Number(coverRaw) - 1;
      if (Number.isInteger(idx) && idx >= 0 && idx < images.length) cover = images[idx].id;
    }

    const column = await askGalleryColumn(rl);
    const frontmatter = buildFrontmatter(buildGalleryFrontmatter({ title, description, slug, createdAt, cover, images, column }));
    const filePath = galleryFilePath(slug);
    const body = `${frontmatter}\n`;

    console.log('\n预览 frontmatter：');
    console.log(frontmatter);
    console.log(`图片已写入：${outDir}`);
    console.log(`内容将写入：${filePath}`);

    const confirmed = (await rl.ask('确认创建？[y/N]')).toLowerCase();
    if (confirmed !== 'y' && confirmed !== 'yes') {
      console.log('  已取消。');
      return;
    }

    await writeFile(filePath, body, 'utf8');
    console.log(`\n✔ 已创建：${filePath}`);
    console.log('  下一步：若需调整，编辑该文件；然后运行 npm run publish <slug> 发布（或把 draft 改为 false）。');
  } finally {
    rl.close();
  }
}

async function askImageDir(rl) {
  for (;;) {
    const raw = (await rl.ask('图片文件夹路径（拖进终端，或直接输入）: ')).trim();
    if (!raw) { console.log('  不能为空。'); continue; }
    const expanded = raw.replace(/^~/, process.env.HOME);
    try {
      const info = await stat(expanded);
      if (info.isDirectory()) return expanded;
      console.log('  该路径不是文件夹。');
    } catch {
      console.log('  该路径不存在。');
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
