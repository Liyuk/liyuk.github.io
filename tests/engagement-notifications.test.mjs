import assert from 'node:assert/strict';
import test from 'node:test';
import { onCommentsRequest, onLikesRequest } from '../functions/api/_shared/engagement.ts';
import { createNotifier } from '../workers/email-notifier/src/notifier.ts';

const commentId = '33333333-3333-4333-8333-333333333333';
const token = '0123456789abcdef0123456789abcdef';

function setup({ likeChanges = 1, target = { id: commentId, parent_id: null, nickname: 'Avery', body: 'Original thought' } } = {}) {
  const calls = [];
  const notifications = [];
  const pending = [];
  const db = {
    prepare(sql) {
      const query = { sql, values: [] };
      return {
        bind(...values) {
          query.values = values;
          return {
            async first() {
              calls.push(query);
              if (sql.includes('COUNT(*)')) return { count: 1 };
              if (sql.includes('RETURNING comments AS count') || sql.includes('RETURNING likes AS count')) return { count: 1 };
              if (sql.includes('INSERT INTO likes') || sql.includes('DELETE FROM likes')) return likeChanges ? { visitor_token: token } : null;
              if (sql.includes('SELECT target.id, target.parent_id')) return target;
              if (sql.includes('SELECT id, nickname, body FROM comments')) return target;
              return null;
            },
            async run() {
              calls.push(query);
              return { success: true, meta: { changes: sql.includes('INSERT INTO likes') ? likeChanges : 1 } };
            },
            async all() { calls.push(query); return { results: [] }; },
          };
        },
      };
    },
  };
  const env = {
    ENGAGEMENT_DB: db,
    RATE_LIMIT_SALT: 'test salt',
    SITE_ORIGIN: 'https://liyuk.com',
    NOTIFIER: {
      fetch: async (url, init) => {
        notifications.push({ url: String(url), ...init, body: JSON.parse(init.body) });
        return new Response(null, { status: 202 });
      },
    },
  };
  const context = { env, waitUntil: (promise) => pending.push(promise) };
  return { calls, notifications, pending, context };
}

