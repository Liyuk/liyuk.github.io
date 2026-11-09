import test from 'node:test';
import assert from 'node:assert/strict';

import { contentKeywords, fitSampleTitles, getPageSeo, pageTitle, visualWidth } from '../src/lib/seo.ts';

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
  assert.deepEqual(contentKeywords(['ai', 'developer-productivity', 'strategy'], 'zh-CN'), ['AI', '开发者生产力', '战略']);
  assert.deepEqual(contentKeywords(['ai', 'developer-productivity', 'strategy'], 'en'), ['AI', 'Developer Productivity', 'Strategy']);
});

test('unknown article tags remain available as stable keyword values', () => {
  assert.deepEqual(contentKeywords(['new-topic'], 'en'), ['new-topic']);
});

test('declared search queries join localized article keywords without duplicates', () => {
  assert.deepEqual(contentKeywords(['ai', 'strategy'], 'en', ['AI gateway guide', 'Gateway guide']), ['AI gateway guide', 'Gateway guide', 'AI', 'Strategy']);
});

test('pageTitle keeps the brand only while the title fits the width budget', () => {
  assert.equal(visualWidth('abc中文'), 7);
  assert.equal(pageTitle('Short title', 'Brand'), 'Short title — Brand');
  const long = '一个相当长的中文标题，已经接近页面标题的宽度预算上限';
  assert.equal(pageTitle(long, '沉默土豆的烹饪指南'), long);
});

test('fitSampleTitles drops sample titles until the description fits the budget', () => {
  const build = (titles) => `3 posts${titles.length ? `: ${titles.join('; ')}` : ''}.`;
  assert.equal(fitSampleTitles(build, ['A', 'B', 'C']), '3 posts: A; B; C.');
  assert.equal(fitSampleTitles(build, ['x'.repeat(100), 'y'.repeat(100)]), `3 posts: ${'x'.repeat(100)}.`);
  assert.equal(fitSampleTitles(build, ['x'.repeat(200)]), '3 posts.');
  assert.ok(visualWidth(fitSampleTitles(build, ['长'.repeat(60), '短'])) <= 160);
});
