// Column-integrity audit: every `column` assignment in writing/consulting/research/gallery
// content must reference a registered column and use a positive, unique `order`.
// Run: npm run audit:columns
//
// The content schema already rejects `order <= 0` at build time; this check runs
// earlier and additionally catches duplicate orders and unknown column slugs,
// which the per-entry Zod schema cannot see (those need cross-entry context).
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { columns as columnRegistry } from '../src/lib/taxonomy.ts';

const CONTENT_DIRS = ['writing', 'consulting', 'research', 'galleries'];

// `column` is legal in both YAML shapes, so both must be audited — a block-form
// entry that this script skipped would carry an unregistered slug or a duplicate
// order past every check in the repository (the per-entry schema only validates
// types, and audit:content only compares zh/en consistency).
const INLINE_COLUMN_RE = /^column:[ \t]*\{([^}\n]*)\}/m;
const BLOCK_COLUMN_RE = /^column:[ \t]*(?:#[^\n]*)?\n((?:[ \t]+[^\n]*\n?)+)/m;

// Returns { slug, order } as raw strings (either may be null when that key is
// absent), or null when the frontmatter declares no column at all.
export function parseColumnField(frontmatter) {
  const inline = frontmatter.match(INLINE_COLUMN_RE);
  const body = inline ? inline[1] : frontmatter.match(BLOCK_COLUMN_RE)?.[1];
  if (body === undefined) return null;
  return {
    slug: body.match(/\bslug:[ \t]*['"]?([^'"\s,}]+)/)?.[1] ?? null,
    order: body.match(/\border:[ \t]*['"]?([^'"\s,}]+)/)?.[1] ?? null,
  };
}

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    // A collection directory that doesn't exist yet is fine; anything else
    // (permissions, a file where a directory was expected) must not be
    // swallowed into a silently passing audit.
    if (error.code !== 'ENOENT') throw error;
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

export async function auditColumns({ contentRoot = path.join(process.cwd(), 'src/content') } = {}) {
  const errors = [];
  const seen = new Map(); // slug -> Map(order, file)
  let scannedDirs = 0;

  for (const dirName of CONTENT_DIRS) {
    const dir = path.join(contentRoot, dirName);
    if (existsSync(dir)) scannedDirs += 1;
    // Audit the source locale only: an `en.md` / `*.en.md` translation mirrors its
    // `zh.md` column assignment verbatim, so auditing both would flag every column
    // as a duplicate order.
    const files = (await walk(dir)).filter((file) => /\.(md|mdx)$/.test(file) && path.basename(file) !== '_template.md' && path.basename(file) !== 'en.md' && !file.endsWith('.en.md'));
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const column = parseColumnField(frontmatter);
      if (!column) continue;

      const rel = path.relative(process.cwd(), file);
      const { slug, order: orderStr } = column;

      if (!slug || !orderStr) {
        errors.push(`${rel}: column 必须同时声明 slug 和 order`);
        continue;
      }
      const order = Number(orderStr);

      if (!(slug in columnRegistry)) {
        errors.push(`${rel}: 未知专栏 slug "${slug}"（不在 src/lib/taxonomy.ts 的 columns 注册表里）`);
        continue;
      }
      if (!Number.isInteger(order) || order <= 0) {
        errors.push(`${rel}: 专栏 ${slug} 的 order 必须是正整数（当前 ${orderStr}）`);
        continue;
      }

      const byOrder = seen.get(slug) ?? new Map();
      if (byOrder.has(order)) {
        errors.push(`专栏 ${slug} 的 order=${order} 重复：${byOrder.get(order)} 与 ${rel}`);
      }
      byOrder.set(order, rel);
      seen.set(slug, byOrder);
    }
  }

  if (scannedDirs === 0) {
    errors.push(`未找到任何内容目录（${CONTENT_DIRS.join('、')}）于 ${contentRoot}：审计范围为空，不能当作通过。`);
  }

  return errors;
}

async function main() {
  const errors = await auditColumns();
  if (errors.length) {
    for (const error of errors) console.error(`  ✘ ${error}`);
    console.error(`\n专栏审计未通过：${errors.length} 个问题。`);
    process.exitCode = 1;
    return;
  }
  console.log('专栏审计通过：order 均为正整数且在同一专栏内唯一。');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
