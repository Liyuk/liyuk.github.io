// Tests for the content-file → article grouping helpers in
// scripts/notify-buttondown.mjs. The email merge behaviour (one bilingual
// email per article, zh + en together) depends on entryKey returning a
// locale-independent identifier shared by a post's zh.md and en.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entryKey, entryLocale, readingMinutes, formatDate, buildMeta } from '../scripts/notify-buttondown.mjs';

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
