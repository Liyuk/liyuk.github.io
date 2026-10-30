// Tests for the content-file → article grouping helpers in
// scripts/notify-buttondown.mjs. The email merge behaviour (one bilingual
// email per article, zh + en together) depends on entryKey returning a
// locale-independent identifier shared by a post's zh.md and en.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  buildMeta,
  buildEmailHtml,
  emailMatchesCandidate,
  entryKey,
  entryLocale,
  entryUrl,
  becamePublished,
  findEmailBySubject,
  formatDate,
  groupPublishBatch,
  gitShow,
  mergePublishedLanguage,
  orderPublishBatch,
  isLegacySubjectOnlyEmail,
  readingMinutes,
} from '../scripts/notify-buttondown.mjs';

const CONTENT = 'src/content/';

test('targeted notification dry-run includes only the requested published entry', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/notify-buttondown.mjs', '--entry', 'projects/2026/10/liyuk-skills'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout;
  assert.match(output, /Liyuk Skills: Engineering and Management Methods You Can Call on Demand/);
  assert.match(output, /将发送 1 封/);
  assert.doesNotMatch(output, /Adding an AI assistant to a blog/);
});

test('invalid targeted notification keys fail without falling back to a site-wide scan', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/notify-buttondown.mjs', '--entry', '../writing'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /entry must be one exact content key/);
});

test('entryKey returns the same identifier for zh.md and en.md of one post', () => {
  const zh = entryKey(`${CONTENT}projects/2026/08/dsh-skin-chatlab/zh.md`);
  const en = entryKey(`${CONTENT}projects/2026/08/dsh-skin-chatlab/en.md`);
  assert.equal(zh, en);
  assert.equal(zh, 'projects/2026/08/dsh-skin-chatlab');
});

test('entryKey distinguishes different posts and collections', () => {
  const writingZh = entryKey(`${CONTENT}writing/2026/08/dsh-plugin-toolbox/zh.md`);
  const projectZh = entryKey(`${CONTENT}projects/2026/08/dsh-plugin-toolbox/zh.md`);
  assert.notEqual(writingZh, projectZh);
});

test('entryKey handles galleries (tiny <slug>.md / <slug>.en.md)', () => {
  assert.equal(entryKey(`${CONTENT}galleries/maomao.md`), 'galleries/maomao');
  assert.equal(entryKey(`${CONTENT}galleries/maomao.en.md`), 'galleries/maomao');
  assert.equal(entryKey(`${CONTENT}galleries/maomao.en.mdx`), 'galleries/maomao');
});

test('entryKey ignores template files (returns null)', () => {
  assert.equal(entryKey(`${CONTENT}writing/_template.md`), null);
  assert.equal(entryKey(`${CONTENT}galleries/_template.md`), null);
});

test('entryLocale assigns zh/en from the file-name convention', () => {
  assert.equal(entryLocale(`${CONTENT}writing/2026/08/dsh-plugin-toolbox/zh.md`), 'zh');
  assert.equal(entryLocale(`${CONTENT}writing/2026/08/dsh-plugin-toolbox/en.md`), 'en');
  assert.equal(entryLocale(`${CONTENT}galleries/maomao.md`), 'zh');
  assert.equal(entryLocale(`${CONTENT}galleries/maomao.en.md`), 'en');
  assert.equal(entryLocale(`${CONTENT}writing/2026/08/example/en.mdx`), 'en');
  assert.equal(entryLocale(`${CONTENT}galleries/maomao.en.mdx`), 'en');
});

test('entryUrl follows canonical routes for dated content and galleries', () => {
  assert.equal(
    entryUrl(`${CONTENT}writing/2026/08/dsh-plugin-toolbox/zh.md`),
    '/writing/2026/08/dsh-plugin-toolbox/',
  );
  assert.equal(
    entryUrl(`${CONTENT}projects/2026/08/dsh-skin-chatlab/en.md`),
    '/en/projects/2026/08/dsh-skin-chatlab/',
  );
  assert.equal(entryUrl(`${CONTENT}galleries/maomao.md`), '/photos/maomao/');
  assert.equal(entryUrl(`${CONTENT}galleries/maomao.en.md`), '/en/photos/maomao/');
});

test('publish notifications only include new or newly published files', () => {
  const published = '---\ndraft: false\n---\n';
  const draft = '---\ndraft: true\n---\n';
  assert.equal(becamePublished(null, published), true);
  assert.equal(becamePublished(draft, published), true);
  assert.equal(
    becamePublished(published, published.replace('false', 'false\nupdatedAt: 2026-08-20')),
    false,
  );
  assert.equal(becamePublished(published, draft), false);
});

