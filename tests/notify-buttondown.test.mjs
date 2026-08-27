// Tests for the content-file → article grouping helpers in
// scripts/notify-buttondown.mjs. The email merge behaviour (one bilingual
// email per article, zh + en together) depends on entryKey returning a
// locale-independent identifier shared by a post's zh.md and en.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  isLegacySubjectOnlyEmail,
  readingMinutes,
} from '../scripts/notify-buttondown.mjs';

const CONTENT = 'src/content/';

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
