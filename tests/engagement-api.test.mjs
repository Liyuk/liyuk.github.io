import test from 'node:test';
import assert from 'node:assert/strict';
import { onCommentsRequest, onLikesRequest } from '../functions/api/_shared/engagement.ts';

function makeDb({ comments = [], commentTotal = comments.length, likes = 0, rateCount = 1, parent = null, commentLikes = 0 } = {}) {
  const calls = [];
  const db = {
    prepare(sql) {
      const query = { sql, values: [] };
      return {
        bind(...values) {
          query.values = values;
          return {
            async all() {
              calls.push(query);
              if (sql.includes('FROM likes')) {
                return {
                  results: [
                    { target_type: 'article', target_id: '', count: likes },
                    { target_type: 'comment', target_id: 'c1', count: commentLikes },
                  ],
                };
              }
              if (sql.includes('AND c.parent_id IS NOT NULL')) {
                return { results: comments.filter((comment) => comment.parent_id) };
              }
              if (sql.includes('AND c.parent_id IS NULL')) {
                return { results: comments.filter((comment) => !comment.parent_id) };
              }
              return { results: comments };
            },
            async first() {
              calls.push(query);
              if (sql.includes('COUNT(*) AS count FROM comments')) return { count: commentTotal };
              return sql.includes('COUNT')
                ? { count: query.values[1] === 'comment' ? commentLikes : likes }
                : sql.includes('RETURNING')
                  ? { count: rateCount }
                  : sql.includes('SELECT id, parent_id')
                    ? parent
                    : sql.includes('FROM comments')
                      ? parent
                      : null;
            },
            async run() {
              calls.push(query);
              return { success: true };
            },
          };
        },
      };
    },
  };
  return { db, calls };
}

function request(method, path = '/api/comments/writing/example/', body, headers = {}) {
  return new Request(`https://liyuk.example${path}`, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('GET /comments returns only comments for one canonical article path', async () => {
  const { db, calls } = makeDb({
    comments: [{ id: 'c1', nickname: 'Lin', body: 'Thanks', created_at: '2026-10-01' }],
    likes: 3,
  });
  const response = await onCommentsRequest({ request: request('GET'), env: { ENGAGEMENT_DB: db } });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    comments: [
      {
        id: 'c1',
        nickname: 'Lin',
        body: 'Thanks',
        created_at: '2026-10-01',
        replies: [],
      },
    ],
    commentCount: 1,
    hasMore: false,
    nextCursor: null,
  });
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => !call.sql.includes('FROM likes')));
  assert.ok(calls[0].sql.includes("status = 'approved'"));
  assert.equal(calls[0].values[0], 'writing/example');
});

test('GET /comments keeps replies to replies flat under their top-level comment', async () => {
  const { db } = makeDb({
    comments: [
      { id: 'root', nickname: 'Lin', body: 'Question', created_at: '2026-10-01' },
      {
        id: 'reply',
        parent_id: 'root',
        reply_to_id: 'root',
        reply_to_nickname: 'Lin',
        nickname: 'Sam',
        body: 'Answer',
        created_at: '2026-10-02',
      },
      {
        id: 'reply-to-reply',
        parent_id: 'root',
        reply_to_id: 'reply',
        reply_to_nickname: 'Sam',
        nickname: 'Pat',
        body: 'Another answer',
        created_at: '2026-10-03',
      },
    ],
  });
  const response = await onCommentsRequest({ request: request('GET'), env: { ENGAGEMENT_DB: db } });

  assert.deepEqual(await response.json(), {
    comments: [
      {
        id: 'root',
        nickname: 'Lin',
        body: 'Question',
        created_at: '2026-10-01',
        replies: [
          {
            id: 'reply',
            parent_id: 'root',
            reply_to_id: 'root',
            reply_to_nickname: 'Lin',
            nickname: 'Sam',
            body: 'Answer',
            created_at: '2026-10-02',
          },
          {
            id: 'reply-to-reply',
            parent_id: 'root',
            reply_to_id: 'reply',
            reply_to_nickname: 'Sam',
            nickname: 'Pat',
            body: 'Another answer',
            created_at: '2026-10-03',
          },
        ],
      },
    ],
    commentCount: 3,
    hasMore: false,
    nextCursor: null,
  });
});