test('missing files in the base ref are treated as new content without fatal stderr', () => {
  const file = 'src/content/writing/2099/12/not-in-repository/zh.md';
  assert.equal(gitShow('HEAD', file), null);
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `import { gitShow } from ${JSON.stringify(new URL('../scripts/notify-buttondown.mjs', import.meta.url).href)}; gitShow('HEAD', ${JSON.stringify(`${process.cwd()}/${file}`)});`],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('Buttondown lookup errors fail closed', async () => {
  const result = await findEmailBySubject(
    'Same title',
    'https://liyuk.com/writing/a/',
    'token',
    async () => ({
      ok: false,
      status: 503,
      json: null,
    }),
  );
  assert.deepEqual(result, {
    ok: false,
    found: false,
    error: 'Buttondown lookup failed (HTTP 503)',
  });
});
test('readingMinutes counts Han chars for zh, word tokens for en', () => {
  const zh = '这是一段用来测试阅读时长的中文内容，需要足够的汉字数量。'.repeat(5);
  const hanzi = (zh.match(/\p{Script=Han}/gu) ?? []).length;
  assert.equal(readingMinutes(zh, 'zh-CN'), Math.max(1, Math.ceil(hanzi / 400)));

  const en = 'a '.repeat(500); // 500 words → ceil(500/400) = 2 min
  assert.equal(readingMinutes(en, 'en'), 2);
});

test('readingMinutes floors at 1 minute for empty body', () => {
  assert.equal(readingMinutes('', 'zh-CN'), 1);
  assert.equal(readingMinutes(undefined, 'en'), 1);
});

test('formatDate renders zh and en friendly forms', () => {
  assert.equal(formatDate('2026-08-16', 'zh-CN'), '2026年8月16日');
  assert.equal(formatDate('2026-08-16', 'en'), 'Aug 16, 2026');
  assert.equal(formatDate('', 'en'), '');
});

test('buildMeta combines reading time and date per language', () => {
  const body = 'word '.repeat(400); // 1 min
  const fm = { publishedAt: '2026-08-16' };
  assert.equal(buildMeta(fm, body, 'zh-CN'), '约 1 分钟阅读 · 2026年8月16日');
  assert.equal(buildMeta(fm, body, 'en'), '1 min read · Aug 16, 2026');
});

test('buildMeta omits the date when publishedAt is missing', () => {
  assert.equal(buildMeta({}, 'word', 'en'), '1 min read');
});

test('buildEmailHtml follows the site visual language', () => {
  const html = buildEmailHtml({
    blocks: [{
      lang: 'zh',
      title: '一篇新文章',
      summary: '这是摘要。',
      url: 'https://liyuk.com/writing/example/',
      meta: '约 1 分钟阅读 · 2026年8月25日',
    }],
  });
  assert.match(html, /background:#f7f4ee/);
  assert.match(html, /charset="UTF-8"/);
  assert.match(html, /color:#35685d/);
  assert.match(html, /Iowan Old Style/);
  assert.match(html, /border-top:1px solid #ddd8ce/);
  assert.match(html, /<table role="presentation"/);
  assert.match(html, /bgcolor="#35685d" style="padding:12px 20px;border-radius:4px;"/);
  assert.match(html, /display:block;border-radius:4px;background-color:#35685d;color:#fff/);
  assert.match(html, /阅读全文 · Read more/);
  assert.doesNotMatch(html, /#1456F0|border-radius:8px/);
});

test('buildEmailHtml makes relative article paths absolute for Buttondown', () => {
  const html = buildEmailHtml({
    blocks: [{
      lang: 'en',
      title: 'A new article',
      summary: 'A summary.',
      url: '/en/consulting/2026/08/example/',
    }],
  });
  assert.match(html, /href="https:\/\/liyuk\.com\/en\/consulting\/2026\/08\/example\/"/);
  assert.doesNotMatch(html, /href="\/en\/consulting\/2026\/08\/example\/"/);
});

test('publish batches keep one entry as a single-post email', () => {
  const article = {
    label: 'One post',
    subject: 'One post',
    url: '/writing/2026/10/one/',
    blocks: [{ lang: 'zh', title: 'One post', summary: 'Summary', url: '/writing/2026/10/one/' }],
  };

  assert.deepEqual(groupPublishBatch([article]), [article]);
  assert.deepEqual(groupPublishBatch([]), []);
});

test('publish batches include every article and both available languages in one digest', () => {
  const candidates = [
    {
      url: '/writing/2026/10/guide/',
      blocks: [
        { lang: 'zh', title: '专栏导读', summary: '中文摘要', url: '/writing/2026/10/guide/' },
        { lang: 'en', title: 'Series Guide', summary: 'English summary', url: '/en/writing/2026/10/guide/' },
      ],
    },
    {
      url: '/writing/2026/10/article-two/',
      blocks: [{ lang: 'zh', title: '第二篇', summary: '另一段摘要', url: '/writing/2026/10/article-two/' }],
    },
    {
      url: '/writing/2026/10/article-three/',
      blocks: [{ lang: 'en', title: 'Third Article', summary: 'More details', url: '/en/writing/2026/10/article-three/' }],
    },
  ];

  const [digest] = groupPublishBatch(candidates);
  assert.equal(groupPublishBatch(candidates).length, 1);
  assert.match(digest.subject, /^3 new posts from Liyuk · [a-f0-9]{8}$/);
  assert.equal(digest.articles.length, 3);
  assert.deepEqual(digest.articles.map((article) => article.blocks.length), [2, 1, 1]);

  const html = buildEmailHtml({ articles: digest.articles });
  assert.match(html, /Series Guide/);
  assert.match(html, /中文摘要/);
  assert.match(html, /第二篇/);
  assert.match(html, /Third Article/);
  assert.match(html, /本次汇总了 3 篇新文章/);
  assert.match(html, /href="https:\/\/liyuk\.com\/en\/writing\/2026\/10\/article-three\/"/);
  assert.equal(html.match(/<table role="presentation"/g)?.length, 4);
  assert.match(html, /中文阅读 ↗/);
  assert.match(html, /Read in English ↗/);
  assert.match(html, /bgcolor="#35685d"/);
});

test('a newly published article includes an already-published sibling language', () => {
  const zh = {
    lang: 'zh',
    title: '中文标题',
    summary: '中文摘要',
    url: '/writing/2026/10/example/',
  };
  const enFile = 'src/content/writing/2026/10/example/en.md';
  const englishFrontmatter = {
    draft: 'false',
    locale: 'en',
    title: 'English title',
    description: 'English summary',
    publishedAt: '2026-10-30',
  };

  const merged = mergePublishedLanguage([zh], englishFrontmatter, 'Body text', enFile);
  assert.deepEqual(merged.map((block) => block.lang), ['zh', 'en']);
  assert.equal(merged[1].title, 'English title');
  assert.equal(merged[1].url, '/en/writing/2026/10/example/');
  assert.deepEqual(mergePublishedLanguage([zh], { ...englishFrontmatter, draft: 'true' }, '', enFile), [zh]);
});

test('publish batch idempotency key is stable for the same set of articles', () => {
  const candidates = [
    { url: '/writing/a/', blocks: [{ lang: 'en', title: 'A', url: '/writing/a/' }] },
    { url: '/writing/b/', blocks: [{ lang: 'en', title: 'B', url: '/writing/b/' }] },
  ];
  const first = groupPublishBatch(candidates)[0].subject;
  const reversed = groupPublishBatch([...candidates].reverse())[0].subject;
  assert.equal(first, reversed);
});

test('publish batches follow column order, then date and title for mixed content', () => {
  const article = (title, url, extra = {}) => ({
    url,
    blocks: [{ lang: 'en', title, url }],
    ...extra,
  });
  const series = [
    article('Part 3', '/writing/part-3/', { columnSlug: 'series', columnOrder: 3 }),
    article('Guide', '/writing/guide/', { columnSlug: 'series', columnOrder: 1 }),
    article('Part 2', '/writing/part-2/', { columnSlug: 'series', columnOrder: 2 }),
  ];
  assert.deepEqual(orderPublishBatch(series).map((item) => item.blocks[0].title), ['Guide', 'Part 2', 'Part 3']);

  const mixed = [
    article('Later', '/writing/later/', { publishedAt: '2026-10-30' }),
    article('Earlier', '/writing/earlier/', { publishedAt: '2026-10-29' }),
  ];
  assert.deepEqual(orderPublishBatch(mixed).map((item) => item.blocks[0].title), ['Earlier', 'Later']);
});

test('email idempotency prefers canonical URL and remains compatible with legacy subject records', () => {
  const candidate = { subject: 'Same title', canonicalUrl: 'https://liyuk.com/writing/2026/08/a/' };
  assert.equal(
    emailMatchesCandidate(
      { subject: 'Same title', canonical_url: candidate.canonicalUrl },
      candidate,
    ),
    true,
  );
  assert.equal(
    emailMatchesCandidate(
      { subject: 'Same title', body: 'https://liyuk.com/writing/2026/08/other/' },
      candidate,
    ),
    false,
  );
  assert.equal(isLegacySubjectOnlyEmail({ subject: 'Same title' }, candidate.subject), true);
  assert.equal(
    isLegacySubjectOnlyEmail(
      { subject: 'Same title', canonical_url: 'https://liyuk.com/writing/2026/08/other/' },
      candidate.subject,
    ),
    false,
  );
});
