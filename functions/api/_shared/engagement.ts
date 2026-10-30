import { notifyOwner } from './notifications.ts';
import type { OwnerNotification } from './notifications.ts';

interface D1Statement {
  bind(...values: unknown[]): {
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    first<T = Record<string, unknown>>(): Promise<T | null>;
    run(): Promise<unknown>;
  };
}

interface EngagementEnvironment {
  ENGAGEMENT_DB: { prepare(sql: string): D1Statement };
  RATE_LIMIT_SALT?: string;
  NOTIFIER?: { fetch(input: string, init: RequestInit): Promise<Response> };
}

interface PagesContext {
  request: Request;
  env: EngagementEnvironment;
  waitUntil?: (promise: Promise<unknown>) => void;
}

const MAX_BODY_LENGTH = 4000;
const MAX_NICKNAME_LENGTH = 40;
const MAX_REQUEST_BYTES = 8192;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_ADDRESS = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const VISITOR_TOKEN = /^[a-f0-9]{32,64}$/i;
const COMMENT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const COMMENTS_PER_HOUR = 5;
const LIKES_PER_MINUTE = 5;
const ANONYMOUS_NAMES = [
  'Alex',
  'Avery',
  'Casey',
  'Jamie',
  'Jordan',
  'Morgan',
  'Quinn',
  'Riley',
  'Robin',
  'Sam',
  'Taylor',
];

type PublicComment = {
  id: string;
  nickname: string;
  body: string;
  created_at: string;
  replies?: PublicComment[];
  parent_id?: string | null;
  reply_to_id?: string | null;
  reply_to_nickname?: string | null;
};

