import test from 'node:test';
import assert from 'node:assert/strict';

import { readingMinutes } from '../src/lib/reading-time.ts';

test('Chinese counts Han characters, not collapsed word runs', () => {
  // 33 Han characters; a shared word-token regex would see this as ~3 "words".
  const zh = '结构化思维把材料变成可检查的命题，五镜负责发现联系。这句话有三十多个字。';
  const hanzi = (zh.match(/\p{Script=Han}/gu) ?? []).length;
  assert.equal(hanzi, 33);
  assert.equal(readingMinutes(zh, 'zh-CN'), Math.max(1, Math.ceil(hanzi / 400)));
});

test('English counts word tokens', () => {
  const en = 'Structured thinking turns material into checkable propositions, and the five lenses discover the connections.';
  const words = (en.match(/[A-Za-z0-9]+/g) ?? []).length;
  assert.equal(words, 14);
  assert.equal(readingMinutes(en, 'en'), Math.max(1, Math.ceil(words / 400)));
});

test('falls back to English word counting for non-Chinese locales', () => {
  const mixed = 'There are 42 apples in the box.';
  assert.equal(readingMinutes(mixed, 'fr'), readingMinutes(mixed, 'en'));
});

test('empty body still yields at least one minute', () => {
  assert.equal(readingMinutes('', 'zh-CN'), 1);
  assert.equal(readingMinutes(undefined, 'en'), 1);
});
