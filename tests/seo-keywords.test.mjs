import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateKeywords, classifyKeywords, matchKeywords, normalizeQuery, parseGscCsv, queryCore, isoWeek,
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
