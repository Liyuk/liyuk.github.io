import test from 'node:test';
import assert from 'node:assert/strict';

import {
  estimateVectorizeFreeUsage,
  fuseRankings,
  rankVectorArticles,
} from '../scripts/evaluate-chat-vectors.mjs';

test('vector ranking groups passage matches by article and keeps locale boundaries', () => {
  const ranked = rankVectorArticles(
    [
      { url: '/zh/one/', locale: 'zh-CN', vector: [0.8, 0.6], passage: 'first' },
      { url: '/zh/one/', locale: 'zh-CN', vector: [1, 0], passage: 'better passage' },
      { url: '/en/one/', locale: 'en', vector: [1, 0], passage: 'wrong locale' },
      { url: '/zh/two/', locale: 'zh-CN', vector: [0, 1], passage: 'second' },
    ],
    [1, 0],
    'zh-CN',
  );

  assert.deepEqual(
    ranked.map(({ url, passage }) => [url, passage]),
    [
      ['/zh/one/', 'better passage'],
      ['/zh/two/', 'second'],
    ],
  );
});

test('reciprocal-rank fusion rewards sources found by both retrievers', () => {
  const ranked = fuseRankings([
    [{ url: '/shared/' }, { url: '/keyword-only/' }],
    [{ url: '/vector-only/' }, { url: '/shared/' }],
  ]);

  assert.equal(ranked[0].url, '/shared/');
  assert.deepEqual(
    new Set(ranked.map(({ url }) => url)),
    new Set(['/shared/', '/keyword-only/', '/vector-only/']),
  );
});

test('Vectorize free estimate counts indexed dimensions once plus each query vector', () => {
  const usage = estimateVectorizeFreeUsage({ vectorCount: 3_187, dimensions: 768 });

  assert.equal(usage.storedDimensions, 2_447_616);
  assert.equal(usage.monthlyQueryDimensionsForIndexBuild, 2_447_616);
  assert.equal(usage.maxQueriesWithinFreeQueryDimensions, 35_875);
  assert.equal(usage.withinFreeStorageDimensions, true);
});

test('Vectorize projection includes monthly new passage writes in free storage', () => {
  const usage = estimateVectorizeFreeUsage({
    vectorCount: 3_187,
    dimensions: 1_536,
    monthlyNewVectors: 100,
  });

  assert.equal(usage.projectedStoredDimensions, 5_048_832);
  assert.equal(usage.withinFreeStorageDimensions, false);
});
