#!/usr/bin/env node
// Refresh the local keyword table from Google Search Console.
//
//   npm run seo:signals -- --csv ~/Downloads/Queries.csv [--page URL] [--date YYYY-MM-DD]
//   GSC_ACCESS_TOKEN=... npm run seo:signals -- --api [--days 28]
//
// Raw rows and the derived table live under artifacts/seo/ (git-ignored), so
// GSC data never reaches the repository, dist/, Pagefind, RSS, or chat assets.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { aggregateKeywords, classifyKeywords, parseGscCsv, rowsFromApi } from './lib/seo-keywords.mjs';

export const SEO_DIR = 'artifacts/seo';
const SITE = 'sc-domain:liyuk.com';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function fetchApiRows(days) {
  const token = process.env.GSC_ACCESS_TOKEN;
  if (!token) throw new Error('Set GSC_ACCESS_TOKEN (scope webmasters.readonly) to use --api.');
  const end = new Date(Date.now() - 2 * 86_400_000);
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const day = (date) => date.toISOString().slice(0, 10);
  const rows = [];
  for (let startRow = 0; ; startRow += 25_000) {
    const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        startDate: day(start),
        endDate: day(end),
        dimensions: ['date', 'page', 'query'],
        type: 'web',
        dataState: 'final',
        rowLimit: 25_000,
        startRow,
      }),
    });
    if (!response.ok) throw new Error(`Search Analytics API ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const batch = rowsFromApi(await response.json());
    rows.push(...batch);
    if (batch.length < 25_000) return rows;
  }
}

export async function rebuildKeywordTable(dir = SEO_DIR) {
  const gscDir = path.join(dir, 'gsc');
  const files = (await readdir(gscDir)).filter((name) => name.endsWith('.jsonl')).sort();
  // Later snapshots win for the same date x page x query, so reruns never double count.
  const rows = new Map();
  for (const file of files) {
    for (const line of (await readFile(path.join(gscDir, file), 'utf8')).split('\n')) {
      if (!line) continue;
      const row = JSON.parse(line);
      rows.set(`${row.date}|${row.page}|${row.query}`, row);
    }
  }
  const keywords = classifyKeywords(aggregateKeywords([...rows.values()]));
  await writeFile(path.join(dir, 'keywords.json'), `${JSON.stringify({ builtAt: new Date().toISOString(), keywords }, null, 2)}\n`);
  return keywords;
}

async function main() {
  await mkdir(path.join(SEO_DIR, 'gsc'), { recursive: true });
  const csv = arg('csv');
  let rows;
  if (csv) {
    const date = arg('date') ?? new Date().toISOString().slice(0, 10);
    rows = parseGscCsv(await readFile(csv, 'utf8'), { date, page: arg('page') });
  } else if (process.argv.includes('--api')) {
    rows = await fetchApiRows(Number(arg('days') ?? 28));
  } else if (!process.argv.includes('--rebuild')) {
    console.error('Use --csv <file>, --api, or --rebuild.');
    process.exit(2);
  }
  if (rows) {
    const name = `${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`;
    await writeFile(path.join(SEO_DIR, 'gsc', name), `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
    console.log(`Stored ${rows.length} rows in ${SEO_DIR}/gsc/${name}`);
  }
  const keywords = await rebuildKeywordTable();
  const flagged = keywords.filter((keyword) => keyword.flags.length).length;
  console.log(`Keyword table: ${keywords.length} keywords, ${flagged} flagged -> ${SEO_DIR}/keywords.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
