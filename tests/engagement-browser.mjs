import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.E2E_BASE ?? 'http://127.0.0.1:8788';
const article = '/writing/2021/03/data-definitions-are-collaboration-interfaces/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(new URL(article, base).href);
  const widget = page.locator('[data-engagement]');
  await widget.scrollIntoViewIfNeeded();
  await page.locator('[data-status]').waitFor({ state: 'visible' });
  await page.waitForFunction(() =>
    /\d+ 条评论/.test(document.querySelector('[data-status]')?.textContent ?? ''),
  );
  const initialCommentCount = Number(
    (await page.locator('[data-status]').textContent()).match(/\d+/)?.[0],
  );
  const initialLikeCount = Number(await page.locator('[data-like-count]').textContent());

  const like = page.getByRole('button', { name: /喜欢/ });
  await like.click();
  await page.waitForFunction(
    (expected) => document.querySelector('[data-like-count]')?.textContent === String(expected),
    initialLikeCount + 1,
  );
  assert.equal(await like.getAttribute('aria-pressed'), 'true');
  await like.click();
  await page.waitForFunction(
    (expected) => document.querySelector('[data-like-count]')?.textContent === String(expected),
    initialLikeCount,
  );
  assert.equal(await like.getAttribute('aria-pressed'), 'false');

  const firstThread = page.locator('[data-comments] > .comment-thread').first();
  if (await firstThread.count()) {
    const commentLike = firstThread.locator('.comment-like');
    const initialCommentLikes = Number(
      await commentLike.locator('.comment-like-count').textContent(),
    );
    await commentLike.locator('svg').click();
    await page.waitForFunction(
      (expected) =>
        document.querySelector('.comment-thread .comment-like-count')?.textContent ===
        String(expected),
      initialCommentLikes + 1,
    );
    assert.equal(await commentLike.getAttribute('aria-pressed'), 'true');
    await commentLike.locator('svg').click();
    await page.waitForFunction(
      (expected) =>
        document.querySelector('.comment-thread .comment-like-count')?.textContent ===
        String(expected),
      initialCommentLikes,
    );
    assert.equal(await commentLike.getAttribute('aria-pressed'), 'false');

    await firstThread.getByRole('button', { name: /回复|Reply/ }).click();
    await page.locator('[data-reply-context]').waitFor({ state: 'visible' });
    const firstReply = `Reply acceptance ${Date.now()}`;
    await page.locator('textarea[name="body"]').fill(firstReply);
    await page
      .getByRole('button', { name: /回复|Reply/ })
      .last()
      .click();
    await page
      .getByRole('status')
      .filter({ hasText: /谢谢留言|Thanks/ })
      .waitFor();
    assert.equal(await page.locator('[data-comments]').getByText(firstReply).count(), 0);

    await firstThread.getByRole('button', { name: /回复|Reply/ }).click();
    const secondReply = `Second reply acceptance ${Date.now()}`;
    await page.locator('textarea[name="body"]').fill(secondReply);
    await page
      .getByRole('button', { name: /回复|Reply/ })
      .last()
      .click();
    await page
      .getByRole('status')
      .filter({ hasText: /谢谢留言|Thanks/ })
      .waitFor();
    assert.equal(await page.locator('[data-comments]').getByText(secondReply).count(), 0);
  }

  const comment = `Preview acceptance ${Date.now()}`;
  await page.locator('textarea[name="body"]').fill(comment);
  await page.getByRole('button', { name: /提交评论|Post comment/ }).click();
  await page
    .getByRole('status')
    .filter({ hasText: /谢谢留言|Thanks/ })
    .waitFor();
  assert.equal(await page.locator('[data-comments]').getByText(comment).count(), 0);

  await page.goto(new URL(`/en${article}`, base).href);
  await page.locator('[data-engagement]').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-status]')?.textContent?.includes(`${expected} comments`),
    initialCommentCount,
  );
  assert.equal(await page.locator('[data-like-count]').textContent(), String(initialLikeCount));
  assert.deepEqual(errors, []);

  const threadedPage = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const rootId = '11111111-1111-4111-8111-111111111111';
  const replyId = '22222222-2222-4222-8222-222222222222';
  const olderRootId = '33333333-3333-4333-8333-333333333333';
  let replyLikes = 1;
  let postedReply;
  const threadedErrors = [];
  threadedPage.on('pageerror', (error) => threadedErrors.push(error.message));
  await threadedPage.route('**/api/comments/**', async (route) => {
    if (route.request().method() === 'POST') {
      postedReply = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { ok: true, status: 'pending' } });
    }
    if (new URL(route.request().url()).searchParams.has('before')) {
      return route.fulfill({
        json: {
          comments: [{ id: olderRootId, nickname: 'Older reader', body: 'An older comment', created_at: '2026-10-28T12:00:00.000Z', replies: [] }],
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
            id: rootId,
            nickname: 'Reader',
            body: 'A top-level comment',
            created_at: '2026-10-29T12:00:00.000Z',
            replies: [
              {
                id: replyId,
                parent_id: rootId,
                reply_to_id: rootId,
                reply_to_nickname: 'Reader',
                nickname: 'Author',
                body: 'A reply without nested replies',
                created_at: '2026-10-29T13:00:00.000Z',
              },
            ],
          },
        ],
        commentCount: 22,
        hasMore: true,
        nextCursor: { createdAt: '2026-10-29T12:00:00.000Z', id: rootId },
      },
    });
  });
  await threadedPage.route('**/api/likes/**', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: { articleLikes: 0, commentLikes: { [replyId]: replyLikes } } });
    }
    replyLikes = route.request().method() === 'PUT' ? replyLikes + 1 : replyLikes - 1;
    return route.fulfill({ json: { ok: true, likes: replyLikes } });
  });
  await threadedPage.goto(new URL(article, base).href);
  await threadedPage.locator('[data-engagement]').scrollIntoViewIfNeeded();
  await threadedPage.waitForFunction(
    () => document.querySelector('[data-status]')?.textContent?.includes('22 条评论'),
    undefined,
    { timeout: 3_000 },
  );
  const replyLike = threadedPage.locator('.comment-reply .comment-like');
  assert.equal(await replyLike.count(), 1);
  assert.equal(await threadedPage.locator('.comment-reply-to').textContent(), '@Reader');
  assert.equal(await replyLike.locator('.comment-like-count').textContent(), '1');
  await replyLike.locator('svg').click();
  await threadedPage.waitForFunction(() =>
    document.querySelector('.comment-reply .comment-like')?.getAttribute('aria-pressed') === 'true',
  );
  assert.equal(await replyLike.locator('.comment-like-count').textContent(), '2');
  const loadMore = threadedPage.getByRole('button', { name: '加载更多评论' });
  await loadMore.click();
  await threadedPage.getByText('An older comment').waitFor();
  assert.equal(await loadMore.isVisible(), false);
  const replyItem = threadedPage.locator('.comment-reply').first();
  await replyItem.getByRole('button', { name: /回复|Reply/ }).click();
  assert.equal(await threadedPage.locator('[data-reply-label]').textContent(), '正在回复：Author');
  await threadedPage.locator('textarea[name="body"]').fill('A reply to the reply');
  await threadedPage.getByRole('button', { name: /回复|Reply/ }).last().click();
  await threadedPage.getByRole('status').filter({ hasText: '谢谢留言' }).waitFor();
  assert.equal(postedReply.replyToId, replyId);
  assert.equal(await threadedPage.locator('.comment-reply').count(), 1);
  assert.deepEqual(threadedErrors, []);
  await threadedPage.close();

  console.log(
    'Passed: article and comment hearts toggle, flat reply threads display reply targets, replies to replies stay pending, and locale variants share one article key.',
  );
} finally {
  await browser.close();
}