test('GET /comments reports the full approved count and a stable cursor for the next page', async () => {
  const comments = [
    { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', nickname: 'C', body: 'Third', created_at: '2026-10-03' },
    { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', nickname: 'B', body: 'Second', created_at: '2026-10-02' },
    { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', nickname: 'A', body: 'First', created_at: '2026-10-02' },
  ];
  const { db, calls } = makeDb({ comments, commentTotal: 9 });
  const response = await onCommentsRequest({
    request: request('GET', '/api/comments/writing/example/?limit=2'),
    env: { ENGAGEMENT_DB: db },
  });

  assert.deepEqual(await response.json(), {
    comments: [
      { ...comments[0], replies: [] },
      { ...comments[1], replies: [] },
    ],
    commentCount: 9,
    hasMore: true,
    nextCursor: { createdAt: '2026-10-02', id: comments[1].id },
  });
  assert.ok(calls.some((call) => call.sql.includes('COUNT(*) AS count FROM comments')));

  const cursor = encodeURIComponent('2026-10-02');
  await onCommentsRequest({
    request: request('GET', `/api/comments/writing/example/?limit=2&before=${cursor}&beforeId=${comments[1].id}`),
    env: { ENGAGEMENT_DB: db },
  });
  assert.ok(calls[3].sql.includes('(c.created_at = ? AND c.id < ?)'));
  assert.deepEqual(calls[3].values.slice(1, 5), ['2026-10-02', '2026-10-02', '2026-10-02', comments[1].id]);
});

test('GET /likes returns article and comment counts separately from comment data', async () => {
  const { db, calls } = makeDb({ likes: 3, commentLikes: 4 });
  const response = await onLikesRequest({
    request: request('GET', '/api/likes/writing/example/'),
    env: { ENGAGEMENT_DB: db },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { articleLikes: 3, commentLikes: { c1: 4 } });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].sql.includes('GROUP BY target_type, target_id'));
});

test('POST accepts a bounded anonymous comment but keeps it pending moderation', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request(
      'POST',
      undefined,
      { nickname: 'Reader', body: 'A useful note.' },
      { 'cf-connecting-ip': '192.0.2.1' },
    ),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, status: 'pending' });
  const insert = calls.find((call) => call.sql.includes('INSERT INTO comments'));
  assert.match(insert.values[0], /^[0-9a-f-]{36}$/i);
  assert.equal(insert.values[2], 'Reader');
  assert.equal(insert.values[3], 'A useful note.');
  assert.equal(insert.values[4], 'pending');
});

test('POST accepts an empty nickname and generates a locale-aware anonymous name', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request('POST', '/api/comments/en/writing/example/', {
      nickname: '   ',
      body: 'A note from an unnamed reader.',
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 201);
  const insert = calls.find((call) => call.sql.includes('INSERT INTO comments'));
  assert.match(insert.values[2], /^Anonymous [A-Z][a-z]+$/);
});

