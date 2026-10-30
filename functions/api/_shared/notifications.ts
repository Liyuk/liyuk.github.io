export type OwnerNotification =
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

interface NotificationBinding {
  fetch(input: string, init: RequestInit): Promise<Response>;
}

interface NotificationContext {
  env: { NOTIFIER?: NotificationBinding };
  waitUntil?: (promise: Promise<unknown>) => void;
}

export function notifyOwner(context: NotificationContext, notification: OwnerNotification): void {
  if (!context.env.NOTIFIER) return;

  const delivery = context.env.NOTIFIER.fetch('https://email-notifier.internal/notify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(notification),
  }).then((response) => {
    if (!response.ok) console.error('Owner notification was rejected by the email worker.', response.status);
  }).catch((error: unknown) => {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unavailable';
    console.error('Owner notification could not reach the email worker.', code);
  });

  if (context.waitUntil) context.waitUntil(delivery);
  else void delivery;
}
