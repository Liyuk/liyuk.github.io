interface Context {
  request: Request;
  env: {
    ENGAGEMENT_DB?: {
      prepare(sql: string): {
        bind(...values: unknown[]): {
          first<T = Record<string, unknown>>(): Promise<T | null>;
          run(): Promise<unknown>;
        };
      };
    };
  };
}

const NOTIFICATION_TOKEN = /^[a-f0-9]{32}$/i;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

function confirmationPage(token: string, locale: 'zh-CN' | 'en'): Response {
  const safeToken = JSON.stringify(token);
  const isEnglish = locale === 'en';
  const title = isEnglish ? 'Email notification settings' : '邮件通知设置';
  const heading = isEnglish ? 'Stop reply notifications?' : '停止接收回复通知？';
  const detail = isEnglish
    ? 'This will remove the email address saved for this comment. Replies will still appear on the article.'
    : '确认后会删除这条评论保存的邮箱。之后仍可在文章评论区看到回复。';
  const button = isEnglish ? 'Stop email notifications' : '停止邮件通知';
  const done = isEnglish
    ? 'You are unsubscribed. Your email address has been removed.'
    : '已取消通知，保存的邮箱地址已删除。';
  const failed = isEnglish
    ? 'Could not update notification settings.'
    : '暂时无法更新通知设置，请稍后重试。';
  return new Response(
    `<!doctype html>
<html lang="${isEnglish ? 'en' : 'zh-CN'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${title}</title>
<body style="max-width:36rem;margin:4rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif;color:#252522">
  <h1>${heading}</h1>
  <p>${detail}</p>
  <button id="stop" type="button">${button}</button>
  <p id="status" role="status"></p>
  <script>
    const token = ${safeToken};
    document.querySelector('#stop').addEventListener('click', async () => {
      const button = document.querySelector('#stop');
      button.disabled = true;
      try {
        const response = await fetch(location.pathname, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error(${JSON.stringify(failed)});
        document.querySelector('#status').textContent = ${JSON.stringify(done)};
        button.remove();
      } catch (error) {
        document.querySelector('#status').textContent = error.message;
        button.disabled = false;
      }
    });
  </script>
</body></html>`,
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
      },
    },
  );
}

export async function onRequest(context: Context): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  if (request.method === 'GET') {
    const token = url.searchParams.get('token') ?? '';
    const locale = url.searchParams.get('locale') === 'zh-CN' ? 'zh-CN' : 'en';
    return NOTIFICATION_TOKEN.test(token)
      ? confirmationPage(token, locale)
      : json({ error: 'Invalid unsubscribe link.' }, 400);
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ error: 'Cross-origin request denied.' }, 403);
  if (!env.ENGAGEMENT_DB) return json({ error: 'Notifications are not enabled.' }, 404);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  const token =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>).token
      : null;
  if (typeof token !== 'string' || !NOTIFICATION_TOKEN.test(token)) {
    return json({ error: 'Invalid unsubscribe token.' }, 400);
  }

  await env.ENGAGEMENT_DB.prepare(
    "UPDATE comment_reply_notifications SET status = 'cancelled', locked_at = NULL, recipient_email = '', notification_token = '' WHERE notification_token = ? AND status IN ('pending', 'sending')",
  )
    .bind(token)
    .run();
  const updated = await env.ENGAGEMENT_DB.prepare(
    'UPDATE comments SET notification_email = NULL, notify_on_reply = 0, notification_token = NULL WHERE notification_token = ? AND notify_on_reply = 1 RETURNING id',
  )
    .bind(token)
    .first<{ id: string }>();
  return json({ ok: true, unsubscribed: Boolean(updated) });
}
