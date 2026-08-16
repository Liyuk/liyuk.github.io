import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { notDraft, publishedIn } from '../src/lib/content-model.ts';
import { site } from '../src/data/site.mjs';
import { i18n } from '../src/i18n/index.mjs';
import { groupByYear, groupByYearMonth, sortByCreatedAt, sortByLastUpdatedAt } from '../src/lib/timeline.ts';
import { columnUrl, contentUrl, entryUrl, galleryUrl, tagUrl, writingUrl } from '../src/lib/content-paths.ts';
import { parseContentDate } from '../src/lib/content-date.ts';
import { getColumn, getColumnEntries, getIndexableTags, getRelatedEntries, getTag } from '../src/lib/taxonomy.ts';
import { getGalleryCover } from '../src/lib/gallery.ts';

test('the published predicates select non-draft content for the right locale', () => {
  assert.equal(notDraft({ data: { draft: false, locale: 'zh-CN' } }), true);
  assert.equal(notDraft({ data: { draft: true, locale: 'zh-CN' } }), false);
  assert.equal(publishedIn('zh-CN')({ data: { draft: false, locale: 'zh-CN' } }), true);
  assert.equal(publishedIn('zh-CN')({ data: { draft: false, locale: 'en' } }), false);
  assert.equal(publishedIn('en')({ data: { draft: false, locale: 'en' } }), true);
});

test('shared public copy lives in one site configuration', () => {
  assert.equal(site.locale, 'zh-CN');
  assert.equal(site.name, 'Liyuk');
  assert.equal(site.title, '沉默土豆的烹饪指南 — Liyuk');
  assert.equal(site.navigation[0].href, '/writing/');
  assert.equal(site.translation.mode, 'manual-review');
});

test('system copy is available in Chinese and English', () => {
  assert.equal(i18n('zh-CN').brand, '沉默土豆的烹饪指南');
  assert.equal(i18n('en').brand, 'Silent Potato’s Cookbook');
  assert.equal(i18n('zh-CN').navigation.writing, '写作');
  assert.equal(i18n('en').navigation.writing, 'Writing');
  assert.equal(i18n('en').theme.toDark, 'Switch to dark mode');
});

test('public page copy is centrally managed for both languages', () => {
  assert.deepEqual(i18n('zh-CN').page.home.title, ['沉默土豆的', '烹饪指南。']);
  assert.equal(i18n('zh-CN').page.writing.metaDescription, '关于技术、工作与日常的写作。');
  assert.equal(i18n('en').page.home.byline, 'Liyuk · Field Notes on Technology, Leadership & Life');
});

test('writing is ordered by publication date', () => {
  const olderPublishedLater = { data: { createdAt: new Date('2012-06-01'), publishedAt: new Date('2026-08-14') } };
  const newer = { data: { createdAt: new Date('2018-04-02'), publishedAt: new Date('2018-04-02') } };
  // sortByCreatedAt now keys on publishedAt: 2026-08-14 sorts before 2018-04-02.
  assert.deepEqual(sortByCreatedAt([newer, olderPublishedLater]), [olderPublishedLater, newer]);
});

test('writing can be ordered by its most recent public change', () => {
  const createdEarlierUpdatedLater = { data: { createdAt: new Date('2012-06-01'), publishedAt: new Date('2018-04-01'), updatedAt: new Date('2026-08-14') } };
  const createdLater = { data: { createdAt: new Date('2023-08-01'), publishedAt: new Date('2026-08-13') } };
  assert.deepEqual(sortByLastUpdatedAt([createdLater, createdEarlierUpdatedLater]), [createdEarlierUpdatedLater, createdLater]);
});

test('localized writing routes keep the year and month while hiding language filenames', () => {
  assert.equal(writingUrl('2026/08/example/zh', 'zh-CN'), '/writing/2026/08/example/');
  assert.equal(writingUrl('2026/08/example/en', 'en'), '/en/writing/2026/08/example/');
});

test('all public content uses dated, language-file-free URLs', () => {
  assert.equal(contentUrl('projects', '2026/08/example/zh'), '/projects/2026/08/example/');
  assert.equal(contentUrl('research', '2026/08/example/zh'), '/research/2026/08/example/');
});

test('galleries have a stable top-level photo URL and an explicit cover image', () => {
  const gallery = {
    data: {
      slug: 'tokyo-rain',
      cover: 'crossing',
      images: [
        { id: 'arrival', src: '/images/galleries/tokyo-rain/arrival.webp', alt: '雨中的站台', width: 1600, height: 1067 },
        { id: 'crossing', src: '/images/galleries/tokyo-rain/crossing.webp', alt: '雨中的人行横道', width: 1600, height: 2400 },
      ],
    },
  };
  assert.equal(galleryUrl(gallery.data.slug), '/photos/tokyo-rain/');
  assert.deepEqual(getGalleryCover(gallery), gallery.data.images[1]);
});

