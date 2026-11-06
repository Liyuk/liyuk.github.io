import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSeoPage } from '../scripts/lib/seo-pages.mjs';

test('static page extraction preserves indexable metadata and reader-facing text', () => {
  const html = `<html lang="zh-CN"><head><title>求职咨询 — Liyuk</title>
    <meta name="description" content="面试与求职准备。">
    <meta name="keywords" content="求职咨询, 面试辅导">
    <link rel="canonical" href="https://liyuk.com/consulting/"></head>
    <body><h1>把复杂的职业问题谈清楚</h1><h2>面试与求职准备</h2>
    <p>围绕目标岗位拆解 JD，并进行模拟面试。</p><a href="/consulting/case/">案例</a>
    <a href="https://liyuk.com/writing/interview/">文章</a></body></html>`;

  assert.deepEqual(parseSeoPage(html, '/consulting/'), {
    url: '/consulting/',
    locale: 'zh-CN',
    title: '求职咨询 — Liyuk',
    description: '面试与求职准备。',
    keywords: ['求职咨询', '面试辅导'],
    links: ['/consulting/case/', '/writing/interview/'],
    excerpts: ['# 把复杂的职业问题谈清楚\n\n## 面试与求职准备\n\n围绕目标岗位拆解 JD，并进行模拟面试。'],
    isStaticPage: true,
  });
});

test('static page extraction excludes noindex and broken-canonical pages', () => {
  assert.equal(parseSeoPage('<html lang="en"><meta name="robots" content="noindex">', '/search/'), null);
  assert.equal(parseSeoPage('<html lang="en"><title>Page</title><link rel="canonical" href="https://elsewhere.example/">', '/bad/'), null);
});