function request(method, path, body) {
  return new Request(`https://liyuk.example${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
    body: JSON.stringify(body),
  });
}

test('a submitted comment queues a moderation email without delaying or failing the API response', async () => {
  const { context, notifications, pending } = setup();
  const response = await onCommentsRequest({
    ...context,
    request: request('POST', '/api/comments/en/writing/2026/10/example/', { nickname: 'Reader', body: 'A useful note.' }),
  });

  assert.equal(response.status, 201);
  assert.equal(pending.length, 1);
  await Promise.all(pending);
  assert.equal(notifications[0].url, 'https://email-notifier.internal/notify');
  const { commentId: notificationId, ...notification } = notifications[0].body;
  assert.match(notificationId, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(notification, {
    type: 'comment',
    articleKey: 'writing/2026/10/example',
    locale: 'en',
    nickname: 'Reader',
    body: 'A useful note.',
    replyToNickname: null,
  });
});

test('new article, comment, and reply likes queue notifications; unlikes and duplicate likes do not', async () => {
  const article = setup({ likeChanges: 1 });
  await onLikesRequest({
    ...article.context,
    request: request('PUT', '/api/likes/writing/example/', { visitorToken: token, targetType: 'article' }),
  });
  await Promise.all(article.pending);
  assert.equal(article.notifications[0].body.targetType, 'article');

  const comment = setup({ likeChanges: 1 });
  await onLikesRequest({
    ...comment.context,
    request: request('PUT', '/api/likes/writing/example/', { visitorToken: token, targetType: 'comment', targetId: commentId }),
  });
  await Promise.all(comment.pending);
  assert.equal(comment.notifications[0].body.targetType, 'comment');
  assert.equal(comment.notifications[0].body.targetNickname, 'Avery');
  assert.equal(comment.notifications[0].body.targetExcerpt, 'Original thought');

  const duplicate = setup({ likeChanges: 0 });
  await onLikesRequest({
    ...duplicate.context,
    request: request('PUT', '/api/likes/writing/example/', { visitorToken: token, targetType: 'article' }),
  });
  assert.equal(duplicate.pending.length, 0);

  const unlike = setup({ likeChanges: 1 });
  await onLikesRequest({
    ...unlike.context,
    request: request('DELETE', '/api/likes/writing/example/', { visitorToken: token, targetType: 'article' }),
  });
  assert.equal(unlike.pending.length, 0);
});

test('email delivery failures do not turn a stored comment or like into an API failure', async () => {
  const { context, pending } = setup();
  context.env.NOTIFIER.fetch = async () => { throw new Error('email service unavailable'); };
  const response = await onCommentsRequest({
    ...context,
    request: request('POST', '/api/comments/writing/example/', { nickname: 'Reader', body: 'Still stored.' }),
  });
  assert.equal(response.status, 201);
  await assert.doesNotReject(Promise.all(pending));
});

test('the notifier sends validated notifications from the Aliyun mailbox to the configured owner inbox', async () => {
  const messages = [];
  const background = [];
  const notifier = createNotifier(async (smtp, message) => { messages.push({ smtp, ...message }); });
  const env = {
    SMTP_HOST: 'smtp.qiye.aliyun.com',
    SMTP_USERNAME: 'hello@liyuk.com',
    SMTP_PASSWORD: 'test-client-password',
    NOTIFY_TO: 'likun.liyuk@gmail.com',
    NOTIFY_FROM: 'hello@liyuk.com',
    SITE_ORIGIN: 'https://liyuk.com',
    D1_STUDIO_URL: 'https://dash.cloudflare.com/account/workers/d1/databases/database/studio',
  };
  const response = await notifier.fetch(
    new Request('https://email-notifier.internal/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'comment', commentId, articleKey: 'writing/example', locale: 'zh-CN', nickname: 'Reader', body: '<script>Hi</script>', replyToNickname: 'Avery' }),
    }),
    env,
    { waitUntil: (promise) => background.push(promise) },
  );

  assert.equal(response.status, 202);
  await Promise.all(background);
  assert.deepEqual(messages[0].smtp, {
    host: 'smtp.qiye.aliyun.com',
    username: 'hello@liyuk.com',
    password: 'test-client-password',
  });
  assert.equal(messages[0].to, 'likun.liyuk@gmail.com');
  assert.equal(messages[0].from, 'hello@liyuk.com');
  assert.match(messages[0].subject, /评论待审核/);
  assert.match(messages[0].text, /https:\/\/liyuk\.com\/writing\/example\//);
  assert.match(messages[0].text, /<script>Hi<\/script>/);
  assert.match(messages[0].text, /审核入口 · Cloudflare D1/);
  assert.match(messages[0].text, /D1 Studio 执行/);
  assert.match(messages[0].text, /https:\/\/dash\.cloudflare\.com\/account\/workers\/d1\/databases\/database\/studio/);
  assert.match(messages[0].text, new RegExp(`WHERE id = '${commentId}'`));
  assert.match(messages[0].text, /UPDATE comments SET status = 'approved'/);
});

test('missing Aliyun SMTP credentials leave likes and comments intact but reject email delivery', async () => {
  const notifier = createNotifier(async () => assert.fail('SMTP must not run without its password'));
  const response = await notifier.fetch(
    new Request('https://email-notifier.internal/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'like', articleKey: 'writing/example', locale: 'zh-CN', targetType: 'article', likes: 1 }),
    }),
    {
      SMTP_HOST: 'smtp.qiye.aliyun.com',
      SMTP_USERNAME: 'hello@liyuk.com',
      NOTIFY_TO: 'likun.liyuk@gmail.com',
      NOTIFY_FROM: 'hello@liyuk.com',
      SITE_ORIGIN: 'https://liyuk.com',
      D1_STUDIO_URL: 'https://dash.cloudflare.com/account/workers/d1/databases/database/studio',
    },
    { waitUntil: () => assert.fail('SMTP must not be queued without its password') },
  );
  assert.equal(response.status, 503);
});