async function consumeRateLimit(
  env: EngagementEnvironment,
  ip: string | null,
  metric: 'comments' | 'likes',
  maximum: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!env.RATE_LIMIT_SALT) return false;
  const bytes = new TextEncoder().encode(`${env.RATE_LIMIT_SALT}:${ip ?? 'local'}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const ipHash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const windowKey = new Date(windowStart * 1000).toISOString();
  const commentsWindowKey =
    metric === 'comments'
      ? windowKey
      : new Date(Math.floor(now / 3600) * 3600 * 1000).toISOString();
  const likesWindowKey =
    metric === 'likes' ? windowKey : new Date(Math.floor(now / 60) * 60 * 1000).toISOString();
  const expiresBefore = new Date((now - 86_400) * 1000).toISOString();
  const windowColumn = metric === 'comments' ? 'comments_window_start' : 'likes_window_start';
  await env.ENGAGEMENT_DB.prepare(
    `DELETE FROM comment_rate_limits
     WHERE comments_window_start < ? AND likes_window_start < ?`,
  )
    .bind(expiresBefore, expiresBefore)
    .run();
  const result = await env.ENGAGEMENT_DB.prepare(
    `INSERT INTO comment_rate_limits
       (ip_hash, comments_window_start, likes_window_start, comments, likes)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(ip_hash) DO UPDATE SET
       ${metric} = CASE WHEN comment_rate_limits.${windowColumn} = excluded.${windowColumn}
         THEN MIN(comment_rate_limits.${metric} + 1, ?) ELSE 1 END,
       ${windowColumn} = excluded.${windowColumn}
     RETURNING ${metric} AS count`,
  )
    .bind(
      ipHash,
      commentsWindowKey,
      likesWindowKey,
      metric === 'comments' ? 1 : 0,
      metric === 'likes' ? 1 : 0,
      maximum + 1,
    )
    .first<{ count: number }>();
  return Boolean(result && result.count <= maximum);
}

function articleKey(pathname: string, resource: 'comments' | 'likes'): string | null {
  const match = pathname.match(new RegExp(`^/api/${resource}/(.+)/$`));
  if (!match || match[1].split('/').some((part) => !part || part === '.' || part === '..'))
    return null;
  const segments = match[1].split('/');
  if (segments[0] === 'en') segments.shift();
  return segments.length >= 1 ? segments.join('/') : null;
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

async function readJson(request: Request): Promise<Record<string, unknown> | Response> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json({ error: 'Request body is too large.' }, 413);
  }
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Invalid JSON.' }, 400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return json({ error: 'Request body is too large.' }, 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const input: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!input || typeof input !== 'object' || Array.isArray(input))
      return json({ error: 'Invalid JSON.' }, 400);
    return input as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
}

async function handleGet(
  request: Request,
  env: EngagementEnvironment,
  key: string,
): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const before = url.searchParams.get('before');
  const beforeId = url.searchParams.get('beforeId');
  if (
    (before || beforeId) &&
    (!before || !beforeId || !COMMENT_ID.test(beforeId) || !Number.isFinite(Date.parse(before)))
  ) {
    return json({ error: 'Invalid comment cursor.' }, 400);
  }
  const roots = await env.ENGAGEMENT_DB.prepare(
    `SELECT c.id, c.nickname, c.body, c.created_at,
       c.parent_id
     FROM comments c
     WHERE c.article_key = ? AND c.status = 'approved' AND c.parent_id IS NULL
       AND (? IS NULL OR c.created_at < ? OR (c.created_at = ? AND c.id < ?))
     ORDER BY c.created_at DESC, c.id DESC LIMIT ?`,
  )
    .bind(key, before, before, before, beforeId, limit + 1)
    .all<PublicComment>();
  const pageRoots = roots.results.slice(0, limit);
  const hasMore = roots.results.length > limit;
  const lastRoot = pageRoots.at(-1);
  const replies = await env.ENGAGEMENT_DB.prepare(
    `SELECT c.id, c.parent_id, c.reply_to_id, c.nickname, c.body, c.created_at,
       target.nickname AS reply_to_nickname
     FROM comments c
     LEFT JOIN comments target
       ON target.id = c.reply_to_id
       AND target.article_key = c.article_key
       AND target.status = 'approved'
     WHERE c.article_key = ? AND c.status = 'approved' AND c.parent_id IS NOT NULL
       AND c.parent_id IN (
         SELECT id FROM comments
         WHERE article_key = ? AND status = 'approved' AND parent_id IS NULL
           AND (? IS NULL OR created_at < ? OR (created_at = ? AND id < ?))
         ORDER BY created_at DESC, id DESC LIMIT ?
       )
     ORDER BY c.created_at ASC`,
  )
    .bind(key, key, before, before, before, beforeId, limit)
    .all<PublicComment>();
  const repliesByParent = new Map<string, PublicComment[]>();
  for (const reply of replies.results) {
    if (!reply.parent_id) continue;
    const thread = repliesByParent.get(reply.parent_id) ?? [];
    thread.push(reply);
    repliesByParent.set(reply.parent_id, thread);
  }
  const comments = pageRoots.map((comment) => ({
    ...comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }));
  const count = await env.ENGAGEMENT_DB.prepare(
    "SELECT COUNT(*) AS count FROM comments WHERE article_key = ? AND status = 'approved'",
  )
    .bind(key)
    .first<{ count: number }>();
  return json({
    comments,
    commentCount: Number(count?.count ?? 0),
    hasMore,
    nextCursor: hasMore && lastRoot ? { createdAt: lastRoot.created_at, id: lastRoot.id } : null,
  });
}

async function handleGetLikes(env: EngagementEnvironment, key: string): Promise<Response> {
  const result = await env.ENGAGEMENT_DB.prepare(
    `SELECT target_type, target_id, COUNT(*) AS count
     FROM likes WHERE article_key = ?
     GROUP BY target_type, target_id`,
  )
    .bind(key)
    .all<{ target_type: 'article' | 'comment'; target_id: string; count: number }>();
  let articleLikes = 0;
  const commentLikes: Record<string, number> = Object.create(null);
  for (const row of result.results) {
    if (row.target_type === 'article') articleLikes = Number(row.count);
    else commentLikes[row.target_id] = Number(row.count);
  }
  return json({ articleLikes, commentLikes });
}

async function handleComment(
  context: PagesContext,
  input: Record<string, unknown>,
  env: EngagementEnvironment,
  key: string,
  locale: 'zh-CN' | 'en',
): Promise<Response> {
  const { request } = context;
  const requestedNickname = typeof input.nickname === 'string' ? input.nickname.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  const notifyOnReply = input.notifyOnReply === true;
  const suppliedEmail = typeof input.email === 'string' ? input.email.trim() : '';
  const notificationEmail = notifyOnReply ? suppliedEmail.toLowerCase() : null;
  const replyToId = input.replyToId ?? input.parentId ?? null;
  if (
    (typeof replyToId !== 'string' && replyToId !== null) ||
    (typeof replyToId === 'string' && !COMMENT_ID.test(replyToId)) ||
    requestedNickname.length > MAX_NICKNAME_LENGTH ||
    !body ||
    body.length > MAX_BODY_LENGTH ||
    (input.notifyOnReply !== undefined && typeof input.notifyOnReply !== 'boolean') ||
    (notifyOnReply &&
      (!notificationEmail ||
        notificationEmail.length > MAX_EMAIL_LENGTH ||
        !EMAIL_ADDRESS.test(notificationEmail)))
  ) {
    return json({ error: 'Nickname or comment is invalid.' }, 400);
  }
  let threadId: string | null = null;
  let replyToNickname: string | null = null;
  if (replyToId) {
    const target = await env.ENGAGEMENT_DB.prepare(
      `SELECT target.id, target.parent_id, target.nickname FROM comments target
       LEFT JOIN comments root ON root.id = target.parent_id AND root.article_key = target.article_key
       WHERE target.id = ? AND target.article_key = ? AND target.status = 'approved'
         AND (target.parent_id IS NULL OR (root.id IS NOT NULL AND root.status = 'approved'))`,
    )
      .bind(replyToId, key)
      .first<{ id: string; parent_id: string | null; nickname: string }>();
    if (!target) {
      return json({ error: 'Replies must target an approved comment in this thread.' }, 400);
    }
    threadId = target.parent_id ?? target.id;
    replyToNickname = target.nickname;
  }
  const nickname = requestedNickname || generateAnonymousName(locale);
  if (!env.RATE_LIMIT_SALT) return json({ error: 'Comment service is not configured.' }, 503);
  if (
    !(await consumeRateLimit(
      env,
      request.headers.get('cf-connecting-ip'),
      'comments',
      COMMENTS_PER_HOUR,
      3600,
    ))
  ) {
    return json({ error: 'Too many comments. Try again later.' }, 429);
  }
  const commentId = crypto.randomUUID();
  const notificationToken = notifyOnReply ? crypto.randomUUID().replaceAll('-', '') : null;
  await env.ENGAGEMENT_DB.prepare(
    `INSERT INTO comments
       (id, article_key, nickname, body, status, parent_id, reply_to_id,
        notification_email, notify_on_reply, notification_token, locale)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      commentId,
      key,
      nickname,
      body,
      'pending',
      threadId,
      replyToId,
      notificationEmail,
      notifyOnReply ? 1 : 0,
      notificationToken,
      locale,
    )
    .run();
  notifyOwner(context, {
    type: 'comment',
    commentId,
    articleKey: key,
    locale,
    nickname,
    body,
    replyToNickname,
  });
  return json({ ok: true, status: 'pending' }, 201);
}

