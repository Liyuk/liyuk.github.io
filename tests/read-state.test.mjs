import test from 'node:test';
import assert from 'node:assert/strict';

import { addReadKey, parseReadList, readKey } from '../src/lib/read-state.ts';

test('readKey shares one key across locales and drops query and hash', () => {
  assert.equal(readKey('/writing/2026/03/example/'), '/writing/2026/03/example/');
  assert.equal(readKey('/en/writing/2026/03/example/'), '/writing/2026/03/example/');
  assert.equal(readKey('/writing/2026/03/example/?context=column#part-2'), '/writing/2026/03/example/');
  assert.equal(readKey('/writing/2026/03/example'), '/writing/2026/03/example/');
  assert.equal(readKey('/en/'), '/');
});

test('parseReadList tolerates missing or corrupted storage', () => {
  assert.deepEqual(parseReadList(null), []);
  assert.deepEqual(parseReadList('not json'), []);
  assert.deepEqual(parseReadList('{"a":1}'), []);
  assert.deepEqual(parseReadList('["/a/", 3, "/b/"]'), ['/a/', '/b/']);
});

test('addReadKey is idempotent and bounded', () => {
  const list = ['/a/'];
  assert.equal(addReadKey(list, '/a/'), list);
  assert.deepEqual(addReadKey(list, '/b/'), ['/a/', '/b/']);
  const full = Array.from({ length: 1000 }, (_, i) => `/p${i}/`);
  const next = addReadKey(full, '/new/');
  assert.equal(next.length, 1000);
  assert.equal(next.at(-1), '/new/');
  assert.equal(next[0], '/p1/');
});
