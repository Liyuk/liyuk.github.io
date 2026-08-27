import test from 'node:test';
import assert from 'node:assert/strict';

import { contentKeywords, getPageSeo } from '../src/lib/seo.ts';

test('every indexable global page has localized SEO description and keywords', () => {
  const pages = ['home', 'writing', 'projects', 'research', 'photos', 'about', 'consulting', 'links', 'start', 'columns', 'tags'];

  for (const locale of ['zh-CN', 'en']) {
    for (const page of pages) {
      const seo = getPageSeo(locale, page);
      assert.ok(seo.description.length >= 30, `${locale}/${page} description is too short`);
      assert.ok(seo.keywords.length >= 3, `${locale}/${page} needs at least three keywords`);
      assert.equal(new Set(seo.keywords).size, seo.keywords.length, `${locale}/${page} has duplicate keywords`);
    }
  }
});

test('article keywords are localized from the article tag slugs', () => {
  assert.deepEqual(contentKeywords(['ai', 'developer-productivity', 'strategy'], 'zh-CN'), ['AI', '开发者生产力', 'Strategy']);
  assert.deepEqual(contentKeywords(['ai', 'developer-productivity', 'strategy'], 'en'), ['AI', 'Developer Productivity', 'Strategy']);
});

test('unknown article tags remain available as stable keyword values', () => {
  assert.deepEqual(contentKeywords(['new-topic'], 'en'), ['new-topic']);
});
