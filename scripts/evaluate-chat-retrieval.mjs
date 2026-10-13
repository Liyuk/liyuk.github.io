import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  createChatSearchIndex,
  findRelevantSources,
  MIN_CHAT_MATCHING_TERMS,
} from '../src/lib/site-chat.mjs';

const indexPaths = new Map([
  ['zh-CN', new URL('../dist/chat-index/zh-CN.json', import.meta.url)],
  ['en', new URL('../dist/chat-index/en.json', import.meta.url)],
]);
const casesPath = new URL('../tests/fixtures/site-chat-retrieval-cases.json', import.meta.url);
const challengeCasesPath = new URL(
  '../tests/fixtures/site-chat-retrieval-challenge.json',
  import.meta.url,
);
const redditInspiredCasesPath = new URL(
  '../tests/fixtures/site-chat-reddit-inspired-cases.json',
  import.meta.url,
);

export function evaluateRetrieval(cases, sources) {
  const inScope = [];
  const outOfScope = [];
  const contextRequired = [];

  for (const item of cases) {
    if (item.kind === 'context-required') {
      contextRequired.push(item);
      continue;
    }
    const index = sources instanceof Map ? sources.get(item.locale) : sources;
    const ranked = findRelevantSources(index, item.question, item.locale, 3, {
      minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
    });
    if (item.kind === 'out-of-scope') {
      outOfScope.push({ ...item, returned: ranked.map(({ url }) => url) });
      continue;
    }

    const relevantUrls = item.relevantUrls ?? (item.expectedUrl ? [item.expectedUrl] : []);
    const relevantRanks = ranked
      .map(({ url }, index) => (relevantUrls.includes(url) ? index + 1 : null))
      .filter((rank) => rank !== null);
    const rank = relevantRanks[0] ?? null;
    inScope.push({
      ...item,
      relevantUrls,
      rank,
      relevantRanks,
      returned: ranked.map(({ url }) => url),
    });
  }

  const hitAt = (rank) => inScope.filter((item) => item.rank !== null && item.rank <= rank).length;
  const reciprocalRankTotal = inScope.reduce(
    (total, item) => total + (item.rank ? 1 / item.rank : 0),
    0,
  );
  const recallAt3 = inScope.length
    ? inScope.reduce(
        (total, item) =>
          total + item.relevantRanks.filter((rank) => rank <= 3).length / Math.max(1, item.relevantUrls.length),
        0,
      ) / inScope.length
    : 0;
  const dcgAt3 = (ranks) =>
    ranks.reduce((total, rank) => total + (rank <= 3 ? 1 / Math.log2(rank + 1) : 0), 0);
  const meanNdcgAt3 = inScope.length
    ? inScope.reduce((total, item) => {
        const idealCount = Math.min(item.relevantUrls.length, 3);
        const idealDcg = dcgAt3(Array.from({ length: idealCount }, (_, index) => index + 1));
        return total + (idealDcg ? dcgAt3(item.relevantRanks) / idealDcg : 0);
      }, 0) / inScope.length
    : 0;
  const byCategory = Object.groupBy(inScope, ({ category }) => category ?? 'uncategorized');
  const categoryMetrics = Object.fromEntries(
    Object.entries(byCategory).map(([category, items]) => {
      const categoryHitAt = (rank) =>
        items.filter((item) => item.rank !== null && item.rank <= rank).length;
      const categoryMrr =
        items.reduce((total, item) => total + (item.rank ? 1 / item.rank : 0), 0) / items.length;
      return [
        category,
        {
          count: items.length,
          hitAt1: categoryHitAt(1),
          hitAt3: categoryHitAt(3),
          meanReciprocalRank: categoryMrr,
          recallAt3: items.length
            ? items.reduce(
                (total, item) =>
                  total + item.relevantRanks.filter((rank) => rank <= 3).length / Math.max(1, item.relevantUrls.length),
                0,
              ) / items.length
            : 0,
        },
      ];
    }),
  );
  return {
    total: cases.length,
    inScope: inScope.length,
    contextRequired: contextRequired.length,
    hitAt1: hitAt(1),
    hitAt3: hitAt(3),
    hitAt3Rate: inScope.length ? hitAt(3) / inScope.length : 0,
    meanReciprocalRank: inScope.length ? reciprocalRankTotal / inScope.length : 0,
    recallAt3,
    meanNdcgAt3,
    outOfScopeFalseRetrievalRate: outOfScope.length
      ? outOfScope.filter((item) => item.returned.length > 0).length / outOfScope.length
      : 0,
    byCategory: categoryMetrics,
    outOfScope: outOfScope.length,
    falseRetrievals: outOfScope.filter((item) => item.returned.length > 0),
    misses: inScope.filter((item) => item.rank === null),
  };
}

