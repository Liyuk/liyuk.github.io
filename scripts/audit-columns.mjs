// Column-integrity audit: every `column` assignment in writing/consulting/research/gallery
// content must reference a registered column and use a positive, unique `order`.
// Run: npm run audit:columns
//
// The content schema already rejects `order <= 0` at build time; this check runs
// earlier and additionally catches duplicate orders and unknown column slugs,
// which the per-entry Zod schema cannot see (those need cross-entry context).
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { columns as columnRegistry } from '../src/lib/taxonomy.ts';

const CONTENT_DIRS = ['src/content/writing', 'src/content/consulting', 'src/content/research', 'src/content/galleries'];
const COLUMN_RE = /^column:\s*\{\s*slug:\s*([A-Za-z0-9-]+)\s*,\s*order:\s*(\d+)\s*\}/m;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

export async function auditColumns() {
  const errors = [];
  const seen = new Map(); // slug -> Map(order, file)

  for (const dir of CONTENT_DIRS) {
    // Audit the source locale only: an `en.md` / `*.en.md` translation mirrors its
    // `zh.md` column assignment verbatim, so auditing both would flag every column
    // as a duplicate order.
    const files = (await walk(dir)).filter((file) => /\.(md|mdx)$/.test(file) && path.basename(file) !== '_template.md' && path.basename(file) !== 'en.md' && !file.endsWith('.en.md'));
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const match = frontmatter.match(COLUMN_RE);
      if (!match) continue;

      const rel = path.relative(process.cwd(), file);
      const [, slug, orderStr] = match;
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