async function handleLike(
  context: PagesContext,
  input: Record<string, unknown>,
  env: EngagementEnvironment,
  key: string,
  liked: boolean,
): Promise<Response> {
  const { request } = context;
  if (
    typeof input.visitorToken !== 'string' ||
    !VISITOR_TOKEN.test(input.visitorToken) ||
    (input.targetType !== 'article' && input.targetType !== 'comment')
  ) {
    return json({ error: 'Invalid vote.' }, 400);
  }
  if (!env.RATE_LIMIT_SALT) return json({ error: 'Like service is not configured.' }, 503);
  const commentId = input.targetId === undefined || input.targetId === null ? null : input.targetId;
  if (
    (input.targetType === 'article' && commentId !== null) ||
    (input.targetType === 'comment' &&
      (typeof commentId !== 'string' || !COMMENT_ID.test(commentId)))
  ) {
    return json({ error: 'Invalid comment.' }, 400);
  }
  let targetComment: { id: string; nickname: string; body: string } | null = null;
  if (commentId) {
    targetComment = await env.ENGAGEMENT_DB.prepare(
      `SELECT id, nickname, body FROM comments WHERE id = ? AND article_key = ? AND status = 'approved'`,
    )
      .bind(commentId, key)
      .first<{ id: string; nickname: string; body: string }>();
    if (!targetComment) return json({ error: 'Comment not found.' }, 404);
  }
  const targetType = input.targetType;
  const targetId = commentId ?? '';
  if (
    !(await consumeRateLimit(
      env,
      request.headers.get('cf-connecting-ip'),
      'likes',
      LIKES_PER_MINUTE,
      60,
    ))
  ) {
    return json({ error: 'Too many like changes. Try again later.' }, 429);
  }
  let changed = false;
  if (liked) {
    const result = await env.ENGAGEMENT_DB.prepare(
      `INSERT INTO likes (article_key, target_type, target_id, visitor_token) VALUES (?, ?, ?, ?)
       ON CONFLICT(article_key, target_type, target_id, visitor_token) DO NOTHING
       RETURNING visitor_token`,
    )
      .bind(key, targetType, targetId, input.visitorToken)
      .first<{ visitor_token: string }>();
    changed = Boolean(result);
  } else {
    const result = await env.ENGAGEMENT_DB.prepare(
      `DELETE FROM likes WHERE article_key = ? AND target_type = ? AND target_id = ? AND visitor_token = ?
       RETURNING visitor_token`,
    )
      .bind(key, targetType, targetId, input.visitorToken)
      .first<{ visitor_token: string }>();
    changed = Boolean(result);
  }
  const total = await env.ENGAGEMENT_DB.prepare(
    'SELECT COUNT(*) AS count FROM likes WHERE article_key = ? AND target_type = ? AND target_id = ?',
  )
    .bind(key, targetType, targetId)
    .first<{ count: number }>();
  if (liked && changed) {
    const pathname = new URL(request.url).pathname;
    const locale = pathname.startsWith('/api/likes/en/') ? 'en' : 'zh-CN';
    const notification: OwnerNotification = {
      type: 'like',
      articleKey: key,
      locale,
      targetType,
      likes: Number(total?.count ?? 0),
      ...(targetComment
        ? {
            targetNickname: targetComment.nickname,
            targetExcerpt: targetComment.body.slice(0, 400),
          }
        : {}),
    };
    notifyOwner(context, notification);
  }
  return json({ ok: true, likes: Number(total?.count ?? 0) });
}