test('POST accepts a reply to an approved top-level comment and keeps it pending', async () => {
  const parentId = '33333333-3333-4333-8333-333333333333';
  const { db, calls } = makeDb({ parent: { id: parentId, parent_id: null } });
  const response = await onCommentsRequest({
    request: request('POST', undefined, {
      nickname: 'Reader',
      body: 'I have another thought.',
      replyToId: parentId,
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 201);
  const insert = calls.find((call) => call.sql.includes('INSERT INTO comments'));
  assert.equal(insert.values[5], parentId);
  assert.equal(insert.values[6], parentId);
});

test('POST accepts a reply to an approved reply but keeps it in the top-level thread', async () => {
  const replyToId = '33333333-3333-4333-8333-333333333333';
  const threadId = '44444444-4444-4444-8444-444444444444';
  const { db, calls } = makeDb({
    parent: { id: replyToId, parent_id: threadId },
  });
  const response = await onCommentsRequest({
    request: request('POST', undefined, {
      nickname: 'Reader',
      body: 'A nested reply.',
      replyToId,
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 201);
  const insert = calls.find((call) => call.sql.includes('INSERT INTO comments'));
  assert.equal(insert.values[5], threadId);
  assert.equal(insert.values[6], replyToId);
  assert.ok(calls.some((call) => call.sql.includes("target.status = 'approved'") && call.values[0] === replyToId));
});

test('POST rejects a reply when its target is not approved in this article', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request('POST', undefined, {
      nickname: 'Reader',
      body: 'A reply to an unavailable target.',
      replyToId: '33333333-3333-4333-8333-333333333333',
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 400);
  assert.equal(
    calls.some((call) => call.sql.includes('INSERT INTO comments')),
    false,
  );
});

test('POST rejects oversized comment bodies before touching storage', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request('POST', undefined, {
      nickname: 'Reader',
      body: 'x'.repeat(4001),
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test('POST rejects oversized request bodies before parsing or touching storage', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request('POST', undefined, {
      nickname: 'Reader',
      body: 'x'.repeat(12_000),
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 413);
  assert.equal(calls.length, 0);
});

test('PUT /likes records an idempotent article like and rejects an invalid visitor token', async () => {
  const { db, calls } = makeDb();
  const response = await onLikesRequest({
    request: request('PUT', '/api/likes/writing/example/', {
      visitorToken: '0123456789abcdef0123456789abcdef',
      targetType: 'article',
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, likes: 0 });
  const rateLimit = calls.find((call) => call.sql.includes('RETURNING likes AS count'));
  assert.ok(rateLimit.sql.includes('ON CONFLICT'));
  assert.ok(rateLimit.sql.includes('likes_window_start'));
  const insert = calls.find((call) => call.sql.includes('INSERT INTO likes'));
  assert.equal(insert.values[0], 'writing/example');

  const invalid = await onLikesRequest({
    request: request('PUT', '/api/likes/writing/example/', { visitorToken: 'short', targetType: 'article' }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });
  assert.equal(invalid.status, 400);
  assert.equal(calls.length, 4);
});

test('PUT /likes can like an approved individual comment', async () => {
  const commentId = '33333333-3333-4333-8333-333333333333';
  const { db, calls } = makeDb({
    parent: { id: commentId, parent_id: null, nickname: 'Reader', body: 'A useful comment.' },
    commentLikes: 4,
  });
  const response = await onLikesRequest({
    request: request('PUT', '/api/likes/writing/example/', {
      visitorToken: '0123456789abcdef0123456789abcdef',
      targetType: 'comment',
      targetId: commentId,
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, likes: 4 });
  const insert = calls.find((call) => call.sql.includes('INSERT INTO likes'));
  assert.equal(insert.values[1], 'comment');
  assert.equal(insert.values[2], commentId);
});

test('DELETE /likes removes the selected like and endpoints reject the other resource', async () => {
  const { db, calls } = makeDb();
  const unlike = await onLikesRequest({
    request: request('DELETE', '/api/likes/writing/example/', {
      visitorToken: '0123456789abcdef0123456789abcdef',
      targetType: 'article',
    }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });
  assert.equal(unlike.status, 200);
  assert.ok(calls.some((call) => call.sql.includes('DELETE FROM likes')));

  const wrongMethod = await onLikesRequest({
    request: request('POST', '/api/likes/writing/example/', { nickname: 'Reader', body: 'Hi' }),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });
  assert.equal(wrongMethod.status, 405);
});

test('POST enforces the per-IP comment rate limit before inserting a comment', async () => {
  const { db, calls } = makeDb({ rateCount: 6 });
  const response = await onCommentsRequest({
    request: request(
      'POST',
      undefined,
      { nickname: 'Reader', body: 'Too many.' },
      { 'cf-connecting-ip': '192.0.2.2' },
    ),
    env: { ENGAGEMENT_DB: db, RATE_LIMIT_SALT: 'test salt' },
  });
  assert.equal(response.status, 429);
  assert.equal(calls.length, 2);
  assert.ok(calls[1].sql.includes('comments_window_start'));
});

test('cross-origin requests are rejected before database access', async () => {
  const { db, calls } = makeDb();
  const response = await onCommentsRequest({
    request: request('GET', undefined, undefined, { origin: 'https://attacker.example' }),
    env: { ENGAGEMENT_DB: db },
  });
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('requests without an article path are rejected on each API', async () => {
  const response = await onCommentsRequest({
    request: request('GET', '/api/comments/'),
    env: { ENGAGEMENT_DB: makeDb().db },
  });
  assert.equal(response.status, 404);
  const likesResponse = await onLikesRequest({
    request: request('GET', '/api/likes/'),
    env: { ENGAGEMENT_DB: makeDb().db },
  });
  assert.equal(likesResponse.status, 404);
});
