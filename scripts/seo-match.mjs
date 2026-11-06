#!/usr/bin/env node
// Match tracked keywords to published articles and write the weekly report.
//
//   npm run seo:match [-- --dist dist] [--entry /writing/2026/09/what-ai-gateways-do/]
//
// Reads artifacts/seo/keywords.json and the built chat index (published
// entries only). Writes artifacts/seo/reports/<week>.md. It never edits
// content: the report is a set of suggestions for an editor.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SEO_DIR } from './seo-signals.mjs';
import { isoWeek, linkOpportunities, matchKeywords } from './lib/seo-keywords.mjs';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const pct = (value) => `${(value * 100).toFixed(1)}%`;
const line = (item) => `- **${item.keyword}** — ${item.impressions} 曝光 · ${pct(item.ctr ?? 0)} CTR · 第 ${item.position.toFixed(1)} 位`;

export function renderReport(matches, documents, week) {
  const top = (flag, n = 10) => matches.filter((m) => m.flags.includes(flag)).sort((a, b) => b.impressions - a.impressions).slice(0, n);
  const section = (title, items, extra = () => '') => [
    `## ${title}`,
    items.length ? items.map((m) => `${line(m)}${extra(m)}`).join('\n') : '_无_',
    '',
  ].join('\n');
  const target = (m) => (m.primary ? `\n  - 主承接：${m.primary.url}（score ${m.primary.score.toFixed(2)}${m.primary.titleHit ? '' : '，标题未含该词'}）\n  - 段落：${m.primary.passage.replace(/\n/gu, ' ')}` : '\n  - 无可承接页面');
  const gaps = matches.filter((m) => m.gap).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const links = matches
    .map((m) => ({ m, from: linkOpportunities(m, documents) }))
    .filter(({ from }) => from.length)
    .slice(0, 10);
  return [
    `# SEO 周报 ${week}`,
    '',
    section('冲刺区（排名 8–20）', top('sprint'), target),
    section('低 CTR（低于本站同排名段中位数一半）', top('low-ctr'), target),
    section('新词', top('new'), target),
    section('衰退', top('declining')),
    section('自我蚕食', top('cannibalization'), (m) => `\n  - 备选：${m.alternates.map((a) => a.url).join('、') || '无'}${m.cannibalRisk ? '（分差 < 0.1）' : ''}`),
    section('内容缺口（有曝光、无页面可答）', gaps),
    section('内链机会（正文提到该词但没有链接到主承接页）', links.map(({ m }) => m), (m) => `\n  - 可从 ${linkOpportunities(m, documents).slice(0, 3).join('、')} 链向 ${m.primary.url}`),
  ].join('\n');
}

async function main() {
  const dist = arg('dist') ?? 'dist';
  const { keywords } = JSON.parse(await readFile(path.join(SEO_DIR, 'keywords.json'), 'utf8'));
  const documents = [];
  for (const locale of ['zh-CN', 'en']) {
    const index = JSON.parse(await readFile(path.join(dist, 'chat-index', `${locale}.json`), 'utf8'));
    documents.push(...index.documents);
  }
  const only = arg('entry');
  let matches = matchKeywords(keywords, documents);
  if (only) matches = matches.filter((m) => m.primary?.url === only);
  const week = isoWeek(new Date().toISOString());
  const report = renderReport(matches, documents, week);
  await mkdir(path.join(SEO_DIR, 'reports'), { recursive: true });
  const target = path.join(SEO_DIR, 'reports', `${week}.md`);
  await writeFile(target, `${report}\n`);
  console.log(`Matched ${matches.length} keywords against ${documents.length} documents -> ${target}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