function generateAnonymousName(locale: 'zh-CN' | 'en'): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
  const name = ANONYMOUS_NAMES[random % ANONYMOUS_NAMES.length] ?? 'Alex';
  return locale === 'en' ? `Anonymous ${name}` : `匿名 · ${name}`;
}

function rejectCrossOrigin(request: Request): Response | null {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  return origin && origin !== url.origin
    ? json({ error: 'Cross-origin request denied.' }, 403)
    : null;
}

export async function onCommentsRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  if (!env.ENGAGEMENT_DB) {
    return json({ error: 'Engagement is not enabled in this environment.' }, 404);
  }
  const key = articleKey(new URL(request.url).pathname, 'comments');
  if (!key) return json({ error: 'Not found.' }, 404);
  if (request.method === 'GET') return handleGet(request, env, key);
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const locale = new URL(request.url).pathname.startsWith('/api/comments/en/') ? 'en' : 'zh-CN';

  const input = await readJson(request);
  if (input instanceof Response) return input;
  return handleComment(context, input, env, key, locale);
}

export async function onLikesRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;
  if (!env.ENGAGEMENT_DB) {
    return json({ error: 'Engagement is not enabled in this environment.' }, 404);
  }
  const key = articleKey(new URL(request.url).pathname, 'likes');
  if (!key) return json({ error: 'Not found.' }, 404);
  if (request.method === 'GET') return handleGetLikes(env, key);
  if (request.method !== 'PUT' && request.method !== 'DELETE') {
    return json({ error: 'Method not allowed.' }, 405);
  }
  const input = await readJson(request);
  if (input instanceof Response) return input;
  return handleLike(context, input, env, key, request.method === 'PUT');
}
