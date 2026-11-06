import test from 'node:test';
import assert from 'node:assert/strict';
import { handleSearchLog, parseSearchLog, sanitizeSearchQuery } from '../src/lib/search-log.mjs';

test('sanitizeSearchQuery normalizes and rejects personal-looking input', () => {
  assert.equal(sanitizeSearchQuery('  AI   Gateway '), 'ai gateway');
  assert.equal(sanitizeSearchQuery('a'), undefined);
  assert.equal(sanitizeSearchQuery('me@example.com'), undefined);
  assert.equal(sanitizeSearchQuery('call 13800138000'), undefined);
  assert.equal(sanitizeSearchQuery('https://example.com'), undefined);
  assert.equal(Array.from(sanitizeSearchQuery('x'.repeat(200))).length, 64);
});

test('parseSearchLog clamps numbers and defaults unknown fields', () => {
  assert.deepEqual(parseSearchLog({ q: 'ai gateway', locale: 'fr', kind: 'x', results: -3, rank: 2.5 }), {
    query: 'ai gateway', locale: 'zh-CN', kind: 'search', results: 0, rank: 0,
  });
});

test('handleSearchLog writes one anonymous data point and never reads identity headers', async () => {
  const points = [];
  const env = { SEARCH_LOG: { writeDataPoint: (point) => points.push(point) } };
  const request = new Request('https://liyuk.com/api/search-log', {
    method: 'POST',
    headers: { 'cf-connecting-ip': '203.0.113.9', 'user-agent': 'test' },
    body: JSON.stringify({ q: 'LLM gateway', locale: 'en', kind: 'search', results: 0 }),
  });
  assert.equal((await handleSearchLog(request, env)).status, 204);
  assert.equal(points.length, 1);
  assert.deepEqual(points[0].blobs, ['llm gateway', 'en', 'search']);
  assert.doesNotMatch(JSON.stringify(points[0]), /203\.0\.113\.9|test/u);
});

test('handleSearchLog is a no-op without a binding and rejects other methods', async () => {
  const post = new Request('https://liyuk.com/api/search-log', { method: 'POST', body: JSON.stringify({ q: 'abc' }) });
  assert.equal((await handleSearchLog(post, {})).status, 204);
  assert.equal((await handleSearchLog(new Request('https://liyuk.com/api/search-log'), {})).status, 405);
});
