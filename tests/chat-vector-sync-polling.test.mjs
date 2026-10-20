import test from 'node:test';
import assert from 'node:assert/strict';

import { waitForMutations } from '../scripts/sync-chat-vectors.mjs';

test('Vectorize mutation polling waits through stale index info until the target is processed', async (t) => {
  const processed = [undefined, 'previous-mutation', 'target-mutation'];
  let now = 0;
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    const processedUpToMutation = processed[requests++];
    return Response.json({ success: true, result: { processedUpToMutation } });
  });

  await waitForMutations(['target-mutation'], {
    accountId: 'test-account',
    token: 'test-token',
    indexName: 'test-index',
    timeoutMs: 10,
    pollIntervalMs: 1,
    now: () => now,
    pause: async (duration) => { now += duration; },
  });

  assert.equal(requests, 3);
});

test('Vectorize mutation timeout reports the last processed mutation', async (t) => {
  let now = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    success: true,
    result: { processedUpToMutation: 'previous-mutation' },
  }));

  await assert.rejects(waitForMutations(['target-mutation'], {
    accountId: 'test-account',
    token: 'test-token',
    indexName: 'test-index',
    timeoutMs: 2,
    pollIntervalMs: 1,
    now: () => now,
    pause: async (duration) => { now += duration; },
  }), /within 0\.002 seconds \(last processed mutation: previous-mutation\)/);
});
