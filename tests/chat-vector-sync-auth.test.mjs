import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { syncChatVectors } from '../scripts/sync-chat-vectors.mjs';

for (const [service, permission, transientReadFailure] of [
  ['Vectorize', 'Vectorize Edit', false],
  ['Workers AI', 'Workers AI Read', false],
  ['Workers AI', 'Workers AI Read', true],
]) {
  test(`${service} authentication failure identifies the required permission${transientReadFailure ? ' after retrying a read timeout' : ''}`, async (t) => {
    const root = await mkdtemp(path.join(tmpdir(), 'chat-sync-auth-'));
    const previousCwd = process.cwd();
    t.after(async () => {
      process.chdir(previousCwd);
      await rm(root, { recursive: true, force: true });
    });
    await mkdir(path.join(root, 'dist/chat-index'), { recursive: true });
    await writeFile(path.join(root, 'wrangler.jsonc'), JSON.stringify({
      vectorize: [{ binding: 'VECTOR_INDEX', index_name: 'test-index' }],
    }));
    for (const locale of ['zh-CN', 'en']) {
      await writeFile(path.join(root, `dist/chat-index/${locale}.json`), JSON.stringify({
        documents: locale === 'en' ? [] : [{ url: '/', title: 'Article', excerpts: ['Published passage'] }],
      }));
    }
    process.chdir(root);
    if (transientReadFailure) t.mock.method(globalThis, 'setTimeout', (callback) => callback());
    const requests = [];
    t.mock.method(globalThis, 'fetch', async (url) => {
      requests.push(String(url));
      if (transientReadFailure && requests.length === 1) return new Response('Gateway timeout', { status: 504 });
      if (service === 'Workers AI' && String(url).endsWith('/list?count=1000')) {
        return Response.json({ success: true, result: { vectors: [] } });
      }
      return Response.json({ success: false, errors: [{ message: 'Authentication error' }] }, { status: 403 });
    });
    await assert.rejects(syncChatVectors({ accountId: 'test-account', token: 'test-token' }), (error) => {
      assert.match(error.message, /HTTP 403/);
      assert.match(error.message, /CLOUDFLARE_API_TOKEN/);
      assert.ok(error.message.includes(permission));
      assert.match(error.message, /account scope/);
      assert.ok(!error.message.includes('test-token'));
      return true;
    });
    assert.equal(requests.length, (service === 'Vectorize' ? 1 : 2) + Number(transientReadFailure));
  });
}
