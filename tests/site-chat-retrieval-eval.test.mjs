import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { evaluateChunkSweep, evaluateRetrieval } from '../scripts/evaluate-chat-retrieval.mjs';

const cases = JSON.parse(
  await readFile(new URL('./fixtures/site-chat-retrieval-cases.json', import.meta.url), 'utf8'),
);
const challengeCases = JSON.parse(
  await readFile(new URL('./fixtures/site-chat-retrieval-challenge.json', import.meta.url), 'utf8'),
);
const redditInspiredCases = JSON.parse(
  await readFile(
    new URL('./fixtures/site-chat-reddit-inspired-cases.json', import.meta.url),
    'utf8',
  ),
);

test('chat retrieval evaluation set covers community questions and abstention cases', () => {
  assert.equal(cases.length, 50);
  assert.equal(cases.filter(({ kind }) => kind === 'in-scope').length, 40);
  assert.equal(cases.filter(({ kind }) => kind === 'context-required').length, 5);
  assert.equal(cases.filter(({ kind }) => kind === 'out-of-scope').length, 5);
  assert.equal(new Set(cases.map(({ id }) => id)).size, cases.length);
  assert.equal(
    cases.filter(({ sourceType }) => sourceType === 'community-inspired-synthetic').length,
    cases.length,
  );
  assert.ok(
    cases.every(
      ({ locale, question, sourceType }) =>
        locale === 'zh-CN' && question.length > 0 && sourceType === 'community-inspired-synthetic',
    ),
  );
});

test('synthetic challenge questions identify their origin and cover unseen article groups', () => {
  assert.equal(challengeCases.length, 35);
  assert.equal(new Set(challengeCases.map(({ id }) => id)).size, challengeCases.length);
  assert.ok(
    challengeCases.every(
      ({ sourceType, question }) => sourceType === 'llm-synthetic-reviewed' && question.length > 0,
    ),
  );
  assert.equal(challengeCases.filter(({ kind }) => kind === 'in-scope').length, 30);
  assert.equal(challengeCases.filter(({ category }) => category === 'site-unanswerable').length, 5);
  assert.equal(
    new Set(
      challengeCases
        .filter(({ kind }) => kind === 'in-scope')
        .map(({ id }) => id.replace(/-\d+$/, '')),
    ).size,
    10,
  );
  assert.equal(new Set(challengeCases.flatMap(({ relevantUrls }) => relevantUrls)).size, 14);
  assert.ok(
    challengeCases
      .filter(({ kind }) => kind === 'in-scope')
      .every(({ relevantUrls }) => relevantUrls.length > 0),
  );
});

test('Reddit-inspired questions are paraphrased, traceable, and include both in-scope and abstention cases', () => {
  assert.equal(redditInspiredCases.length, 31);
  assert.equal(redditInspiredCases.filter(({ kind }) => kind === 'in-scope').length, 25);
  assert.equal(redditInspiredCases.filter(({ kind }) => kind === 'out-of-scope').length, 6);
  assert.equal(new Set(redditInspiredCases.map(({ id }) => id)).size, redditInspiredCases.length);
  assert.ok(
    redditInspiredCases.every(
      ({ question, sourceType, sourceUrl }) =>
        question.length > 0 &&
        sourceType === 'reddit-inspired-synthetic' &&
        /^https:\/\/www\.reddit\.com\/r\//.test(sourceUrl),
    ),
  );
  assert.ok(
    redditInspiredCases
      .filter(({ kind }) => kind === 'in-scope')
      .every(({ relevantUrls }) => relevantUrls.length > 0),
  );
});

test('retrieval evaluation reports ranking misses separately from false retrievals', () => {
  const report = evaluateRetrieval(
    [
      {
        id: 'hit',
        kind: 'in-scope',
        locale: 'zh-CN',
        question: '反馈回路',
        expectedUrl: '/feedback/',
      },
      {
        id: 'context',
        kind: 'context-required',
        locale: 'zh-CN',
        question: '这篇讲什么？',
        expectedUrl: '/feedback/',
      },
      { id: 'miss', kind: 'in-scope', locale: 'zh-CN', question: '沟通', expectedUrl: '/missing/' },
      {
        id: 'false-positive',
        kind: 'out-of-scope',
        locale: 'zh-CN',
        question: '反馈回路',
        expectedUrl: null,
      },
    ],
    [{ title: '反馈回路', url: '/feedback/', locale: 'zh-CN', text: '团队通过反馈回路改进协作。' }],
  );

  assert.equal(report.inScope, 2);
  assert.equal(report.contextRequired, 1);
  assert.equal(report.hitAt1, 1);
  assert.equal(report.hitAt3, 1);
  assert.equal(report.misses[0].id, 'miss');
  assert.equal(report.falseRetrievals[0].id, 'false-positive');
  assert.equal(report.outOfScopeFalseRetrievalRate, 1);
});

test('retrieval evaluation accepts multiple valid sources and reports reciprocal rank', () => {
  const report = evaluateRetrieval(
    [
      {
        id: 'multi-source',
        kind: 'in-scope',
        locale: 'zh-CN',
        question: '团队指标怎么定义',
        relevantUrls: ['/metrics/one/', '/metrics/two/'],
      },
    ],
    [
      { title: '团队协作', url: '/other/', locale: 'zh-CN', text: '团队成员之间需要同步。' },
      { title: '指标定义', url: '/metrics/one/', locale: 'zh-CN', text: '团队指标需要共同定义。' },
      {
        title: '指标怎么定义',
        url: '/metrics/two/',
        locale: 'zh-CN',
        text: '怎么定义团队要看的指标。',
      },
    ],
  );

  assert.equal(report.hitAt3, 1);
  assert.equal(report.meanReciprocalRank, 1);
  assert.equal(report.recallAt3, 1);
  assert.equal(report.meanNdcgAt3, 1);
});

test('retrieval evaluation rewards finding more than one relevant source', () => {
  const report = evaluateRetrieval(
    [
      {
        id: 'two-relevant-sources',
        kind: 'in-scope',
        locale: 'zh-CN',
        question: '团队指标怎么定义',
        relevantUrls: ['/metrics/one/', '/metrics/two/'],
      },
    ],
    [
      { title: '其他文章', url: '/other/', locale: 'zh-CN', text: '团队工作需要协作。' },
      { title: '指标定义', url: '/metrics/one/', locale: 'zh-CN', text: '团队指标需要共同定义。' },
      { title: '指标怎么定义', url: '/metrics/two/', locale: 'zh-CN', text: '怎么定义团队要看的指标。' },
    ],
  );

  assert.equal(report.hitAt3, 1);
  assert.equal(report.recallAt3, 1);
  assert.equal(report.meanNdcgAt3, 1);
});

test('chunk sweep compares sizes with the same questions and reports index cost', () => {
  const results = evaluateChunkSweep(
    [
      {
        id: 'question',
        kind: 'in-scope',
        locale: 'zh-CN',
        question: '研发效率',
        expectedUrl: '/article/',
      },
    ],
    [
      {
        title: '研发效率',
        description: '一篇关于研发效率的文章。',
        url: '/article/',
        locale: 'zh-CN',
        excerpts: ['一篇关于研发效率的文章。', '研发效率需要团队共同定义并持续改进。'],
      },
    ],
    [40, 50],
  );

  assert.deepEqual(
    results.map(({ maxExcerptLength }) => maxExcerptLength),
    [40, 50],
  );
  assert.ok(
    results.every(
      ({ passages, indexBytes, hitAt3 }) =>
        passages > 0 && indexBytes > 0 && typeof hitAt3 === 'number',
    ),
  );
});
