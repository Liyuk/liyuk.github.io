// Publish a drafted entry: flip `draft: true` → `false`.
// Run: npm run publish <slug>
// Locates the entry across writing/research/projects/galleries by slug
// (the directory name for dated collections, the explicit slug for galleries).
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';

const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

// Find every content md file whose slug matches. Returns [{ file, slug, collection }].
export async function findEntriesBySlug(slug) {
  const results = [];
  const patterns = [
    `${CONTENT_ROOT}/writing/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/research/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/projects/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/galleries/${slug}.md`,
  ];
  for (const pattern of patterns) {
    for await (const file of glob(pattern)) {
      const collection = file.includes('/galleries/') ? 'gallery' : file.includes('/writing/') ? 'writing' : file.includes('/research/') ? 'research' : 'project';
      results.push({ file, slug, collection });
    }
  }
  return results;
}

// Flip draft true→false in a frontmatter block. Returns the new content, or null if unchanged.
export function unDraft(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = match[1];
  if (/^draft:[ \t]*true$/m.test(frontmatter)) {
    const updated = frontmatter.replace(/^draft:[ \t]*true$/m, 'draft: false');
    return content.replace(match[0], `---\n${updated}\n---`);
  }
  if (/^draft:[ \t]*false$/m.test(frontmatter)) return null; // already published
  // No draft line → treat as published (default false); nothing to change.
  return null;
}

export async function publishBySlug(slug) {
  const matches = await findEntriesBySlug(slug);
  if (matches.length === 0) return { published: false, reason: 'not-found', entries: [] };

  const published = [];
  for (const entry of matches) {
    const content = await readFile(entry.file, 'utf8');
    const next = unDraft(content);
    if (next) {
      await writeFile(entry.file, next, 'utf8');
      published.push({ ...entry, changed: true });
    } else {
      published.push({ ...entry, changed: false });
    }
  }
  return { published: true, reason: 'ok', entries: published };
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('用法：npm run publish <slug>');
    console.error('例如：npm run publish why-code-decays');
    process.exit(2);
  }

  const result = await publishBySlug(slug);
  if (!result.published) {
    console.error(`未找到 slug「${slug}」对应的内容（检查 writing/research/projects/galleries）。`);
    process.exit(1);
  }

  for (const entry of result.entries) {
    if (entry.changed) {
      console.log(`✔ 已发布：${entry.collection}/${entry.slug} → ${path.relative(process.cwd(), entry.file)}`);
    } else {
      console.log(`· 已是发布状态：${path.relative(process.cwd(), entry.file)}`);
    }
  }
  console.log('\n下一步：git add 已改动的文件，push 会触发 publish:check + 部署。');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
