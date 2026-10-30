import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.E2E_BASE ?? 'http://127.0.0.1:8788';
const article = '/writing/2021/03/data-definitions-are-collaboration-interfaces/';
const browser = await chromium.launch();
let postedComment;

try {
  const page = await browser.newPage();
  await page.route('**/api/comments/**', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'POST') {
      postedComment = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { ok: true, status: 'pending' } });
    }
    if (url.searchParams.has('before')) {
      return route.fulfill({
        json: {
          comments: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              nickname: 'Older reader',
              body: 'An older comment',
              created_at: '2026-10-28T12:00:00.000Z',
              replies: [],
            },
          ],
          commentCount: 22,
          hasMore: false,
          nextCursor: null,
        },
      });
    }
    return route.fulfill({
      json: {
        comments: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            nickname: 'Reader',
            body: 'A recent comment',
            created_at: '2026-10-29T12:00:00.000Z',
            replies: [],
          },
        ],
        commentCount: 22,
        hasMore: true,
        nextCursor: {
          createdAt: '2026-10-29T12:00:00.000Z',
          id: '11111111-1111-4111-8111-111111111111',
        },
      },
    });
  });
  await page.route('**/api/likes/**', (route) =>
    route.fulfill({ json: { articleLikes: 0, commentLikes: {} } }),
  );

  await page.goto(new URL(article, base).href);
  const widget = page.locator('[data-engagement]');
  await widget.scrollIntoViewIfNeeded();
  await page.getByText('A recent comment').waitFor();
  assert.match(await page.locator('[data-status]').textContent(), /22 条评论/);

  await page.getByRole('button', { name: '加载更多评论' }).click();
  await page.getByText('An older comment').waitFor();
  assert.match(await page.locator('[data-status]').textContent(), /22 条评论/);
  assert.equal(await page.getByRole('button', { name: '加载更多评论' }).isVisible(), false);

  const emailToggle = page.locator('[data-notify-replies]');
  const emailField = widget.locator('input[name="email"]');
  assert.equal(await emailField.isVisible(), false);
  await emailToggle.check();
  assert.equal(await emailField.isVisible(), true);
  assert.equal(await emailField.getAttribute('required'), '');
  await emailField.fill('reader@example.com');
  await page.locator('textarea[name="body"]').fill('My nickname stays optional.');
  await page.getByRole('button', { name: '提交评论' }).click();
  await page.getByRole('status').filter({ hasText: '谢谢留言' }).waitFor();
  assert.equal(postedComment.nickname, '');
  assert.equal(postedComment.notifyOnReply, true);
  assert.equal(postedComment.email, 'reader@example.com');
} finally {
  await browser.close();
}
