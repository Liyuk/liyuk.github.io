import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createVectorizeUploadForm,
  planChatVectorSync,
  serializeVectorizeNdjson,
} from '../src/lib/chat-vector-sync.mjs';

test('vector sync embeds only new or changed passages and deletes passages no longer published', () => {
  const stableHash = planChatVectorSync([
    { id: 'stable', text: 'unchanged passage' },
  ]).manifest.passages.stable;
  const previous = {
    version: 1,
    model: '@cf/baai/bge-m3',
    passages: {
      stable: stableHash,
      changed: 'old-hash',
      removed: 'gone-hash',
    },
  };
  const current = [
    { id: 'stable', text: 'unchanged passage' },
    { id: 'changed', text: 'updated passage' },
    { id: 'new', text: 'new passage' },
  ];

  const plan = planChatVectorSync(current, previous);

  assert.deepEqual(plan.upsert.map(({ id }) => id), ['changed', 'new']);
  assert.deepEqual(plan.deleteIds, ['removed']);
  assert.deepEqual(Object.keys(plan.manifest.passages), ['stable', 'changed', 'new']);
});

test('vector sync treats changed embedding models as a full refresh of current passage IDs', () => {
  const plan = planChatVectorSync(
    [{ id: 'passage', text: 'same passage text' }],
    { version: 1, model: '@cf/old-model', passages: { passage: 'old-hash', removed: 'gone-hash' } },
  );

  assert.deepEqual(plan.upsert.map(({ id }) => id), ['passage']);
  assert.deepEqual(plan.deleteIds, ['removed']);
  assert.equal(plan.manifest.model, '@cf/baai/bge-m3');
});

test('Vectorize upload serialization emits one JSON vector record per NDJSON line', () => {
  const serialized = serializeVectorizeNdjson([
    { id: 'first', values: [0.1, 0.2], namespace: 'en', metadata: { contentHash: 'hash-1' } },
    { id: 'second', values: [0.3, 0.4], namespace: 'zh-CN', metadata: { contentHash: 'hash-2' } },
  ]);

  assert.deepEqual(serialized.trim().split('\n').map((line) => JSON.parse(line)), [
    { id: 'first', values: [0.1, 0.2], namespace: 'en', metadata: { contentHash: 'hash-1' } },
    { id: 'second', values: [0.3, 0.4], namespace: 'zh-CN', metadata: { contentHash: 'hash-2' } },
  ]);
  assert.ok(serialized.endsWith('\n'));
});

test('Vectorize upsert upload sends NDJSON in the vectors multipart field', async () => {
  const vectors = [{ id: 'passage-1', values: [0.1, 0.2], namespace: 'en' }];

  const form = createVectorizeUploadForm(vectors);
  const file = form.get('vectors');

  assert.equal(form.has('body'), false);
  assert.ok(file instanceof File);
  assert.equal(file.name, 'vectors.ndjson');
  assert.equal(file.type, 'application/x-ndjson');
  assert.deepEqual(JSON.parse(await file.text()), vectors[0]);
});