test('column members resolve to writing or gallery URLs in the current locale', () => {
  const essay = { id: '2026/08/example/zh', collection: 'writing', data: { locale: 'zh-CN' } };
  const gallery = { id: 'maomao', collection: 'gallery', data: { slug: 'maomao', locale: 'zh-CN' } };
  assert.equal(entryUrl(essay), '/writing/2026/08/example/');
  assert.equal(entryUrl(gallery), '/photos/maomao/');
  assert.equal(entryUrl(essay, 'en'), '/en/writing/2026/08/example/');
  assert.equal(entryUrl(gallery, 'en'), '/en/photos/maomao/');
});

test('dated content can be grouped into year and month archives', () => {
  const august = { data: { createdAt: new Date('2026-08-13') } };
  const earlierAugust = { data: { createdAt: new Date('2026-08-03') } };
  const july = { data: { createdAt: new Date('2026-07-31') } };
  assert.deepEqual(groupByYear([august, july]), [{ year: 2026, entries: [august, july] }]);
  assert.deepEqual(groupByYearMonth([august, earlierAugust, july]), [
    { year: 2026, month: 8, entries: [august, earlierAugust] },
    { year: 2026, month: 7, entries: [july] },
  ]);
});

test('date-only frontmatter keeps its stated calendar day in local archives', () => {
  const date = parseContentDate('2012-01-01');
  assert.equal(date.getFullYear(), 2012);
  assert.equal(date.getMonth(), 0);
  assert.equal(date.getDate(), 1);
});

test('tags keep stable slugs separate from localized labels and only index recurring content', () => {
  assert.equal(getTag('technology', 'zh-CN').label, '技术');
  assert.equal(getTag('technology', 'en').label, 'Technology');
  assert.equal(getTag('product', 'zh-CN').label, '产品');
  assert.equal(getTag('career', 'zh-CN').label, '职业成长');
  assert.equal(getTag('career', 'en').label, 'Career Growth');
  assert.equal(tagUrl('career'), '/tags/career/');
  assert.deepEqual(
    getIndexableTags([
      { data: { tags: ['career', 'engineering'] } },
      { data: { tags: ['career'] } },
      { data: { tags: ['career'] } },
    ]).map(({ slug, count }) => [slug, count]),
    [['career', 3]],
  );
});

test('columns have localized editorial copy, stable URLs, and preserve their declared reading order', () => {
  assert.equal(getColumn('data-metrics-guide', 'zh-CN').label, '数据度量工作指南');
  assert.equal(getColumn('thinking-training', 'en').label, 'Thinking Practice');
  assert.equal(columnUrl('data-metrics-guide'), '/columns/data-metrics-guide/');
  const laterChapter = { id: 'later', data: { column: { slug: 'data-metrics-guide', order: 2 } } };
  const firstChapter = { id: 'first', data: { column: { slug: 'data-metrics-guide', order: 1 } } };
  const unrelated = { id: 'other', data: { column: { slug: 'thinking-training', order: 1 } } };
  assert.deepEqual(getColumnEntries([laterChapter, unrelated, firstChapter], 'data-metrics-guide'), [firstChapter, laterChapter]);
});

test('column pages replace the legacy albums model', async () => {
  const columnIndex = await readFile(new URL('../src/pages/columns/index.astro', import.meta.url), 'utf8');
  const writingPage = await readFile(new URL('../src/pages/writing/[...slug].astro', import.meta.url), 'utf8');
  const uiCopy = await readFile(new URL('../src/i18n/index.mjs', import.meta.url), 'utf8');

  assert.match(columnIndex, /copy\.seriesLabel|copy\.count/);
  assert.doesNotMatch(columnIndex, /albumUrl|getAlbum/);
  assert.match(writingPage, /entry\.data\.column/);
  assert.doesNotMatch(writingPage, /entry\.data\.album/);
  assert.match(uiCopy, /seriesLabel/);
});

test('related content prefers a non-adjacent same-column entry over one that only shares tags', () => {
  const current = { id: 'current', data: { tags: ['metrics', 'data'], column: { slug: 'data-metrics-guide', order: 2 }, createdAt: new Date('2021-01-01') } };
  const prev = { id: 'prev', data: { column: { slug: 'data-metrics-guide', order: 1 }, createdAt: new Date('2018-01-01') } };
  const filler = { id: 'filler', data: { column: { slug: 'data-metrics-guide', order: 3 }, createdAt: new Date('2021-01-03') } };
  const distant = { id: 'distant', data: { column: { slug: 'data-metrics-guide', order: 4 }, createdAt: new Date('2018-01-02') } };
  const sharedTags = { id: 'tags', data: { tags: ['metrics', 'data'], createdAt: new Date('2021-01-02') } };
  assert.deepEqual(getRelatedEntries([current, prev, filler, distant, sharedTags], current, 5).map(({ entry }) => entry.id), ['distant', 'tags']);
});

