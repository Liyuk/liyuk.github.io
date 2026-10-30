export type Notification =
  | {
      type: 'comment';
      commentId: string;
      articleKey: string;
      locale: 'zh-CN' | 'en';
      nickname: string;
      body: string;
      replyToNickname: string | null;
    }
  | {
      type: 'like';
      articleKey: string;
      locale: 'zh-CN' | 'en';
      targetType: 'article' | 'comment';
      targetNickname?: string;
      targetExcerpt?: string;
      likes: number;
    };

export interface NotifierEnvironment {
  SMTP_HOST: string;
  SMTP_USERNAME: string;
  SMTP_PASSWORD?: string;
  NOTIFY_TO: string;
  NOTIFY_FROM: string;
  SITE_ORIGIN: string;
  D1_STUDIO_URL: string;
  ENGAGEMENT_DB?: D1Database;
}

interface D1Database {
  prepare(sql: string): {
    bind(...values: unknown[]): {
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface ScheduledController {
  cron: string;
  scheduledTime: number;
}

interface MailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
}

interface SmtpConfiguration {
  host: string;
  username: string;
  password: string;
}

type SendMail = (config: SmtpConfiguration, message: MailMessage) => Promise<unknown>;

interface ClaimedReplyNotification {
  id: number;
  comment_id: string;
  target_comment_id: string;
  recipient_email: string;
  notification_token: string;
  attempt_count: number;
}

interface ApprovedReply {
  article_key: string;
  locale: 'zh-CN' | 'en';
  reply_nickname: string;
  reply_body: string;
  recipient_nickname: string;
  notification_token: string;
}

const MAX_REQUEST_BYTES = 20_000;
const MAX_COMMENT_LENGTH = 4000;
const MAX_NICKNAME_LENGTH = 40;
const EMAIL_ADDRESS = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const COMMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function validArticleKey(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 300) return false;
  const segments = value.split('/');
  return (
    segments.length <= 12 &&
    segments.every(
      (segment) =>
        segment && segment !== '.' && segment !== '..' && !/[\u0000-\u001f\\]/.test(segment),
    )
  );
}

function isNotification(value: unknown): value is Notification {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (!validArticleKey(item.articleKey) || (item.locale !== 'zh-CN' && item.locale !== 'en'))
    return false;
  if (item.type === 'comment') {
    return (
      typeof item.commentId === 'string' &&
      COMMENT_ID.test(item.commentId) &&
      typeof item.nickname === 'string' &&
      item.nickname.length <= MAX_NICKNAME_LENGTH &&
      typeof item.body === 'string' &&
      item.body.trim().length > 0 &&
      item.body.length <= MAX_COMMENT_LENGTH &&
      (typeof item.replyToNickname === 'string' || item.replyToNickname === null)
    );
  }
  if (item.type === 'like') {
    return (
      (item.targetType === 'article' || item.targetType === 'comment') &&
      Number.isInteger(item.likes) &&
      (item.targetNickname === undefined ||
        (typeof item.targetNickname === 'string' &&
          item.targetNickname.length <= MAX_NICKNAME_LENGTH)) &&
      (item.targetExcerpt === undefined ||
        (typeof item.targetExcerpt === 'string' && item.targetExcerpt.length <= MAX_COMMENT_LENGTH))
    );
  }
  return false;
}

function articleUrl(notification: Notification, siteOrigin: string): string {
  return articleUrlFor(notification.articleKey, notification.locale, siteOrigin);
}

function articleUrlFor(articleKey: string, locale: 'zh-CN' | 'en', siteOrigin: string): string {
  const origin = new URL(siteOrigin);
  if (origin.protocol !== 'https:') throw new Error('Notification site origin must use HTTPS.');
  const localePrefix = locale === 'en' ? '/en' : '';
  const path = articleKey.split('/').map(encodeURIComponent).join('/');
  return new URL(`${localePrefix}/${path}/`, origin).href;
}

function replyMessageFor(reply: ApprovedReply, recipientEmail: string, siteOrigin: string) {
  const isEnglish = reply.locale === 'en';
  const url = articleUrlFor(reply.article_key, reply.locale, siteOrigin);
  const unsubscribeUrl = new URL(
    `/api/comment-notifications/unsubscribe/?token=${encodeURIComponent(reply.notification_token)}&locale=${reply.locale}`,
    siteOrigin,
  ).href;
  return {
    to: recipientEmail,
    subject: isEnglish
      ? 'Someone replied to your comment · liyuk.com'
      : '有人回复了你的评论 · liyuk.com',
    text: [
      isEnglish ? `Hi ${reply.recipient_nickname},` : `你好，${reply.recipient_nickname}：`,
      '',
      isEnglish
        ? `${reply.reply_nickname} replied to your comment:`
        : `${reply.reply_nickname} 回复了你的评论：`,
      '',
      reply.reply_body,
      '',
      `${isEnglish ? 'Read the discussion' : '查看讨论'}：${url}`,
      '',
      isEnglish
        ? `Stop reply emails for this comment: ${unsubscribeUrl}`
        : `停止接收这条评论的回复邮件：${unsubscribeUrl}`,
      '',
      isEnglish
        ? 'This email was sent from hello@liyuk.com because you opted in to reply notifications.'
        : '你曾选择接收回复通知；本邮件由 hello@liyuk.com 发出。',
    ].join('\n'),
  };
}

function smtpConfig(env: NotifierEnvironment): SmtpConfiguration {
  if (!env.SMTP_PASSWORD || !env.SMTP_USERNAME || !env.SMTP_HOST) {
    throw new Error('SMTP credentials are not configured.');
  }
  if (
    !EMAIL_ADDRESS.test(env.NOTIFY_FROM) ||
    env.SMTP_USERNAME.toLowerCase() !== env.NOTIFY_FROM.toLowerCase()
  ) {
    throw new Error('SMTP sender configuration is invalid.');
  }
  return { host: env.SMTP_HOST, username: env.SMTP_USERNAME, password: env.SMTP_PASSWORD };
}

async function deliverReplyNotifications(
  env: NotifierEnvironment,
  sendMail: SendMail,
): Promise<void> {
  if (!env.ENGAGEMENT_DB) return;
  const database = env.ENGAGEMENT_DB;
  await database
    .prepare(
      `UPDATE comment_reply_notifications
     SET status = 'failed', locked_at = NULL, recipient_email = '', notification_token = ''
     WHERE attempt_count >= 5 AND status IN ('pending', 'sending')
       AND (status = 'pending' OR locked_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 minutes'))`,
    )
    .bind()
    .run();
  const claimed = await database
    .prepare(
      `UPDATE comment_reply_notifications
     SET status = 'sending', attempt_count = attempt_count + 1,
         locked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id IN (
       SELECT id FROM comment_reply_notifications
       WHERE (status = 'pending' AND attempt_count < 5)
          OR (status = 'sending' AND attempt_count < 5
              AND locked_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-10 minutes'))
       ORDER BY id LIMIT 10
     )
     RETURNING id, comment_id, target_comment_id, recipient_email, notification_token, attempt_count`,
    )
    .bind()
    .all<ClaimedReplyNotification>();

  for (const notification of claimed.results) {
    try {
      const reply = await database
        .prepare(
          `SELECT reply.article_key, reply.locale, reply.nickname AS reply_nickname,
                reply.body AS reply_body, target.nickname AS recipient_nickname,
                target.notification_token
         FROM comment_reply_notifications outbox
         JOIN comments reply ON reply.id = outbox.comment_id AND reply.status = 'approved'
         JOIN comments target ON target.id = outbox.target_comment_id
           AND target.notify_on_reply = 1
           AND target.notification_email = outbox.recipient_email
           AND target.notification_token = outbox.notification_token
         WHERE outbox.id = ? AND outbox.status = 'sending'`,
        )
        .bind(notification.id)
        .first<ApprovedReply>();
      if (!reply) {
        await database
          .prepare(
            "UPDATE comment_reply_notifications SET status = 'cancelled', locked_at = NULL, recipient_email = '', notification_token = '' WHERE id = ? AND status = 'sending'",
          )
          .bind(notification.id)
          .run();
        continue;
      }
      const message = replyMessageFor(reply, notification.recipient_email, env.SITE_ORIGIN);
      await sendMail(smtpConfig(env), { from: env.NOTIFY_FROM, ...message });
      await database
        .prepare(
          "UPDATE comment_reply_notifications SET status = 'sent', sent_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), locked_at = NULL, recipient_email = '', notification_token = '' WHERE id = ? AND status = 'sending'",
        )
        .bind(notification.id)
        .run();
    } catch (error) {
      const status = notification.attempt_count >= 5 ? 'failed' : 'pending';
      await database
        .prepare(
          "UPDATE comment_reply_notifications SET status = ?, locked_at = NULL, recipient_email = CASE WHEN ? = 'failed' THEN '' ELSE recipient_email END, notification_token = CASE WHEN ? = 'failed' THEN '' ELSE notification_token END WHERE id = ? AND status = 'sending'",
        )
        .bind(status, status, status, notification.id)
        .run();
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : 'delivery_failed';
      console.error('Reply notification delivery failed.', code);
    }
  }
}

function messageFor(
  notification: Notification,
  siteOrigin: string,
  d1StudioUrl: string,
): { subject: string; text: string } {
  const url = articleUrl(notification, siteOrigin);
  if (notification.type === 'comment') {
    const isEnglish = notification.locale === 'en';
    const reply = notification.replyToNickname
      ? isEnglish
        ? `Target: @${notification.replyToNickname}`
        : `回复对象：@${notification.replyToNickname}`
      : isEnglish
        ? 'Type: top-level comment'
        : '类型：新留言';
    const lookupSql = `SELECT id, article_key, parent_id, reply_to_id, nickname, body, created_at\nFROM comments\nWHERE id = '${notification.commentId}';`;
    const approveSql = `UPDATE comments SET status = 'approved'\nWHERE id = '${notification.commentId}' AND status = 'pending';`;
    return {
      subject: `${isEnglish ? '[Comment pending review]' : '【评论待审核】'} ${notification.nickname} · ${notification.articleKey}`,
      text: [
        isEnglish ? 'NEW COMMENT · PENDING REVIEW' : '新评论 · 待审核',
        '────────────────────────',
        `${isEnglish ? 'Author' : '昵称'}：${notification.nickname}`,
        reply,
        `${isEnglish ? 'Comment ID' : '评论 ID'}：${notification.commentId}`,
        `${isEnglish ? 'Article' : '文章'}：${url}`,
        '',
        isEnglish ? 'COMMENT' : '留言内容',
        '────────────────────────',
        notification.body,
        '',
        isEnglish ? 'MODERATION · CLOUDFLARE D1' : '审核入口 · Cloudflare D1',
        d1StudioUrl,
        '',
        isEnglish
          ? 'Find this comment (run in D1 Studio):'
          : '查找这条评论（复制到 D1 Studio 执行）：',
        lookupSql,
        '',
        isEnglish ? 'Approve this comment:' : '审核通过（确认内容后执行）：',
        approveSql,
      ].join('\n'),
    };
  }

  const isEnglish = notification.locale === 'en';
  const target =
    notification.targetType === 'article'
      ? isEnglish
        ? 'the article'
        : '文章'
      : `${isEnglish ? 'a comment by' : '评论'} ${notification.targetNickname ?? ''}`.trim();
  const excerpt = notification.targetExcerpt ? `\n\n“${notification.targetExcerpt}”` : '';
  return {
    subject: `${isEnglish ? '[New like]' : '【新点赞】'} ${notification.articleKey}`,
    text: [
      isEnglish ? 'NEW LIKE' : '新点赞',
      '────────────────────────',
      `${isEnglish ? 'Target' : '点赞对象'}：${target}`,
      `${isEnglish ? 'Total likes' : '当前点赞数'}：${notification.likes}`,
      excerpt ? `${isEnglish ? 'Comment' : '评论内容'}：${excerpt.trim()}` : '',
      '',
      `${isEnglish ? 'Article' : '文章'}：${url}`,
    ].join('\n'),
  };
}

export function createNotifier(sendMail: SendMail) {
  return {
    async fetch(
      request: Request,
      env: NotifierEnvironment,
      context: ExecutionContext,
    ): Promise<Response> {
      if (request.method !== 'POST' || new URL(request.url).pathname !== '/notify')
        return json({ error: 'Not found.' }, 404);
      const declaredLength = Number(request.headers.get('content-length'));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES)
        return json({ error: 'Request body too large.' }, 413);

      let input: unknown;
      try {
        input = await request.json();
      } catch {
        return json({ error: 'Invalid JSON.' }, 400);
      }
      if (!isNotification(input)) return json({ error: 'Invalid notification.' }, 400);
      if (!env.SMTP_PASSWORD || !env.SMTP_USERNAME || !env.SMTP_HOST)
        return json({ error: 'SMTP credentials are not configured.' }, 503);
      if (
        !EMAIL_ADDRESS.test(env.NOTIFY_TO) ||
        !EMAIL_ADDRESS.test(env.NOTIFY_FROM) ||
        env.SMTP_USERNAME.toLowerCase() !== env.NOTIFY_FROM.toLowerCase()
      ) {
        return json({ error: 'SMTP email configuration is invalid.' }, 503);
      }

      let message: { subject: string; text: string };
      try {
        message = messageFor(input, env.SITE_ORIGIN, env.D1_STUDIO_URL);
      } catch {
        return json({ error: 'Email configuration is invalid.' }, 503);
      }

      context.waitUntil(
        sendMail(
          {
            host: env.SMTP_HOST,
            username: env.SMTP_USERNAME,
            password: env.SMTP_PASSWORD,
          },
          {
            from: env.NOTIFY_FROM,
            to: env.NOTIFY_TO,
            ...message,
          },
        ).catch((error: unknown) => {
          const code =
            typeof error === 'object' && error !== null && 'code' in error
              ? String(error.code)
              : 'delivery_failed';
          console.error('Aliyun SMTP delivery failed.', code);
        }),
      );
      return json({ accepted: true }, 202);
    },
    scheduled(
      _controller: ScheduledController,
      env: NotifierEnvironment,
      context: ExecutionContext,
    ): void {
      context.waitUntil(deliverReplyNotifications(env, sendMail));
    },
  };
}
