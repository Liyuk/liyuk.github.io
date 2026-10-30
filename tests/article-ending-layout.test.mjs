import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { i18n } from '../src/i18n/index.mjs';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('comments use the centered article reading column', async () => {
  const component = await read('../src/components/Comments.astro');
  const styles = component.slice(component.indexOf('<style>'), component.indexOf('</style>'));
  const engagementRule = styles.match(/\.engagement\s*\{[^}]+\}/)?.[0] ?? '';

  assert.match(engagementRule, /max-width:\s*var\(--prose-w\)/);
  assert.match(engagementRule, /margin-inline:\s*auto/);
});

test('article likes are a separate end-of-article action', async () => {
  const comments = await read('../src/components/Comments.astro');
  const like = await read('../src/components/ArticleLike.astro').catch(() => '');
  assert.doesNotMatch(comments, /data-like(?:\s|\])/);
  assert.match(like, /data-article-like/);
  assert.match(like, /aria-pressed="false"/);

  const paths = [
    '../src/pages/writing/[...slug].astro',
    '../src/pages/research/[...slug].astro',
    '../src/pages/projects/[...slug].astro',
    '../src/pages/consulting/[...slug].astro',
    '../src/pages/photos/[slug].astro',
  ];
  for (const path of paths) {
    const page = await read(path);
    assert.ok(page.indexOf('<ArticleLike') >= 0, `${path}: missing article like`);
    assert.ok(page.indexOf('<ArticleLike') < page.indexOf('<ShareRow'), `${path}: like should precede sharing`);
    assert.ok(page.indexOf('<ShareRow') < page.indexOf('<Comments'), `${path}: sharing should precede comments`);
  }
  assert.equal(i18n('zh-CN').engagement.likeArticle, '喜欢这篇文章');
  assert.equal(i18n('en').engagement.likeArticle, 'Like this article');
});

test('article discussions follow navigation and precede related reading', async () => {
  const paths = [
    '../src/pages/writing/[...slug].astro',
    '../src/pages/research/[...slug].astro',
    '../src/pages/projects/[...slug].astro',
  ];

  for (const path of paths) {
    const page = await read(path);
    assert.ok(page.indexOf('post-pagination') < page.indexOf('<Comments'), `${path}: navigation should precede comments`);
    assert.ok(page.indexOf('<Comments') < page.indexOf('<RelatedEntries'), `${path}: related reading should follow comments`);
  }
});

test('consulting recommendations use the related reading section after comments', async () => {
  const page = await read('../src/pages/consulting/[...slug].astro');

  assert.match(page, /<RelatedEntries\s+items=\{relatedEntries\}/);
  assert.ok(page.indexOf('<Comments') < page.indexOf('<RelatedEntries'));
  assert.doesNotMatch(page, /<nav class="post-pagination"/);
});

test('consulting recommendations have localized card actions', () => {
  assert.equal(i18n('zh-CN').page.tagCards.consulting.label, '咨询');
  assert.equal(i18n('zh-CN').page.tagCards.consulting.action, '继续阅读');
  assert.equal(i18n('en').page.tagCards.consulting.label, 'Consulting');
  assert.equal(i18n('en').page.tagCards.consulting.action, 'Read on');
});

test('gallery navigation stays with the gallery, before discussion and related reading', async () => {
  const page = await read('../src/pages/photos/[slug].astro');

  assert.ok(page.indexOf('post-pagination') < page.indexOf('<ShareRow'));
  assert.ok(page.indexOf('<ShareRow') < page.indexOf('<Comments'));
  assert.ok(page.indexOf('<Comments') < page.indexOf('<RelatedEntries'));
});
