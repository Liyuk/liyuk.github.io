#!/usr/bin/env node
// Submit recently modified sitemap URLs to IndexNow (Bing, Yandex, Naver...).
// The key is public by design: it only proves we own the host via /<key>.txt.
import { readFile } from 'node:fs/promises';

export const INDEXNOW_KEY = 'dacb4c6ba65dcd83f54a2ee11d69809e';
export const INDEXNOW_HOST = 'liyuk.com';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export function recentUrls(sitemapXml, now = new Date(), days = 3) {
  const cutoff = now.getTime() - days * 86_400_000;
  const urls = [];
  for (const block of sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
    const lastmod = block[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (!loc || !lastmod) continue;
    const time = Date.parse(lastmod);
    if (Number.isFinite(time) && time >= cutoff) urls.push(loc);
  }
  return urls;
}

export function buildPayload(urls) {
  return {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10_000),
  };
}

async function main() {
  const dist = process.argv.includes('--dist') ? process.argv[process.argv.indexOf('--dist') + 1] : 'dist';
  const days = Number(process.env.INDEXNOW_DAYS ?? 3);
  const dry = process.argv.includes('--dry-run');
  const urls = recentUrls(await readFile(`${dist}/sitemap-0.xml`, 'utf8'), new Date(), days);
  console.log(`IndexNow: ${urls.length} URL(s) modified in the last ${days} day(s).`);
  if (!urls.length || dry) return;
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(buildPayload(urls)),
  });
  console.log(`IndexNow response: ${response.status}`);
  if (response.status >= 400) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