test('related content excludes same-column neighbors already shown in column navigation', () => {
  const current = { id: 'current', data: { title: '数据度量', description: '从口径到复盘', tags: ['metrics', 'data'], column: { slug: 'data-metrics-guide', order: 1 }, createdAt: new Date('2021-01-01') } };
  const prevChapter = { id: 'column', data: { title: '数据度量', description: '从口径到复盘', tags: ['metrics', 'data'], column: { slug: 'data-metrics-guide', order: 0 }, createdAt: new Date('2018-01-01') } };
  const otherColumn = { id: 'other', data: { title: '数据度量', description: '从口径到复盘', tags: ['metrics', 'data'], createdAt: new Date('2021-01-02') } };
  assert.deepEqual(getRelatedEntries([current, prevChapter, otherColumn], current).map(({ entry }) => entry.id), ['other']);
});

test('related content returns an empty list when nothing scores above zero', () => {
  const current = { id: 'current', data: { title: 'zzz 完全不相关', description: 'zzz', tags: ['a-tag'], createdAt: new Date('2021-01-01') } };
  const unrelated = { id: 'other', data: { title: 'qqq 完全不同', description: 'qqq', tags: ['b-tag'], createdAt: new Date('2021-01-02') } };
  assert.deepEqual(getRelatedEntries([current, unrelated], current), []);
});

test('related content caps results at the requested limit', () => {
  const current = { id: 'current', data: { title: '共享标题甲', description: '共享描述甲', tags: ['tag'], createdAt: new Date('2021-01-01') } };
  const make = (id) => ({ id, data: { title: '共享标题乙', description: '共享描述乙', tags: ['tag'], createdAt: new Date('2021-01-02') } });
  const entries = [current, make('a'), make('b'), make('c'), make('d')];
  assert.equal(getRelatedEntries(entries, current, 2).length, 2);
});

test('related content keeps at most one same-column entry in the recommendations', () => {
  const current = { id: 'current', data: { column: { slug: 'c', order: 1 }, tags: ['tag'], createdAt: new Date('2021-01-01') } };
  const columnA = { id: 'a', data: { column: { slug: 'c', order: 2 }, tags: ['tag'], createdAt: new Date('2021-01-02') } };
  const columnB = { id: 'b', data: { column: { slug: 'c', order: 3 }, tags: ['tag'], createdAt: new Date('2021-01-03') } };
  const other = { id: 'o', data: { tags: ['tag'], createdAt: new Date('2021-01-04') } };
  const result = getRelatedEntries([current, columnA, columnB, other], current, 5);
  assert.equal(result.filter(({ entry }) => entry.id === 'a' || entry.id === 'b').length, 1);
});

test('related content localizes its reasons', () => {
  const current = { id: 'current', data: { title: '共享标题甲', description: '', tags: ['tag'], createdAt: new Date('2021-01-01') } };
  const other = { id: 'other', data: { title: '共享标题乙', description: '', tags: ['tag'], createdAt: new Date('2021-01-02') } };
  const zh = getRelatedEntries([current, other], current, 1, 'zh-CN');
  const en = getRelatedEntries([current, other], current, 1, 'en');
  assert.match(zh[0].reasons.join(' '), /共享标签/);
  assert.match(en[0].reasons.join(' '), /shared/);
  assert.doesNotMatch(en[0].reasons.join(' '), /共享标签/);
});

test('writing detail pages show publication and optional update dates without creation dates', async () => {
  const page = await readFile(new URL('../src/pages/writing/[...slug].astro', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../src/i18n/index.mjs', import.meta.url), 'utf8');

  assert.match(page, /ui\.entry\.publishedAt/);
  assert.match(page, /ui\.entry\.updatedAt/);
  assert.doesNotMatch(page, /ui\.entry\.createdAt/);
  assert.match(ui, /publishedAt: '发布于'/);
  assert.match(ui, /updatedAt: '更新于'/);
});

test('project detail pages render an optional editorial visual with meaningful alternative text', async () => {
  const page = await readFile(new URL('../src/pages/projects/[...slug].astro', import.meta.url), 'utf8');
  assert.match(page, /entry\.data\.hero/);
  assert.match(page, /project-hero/);
  assert.match(page, /alt=\{entry\.data\.hero\.alt\}/);
});
