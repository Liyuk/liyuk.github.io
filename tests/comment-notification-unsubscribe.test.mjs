import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/api/comment-notifications/unsubscribe.ts';

const token = 'a'.repeat(32);

function setup() {
  const calls = [];
  const env = {
    ENGAGEMENT_DB: {
      prepare(sql) {
        const query = { sql, values: [] };
        return {
          bind(...values) {
            query.values = values;
            return {
              async first() {
                calls.push(query);
                return { id: 'comment-id' };
              },
              async run() {
                calls.push(query);
                return { success: true };
              },
            };
          },
        };
      },
    },
  };
  return { calls, env };
}

test('unsubscribe links show a confirmation page without changing notification settings', async () => {
  const { calls, env } = setup();
  const response = await onRequest({
    request: new Request(`https://liyuk.com/api/comment-notifications/unsubscribe/?token=${token}`),
    env,
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /Stop email notifications/);
  assert.equal(calls.length, 0);
});

test('unsubscribe confirmation clears the address and cancels queued notifications', async () => {
  const { calls, env } = setup();
  const response = await onRequest({
    request: new Request('https://liyuk.com/api/comment-notifications/unsubscribe/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
      body: JSON.stringify({ token }),
    }),
    env,
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, unsubscribed: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].values[0], token);
  assert.equal(calls[1].values[0], token);
});

test('unsubscribe rejects cross-origin and malformed requests', async () => {
  const { calls, env } = setup();
  const crossOrigin = await onRequest({
    request: new Request('https://liyuk.com/api/comment-notifications/unsubscribe/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
      body: JSON.stringify({ token }),
    }),
    env,
  });
  const invalid = await onRequest({
    request: new Request('https://liyuk.com/api/comment-notifications/unsubscribe/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
      body: JSON.stringify({ token: 'invalid' }),
    }),
    env,
  });

  assert.equal(crossOrigin.status, 403);
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 0);
});
