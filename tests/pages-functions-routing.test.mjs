import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Pages Functions run only for the live AI chat endpoint', async () => {
  const routes = JSON.parse(await readFile(new URL('../public/_routes.json', import.meta.url), 'utf8'));

  assert.deepEqual(routes, {
    version: 1,
    include: ['/api/chat'],
    exclude: [],
  });
});