export function evaluateChunkSweep(cases, sources, sizes = [600, 900, 1_200, 1_500]) {
  const allSources =
    sources instanceof Map
      ? [...sources.values()].flatMap(({ documents }) => documents)
      : Array.isArray(sources)
        ? sources
        : sources.documents;
  const documents = allSources.map(({ title, description, url, locale, excerpts, body }) => {
    const text = Array.isArray(excerpts) ? excerpts.join('\n\n') : (body ?? '');
    const bodyText =
      description && text.startsWith(description)
        ? text.slice(description.length).replace(/^\s+/, '')
        : text;
    return { title, description, url, locale, body: bodyText };
  });

  return sizes.map((maxExcerptLength) => {
    const index = createChatSearchIndex(documents, { maxExcerptLength });
    const report = evaluateRetrieval(cases, index);
    return {
      maxExcerptLength,
      passages: index.documents.reduce((total, source) => total + source.excerpts.length, 0),
      indexBytes: new TextEncoder().encode(JSON.stringify(index)).byteLength,
      hitAt1: report.hitAt1,
      hitAt3: report.hitAt3,
      meanReciprocalRank: report.meanReciprocalRank,
      recallAt3: report.recallAt3,
      meanNdcgAt3: report.meanNdcgAt3,
      falseRetrievals: report.falseRetrievals.length,
      outOfScopeFalseRetrievalRate: report.outOfScopeFalseRetrievalRate,
    };
  });
}

async function main() {
  const sources = new Map();
  try {
    for (const [locale, path] of indexPaths) {
      sources.set(locale, JSON.parse(await readFile(path, 'utf8')));
    }
  } catch {
    console.error(
      'Missing localized chat index files. Run npm run build before evaluating retrieval.',
    );
    process.exitCode = 1;
    return;
  }

  const cases = process.argv.includes('--reddit')
    ? JSON.parse(await readFile(redditInspiredCasesPath, 'utf8'))
    : JSON.parse(await readFile(casesPath, 'utf8'));
  if (process.argv.includes('--challenge')) {
    cases.push(...JSON.parse(await readFile(challengeCasesPath, 'utf8')));
  }
  if (process.argv.includes('--chunk-sweep')) {
    console.log(JSON.stringify(evaluateChunkSweep(cases, sources), null, 2));
    return;
  }
  const report = evaluateRetrieval(cases, sources);
  const summary = {
    total: report.total,
    inScope: report.inScope,
    hitAt1: report.hitAt1,
    hitAt3: report.hitAt3,
    hitAt3Rate: `${(report.hitAt3Rate * 100).toFixed(1)}%`,
    meanReciprocalRank: report.meanReciprocalRank.toFixed(3),
    recallAt3: report.recallAt3.toFixed(3),
    meanNdcgAt3: report.meanNdcgAt3.toFixed(3),
    byCategory: report.byCategory,
    outOfScope: report.outOfScope,
    falseRetrievals: report.falseRetrievals.length,
    outOfScopeFalseRetrievalRate: `${(report.outOfScopeFalseRetrievalRate * 100).toFixed(1)}%`,
    contextRequired: report.contextRequired,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (process.argv.includes('--details')) {
    console.log(
      JSON.stringify({ misses: report.misses, falseRetrievals: report.falseRetrievals }, null, 2),
    );
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
