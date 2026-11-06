import test from 'node:test';
import assert from 'node:assert/strict';
import { recentUrls, buildPayload, INDEXNOW_KEY } from '../scripts/indexnow.mjs';
import { readFile } from 'node:fs/promises';

const xml = `<urlset>
<url><loc>https://liyuk.com/a/</loc><lastmod>2026-11-05T00:00:00Z</lastmod></url>
<url><loc>https://liyuk.com/b/</loc><lastmod>2026-09-01</lastmod></url>
<url><loc>https://liyuk.com/c/</loc></url>
</urlset>`;

test('recentUrls keeps only URLs modified inside the window', () => {
  assert.deepEqual(recentUrls(xml, new Date('2026-11-06T00:00:00Z')), ['https://liyuk.com/a/']);
});

test('payload points at the public key file', async () => {
  const payload = buildPayload(['https://liyuk.com/a/']);
  assert.equal(payload.keyLocation, `https://liyuk.com/${INDEXNOW_KEY}.txt`);
  assert.equal(await readFile(new URL(`../public/${INDEXNOW_KEY}.txt`, import.meta.url), 'utf8'), INDEXNOW_KEY);
});
