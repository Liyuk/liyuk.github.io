import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE;
const writingRoute = process.env.DRAFT_WRITING_ROUTE;
const researchRoute = process.env.DRAFT_RESEARCH_ROUTE;

assert.ok(BASE, 'E2E_BASE is required');
assert.ok(writingRoute, 'DRAFT_WRITING_ROUTE is required');

async function get(path) {
  const response = await fetch(`${BASE}${path}`);
  return { response, body: await response.text() };
}

function titleOf(body) {
  return body.match(/<title>([^<]+)<\/title>/i)?.[1] ?? '';
}

function hasNoindex(body) {
  return /<meta\s+name="robots"\s+content="noindex, follow"/i.test(body);
}

test('writing draft detail renders with noindex', async () => {
  const { response, body } = await get(writingRoute);
  assert.equal(response.status, 200);
  assert.ok(titleOf(body));
  assert.match(body, /<article\b/);
  assert.equal(hasNoindex(body), true);
});

test('research draft detail renders with noindex when available', async (t) => {
  if (!researchRoute) return t.skip('no research draft in this checkout');
  const { response, body } = await get(researchRoute);
  assert.equal(response.status, 200);
  assert.ok(titleOf(body));
  assert.match(body, /<article\b/);
  assert.equal(hasNoindex(body), true);
});

test('draft detail does not appear in the writing list', async () => {
  const { response, body } = await get('/writing/');
  assert.equal(response.status, 200);
  assert.equal(body.includes(writingRoute), false);
});

test('template detail routes remain unavailable', async () => {
  const writingTemplate = await get('/writing/_template/');
  const galleryTemplate = await get('/photos/gallery-slug/');
  assert.equal(writingTemplate.response.status, 404);
  assert.equal(galleryTemplate.response.status, 404);
});
