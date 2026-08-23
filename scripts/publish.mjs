// Publish a drafted entry: flip `draft: true` → `false`.
// Run: npm run publish <slug>
// Locates the entry across writing/research/projects/galleries by slug
// (the directory name for dated collections, the explicit slug for galleries).
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'node:fs/promises';

const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

// Find every content md file whose slug matches — both the source (zh) and any
// translation (en) so `npm run publish <slug>` flips draft on every language
// together. Returns [{ file, slug, collection }].
export async function findEntriesBySlug(slug) {
  const results = [];
  const patterns = [
    `${CONTENT_ROOT}/writing/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/writing/*/*/${slug}/en.md`,
    `${CONTENT_ROOT}/consulting/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/consulting/*/*/${slug}/en.md`,
    `${CONTENT_ROOT}/research/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/research/*/*/${slug}/en.md`,
    `${CONTENT_ROOT}/projects/*/*/${slug}/zh.md`,
    `${CONTENT_ROOT}/projects/*/*/${slug}/en.md`,
    `${CONTENT_ROOT}/galleries/${slug}.md`,
    `${CONTENT_ROOT}/galleries/${slug}.en.md`,
  ];
  for (const pattern of patterns) {
    for await (const file of glob(pattern)) {
      const collection = file.includes('/galleries/') ? 'gallery' : file.includes('/writing/') ? 'writing' : file.includes('/consulting/') ? 'consulting' : file.includes('/research/') ? 'research' : 'project';
      results.push({ file, slug, collection });
    }
  }
  return results;
}

// Update publication and translation fields in a frontmatter block. Returns the
// new content, or null when the entry already satisfies the public contract.
export function publishFrontmatter(content, locale) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = match[1];
  const expectedStatus = locale === 'zh-CN' ? 'original' : 'reviewed';
  let updated = frontmatter;

  if (/^draft:[ \t]*true$/m.test(updated)) {
    updated = updated.replace(/^draft:[ \t]*true$/m, 'draft: false');
  }
  if (/^draft:[ \t]*false$/m.test(updated)) {
    // Already public; keep the explicit field stable while normalizing status.
  }
  if (/^translationStatus:[ \t]*[^\n]+$/m.test(updated)) {
    updated = updated.replace(/^translationStatus:[ \t]*[^\n]+$/m, `translationStatus: ${expectedStatus}`);
  } else {
    updated = `translationStatus: ${expectedStatus}\n${updated}`;
  }
  if (updated === frontmatter) return null;
  return content.replace(match[0], `---\n${updated}\n---`);
}

export const unDraft = (content, locale = 'en') => publishFrontmatter(content, locale);

function localeForFile(file) {
  return file.endsWith('/en.md') || file.endsWith('.en.md') ? 'en' : 'zh-CN';
}

export async function publishBySlug(slug) {
  const matches = await findEntriesBySlug(slug);
  if (matches.length === 0) return { published: false, reason: 'not-found', entries: [] };

  const published = [];
  for (const entry of matches) {
    const content = await readFile(entry.file, 'utf8');
    const next = publishFrontmatter(content, localeForFile(entry.file));
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
