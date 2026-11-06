import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateKeywords, classifyKeywords, linkOpportunities, matchKeywords, normalizeQuery, parseGscCsv, queryCore, isoWeek,
} from '../scripts/lib/seo-keywords.mjs';

test('normalizeQuery folds case, width, whitespace, and traditional characters', () => {
  assert.equal(normalizeQuery('  AI  Gateway 是什麼 '), 'ai gateway 是什么');
});

test('queryCore separates topic from intent so variants merge', () => {
  assert.equal(queryCore('ai gateway 是什麼').core, 'ai gateway');
  assert.equal(queryCore('ai gateway 是什么').core, 'ai gateway');
  assert.equal(queryCore('ai gateway 是什麼').intent, 'definition');
});

test('parseGscCsv reads Chinese headers and quoted cells', () => {
  const rows = parseGscCsv('热门查询,点击次数,展示,点击率,排名\n"a, b",1,"1,200",0.1%,8.5\n', { date: '2026-11-01', page: '/p/' });
  assert.deepEqual(rows[0], { date: '2026-11-01', page: '/p/', query: 'a, b', country: '', clicks: 1, impressions: 1200, position: 8.5 });
});

test('isoWeek follows ISO numbering', () => {
  assert.equal(isoWeek('2026-11-06'), '2026-W45');
  assert.equal(isoWeek('2026-01-01'), '2026-W01');
});

const rows = [
  { date: '2026-10-05', page: 'https://liyuk.com/a/', query: 'ai gateway 是什麼', clicks: 0, impressions: 20, position: 12 },
  { date: '2026-10-06', page: 'https://liyuk.com/a/', query: 'ai gateway 是什么', clicks: 0, impressions: 10, position: 10 },
  { date: '2026-10-06', page: 'https://liyuk.com/b/', query: 'ai gateway 是什么', clicks: 0, impressions: 5, position: 30 },
];

test('aggregation merges variants and weights position by impressions', () => {
  const [keyword] = classifyKeywords(aggregateKeywords(rows));
  assert.equal(keyword.impressions, 35);
  assert.equal(keyword.variants.length, 2);
  assert.ok(keyword.flags.includes('sprint'));
  assert.ok(keyword.flags.includes('cannibalization'));
});

test('matching respects locale and reports gaps instead of weak matches', () => {
  const keywords = classifyKeywords(aggregateKeywords(rows));
  const docs = [
    { url: '/a/', locale: 'zh-CN', title: 'AI Gateway 是什么', description: '模型路由与限流', excerpts: ['## AI Gateway\n\nAI Gateway 位于应用与模型之间。'] },
    { url: '/en/a/', locale: 'en', title: 'What an AI gateway does', description: '', excerpts: ['ai gateway'] },
  ];
  const [match] = matchKeywords(keywords, docs);
  assert.equal(match.primary.url, '/a/');
  const [gap] = matchKeywords(keywords, [docs[1]]);
  assert.equal(gap.primary, undefined);
  assert.equal(gap.gap, true);
});

test('keyword matcher reports declared query aliases when visible content supports the query', () => {
  const keyword = classifyKeywords(aggregateKeywords([
    { query: 'LLM gateway fallback', page: '', date: '2026-10-01', impressions: 0, clicks: 0, position: 0 },
  ]))[0];
  const [match] = matchKeywords([keyword], [{
    url: '/projects/router/',
    locale: 'en',
    title: 'Resilient model routing',
    description: 'A project description.',
    keywords: ['LLM gateway fallback'],
    excerpts: ['## LLM gateway fallback'],
  }]);
  assert.equal(match.primary?.url, '/projects/router/');
  assert.equal(match.primary?.keywordHit, true);
});

test('declared query metadata alone does not count as visible query coverage', () => {
  const keyword = classifyKeywords(aggregateKeywords([
    { query: '求职咨询', page: '', date: '2026-10-01', impressions: 6, clicks: 0, position: 71 },
  ]))[0];
  const [match] = matchKeywords([keyword], [{
    url: '/consulting/', locale: 'zh-CN', title: '职业发展与职场咨询 — Liyuk',
    description: '面向学生、工程师和管理者的职业发展、面试与工作决策。',
    keywords: ['求职咨询'], excerpts: ['## 职业路径与晋升'], isStaticPage: true,
  }]);
  assert.equal(match.primary, undefined);
  assert.equal(match.gap, true);
});

test('declared query targets outrank archive pages with only loose body overlap', () => {
  const keyword = classifyKeywords(aggregateKeywords([
    { query: 'Veylumi', page: '', date: '2026-10-01', impressions: 56, clicks: 0, position: 8 },
  ]))[0];
  const [match] = matchKeywords([keyword], [
    { url: '/en/projects/veylumi/', locale: 'en', title: 'Veylumi', description: 'AI beauty decision product.', keywords: ['Veylumi'], excerpts: ['Veylumi is a project.'] },
    { url: '/en/projects/2026/', locale: 'en', title: '2026 Projects', description: 'Recent projects.', keywords: [], excerpts: ['## Veylumi'], isStaticPage: true },
  ]);
  assert.equal(match.primary?.url, '/en/projects/veylumi/');
  assert.equal(match.primary?.keywordHit, true);
});

test('generic archive body overlap alone is not enough to claim a query is covered', () => {
  const keyword = classifyKeywords(aggregateKeywords([
    { query: 'frontline manager retention tools', page: '', date: '2026-10-01', impressions: 10, clicks: 0, position: 14 },
  ]))[0];
  const [match] = matchKeywords([keyword], [{
    url: '/en/writing/2023/', locale: 'en', title: '2023 Writing', description: 'Writing published in 2023.', keywords: [],
    excerpts: ['Frontline manager retention tools'], isStaticPage: true,
  }]);
  assert.equal(match.primary, undefined);
  assert.equal(match.gap, true);
});

test('static service pages match declared service wording without borrowing archive content', () => {
  const keyword = classifyKeywords(aggregateKeywords([
    { query: '求职咨询', page: '', date: '2026-10-01', impressions: 6, clicks: 0, position: 14 },
  ]))[0];
  const [match] = matchKeywords([keyword], [{
    url: '/consulting/', locale: 'zh-CN', title: '职业发展与职场咨询 — Liyuk', description: '面试与求职准备。',
    keywords: ['求职咨询', '面试辅导'], excerpts: ['## 求职咨询与面试辅导'], isStaticPage: true,
  }]);
  assert.equal(match.primary?.url, '/consulting/');
  assert.equal(match.primary?.keywordHit, true);
});

test('internal-link opportunities exclude pages that already link to the target', () => {
  const match = { core: 'ai gateway', locale: 'en', primary: { url: '/writing/ai-gateway/' } };
  const docs = [
    { url: '/writing/source-one/', locale: 'en', excerpts: ['AI Gateway'] , links: ['/writing/ai-gateway/'] },
    { url: '/writing/source-two/', locale: 'en', excerpts: ['AI Gateway'], links: [] },
  ];
  assert.deepEqual(linkOpportunities(match, docs), ['/writing/source-two/']);
});
