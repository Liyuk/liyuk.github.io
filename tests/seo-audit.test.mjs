import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedAlternates, normalizePath } from '../scripts/audit-seo.mjs';

test('SEO alternates keep the default locale on the locale-free canonical route', () => {
  assert.deepEqual(expectedAlternates('/writing/example/'), {
    'zh-CN': 'https://liyuk.com/writing/example/',
    en: 'https://liyuk.com/en/writing/example/',
    'x-default': 'https://liyuk.com/writing/example/',
  });
  assert.deepEqual(expectedAlternates('/en/writing/example/'), {
    'zh-CN': 'https://liyuk.com/writing/example/',
    en: 'https://liyuk.com/en/writing/example/',
    'x-default': 'https://liyuk.com/writing/example/',
  });
});

test('SEO route normalization preserves trailing slashes and file paths', () => {
  assert.equal(normalizePath('https://liyuk.com/writing/example'), '/writing/example/');
  assert.equal(normalizePath('https://liyuk.com/robots.txt'), '/robots.txt');
});
