import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { evaluateRetrieval } from './evaluate-chat-retrieval.mjs';
import { findRelevantSources, MIN_CHAT_MATCHING_TERMS } from '../src/lib/site-chat.mjs';

const model = process.env.OLLAMA_EMBED_MODEL ?? 'bge-m3';
const batchSize = 24;
const thresholds = [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
const cacheDirectory = new URL('../artifacts/chat-vector-benchmark/', import.meta.url);
const cachePath = new URL('../artifacts/chat-vector-benchmark/embeddings.json', import.meta.url);
const reportPath = new URL('../artifacts/chat-vector-benchmark/report.json', import.meta.url);
const indexPaths = new Map([
  ['zh-CN', new URL('../dist/chat-index/zh-CN.json', import.meta.url)],
  ['en', new URL('../dist/chat-index/en.json', import.meta.url)],
]);
const baseCasesPath = new URL('../tests/fixtures/site-chat-retrieval-cases.json', import.meta.url);
const challengeCasesPath = new URL(
  '../tests/fixtures/site-chat-retrieval-challenge.json',
  import.meta.url,
);

export function cosineSimilarity(left, right) {
  if (left.length !== right.length || left.length === 0) {
    throw new Error('Embedding vectors must have the same non-zero length.');
  }
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function rankVectorArticles(passages, queryVector, locale) {
  const bestByArticle = new Map();
  for (const passage of passages) {
    if (passage.locale !== locale) continue;
    const score = cosineSimilarity(queryVector, passage.vector);
    const previous = bestByArticle.get(passage.url);
    if (!previous || score > previous.score) bestByArticle.set(passage.url, { ...passage, score });
  }
  return [...bestByArticle.values()].sort(
    (left, right) => right.score - left.score || left.title.localeCompare(right.title),
  );
}

export function fuseRankings(rankings, reciprocalRankConstant = 60) {
  const fused = new Map();
  rankings.forEach((ranking) => {
    ranking.forEach((source, index) => {
      const entry = fused.get(source.url) ?? { ...source, rrfScore: 0 };
      entry.rrfScore += 1 / (reciprocalRankConstant + index + 1);
      fused.set(source.url, entry);
    });
  });
  return [...fused.values()].sort(
    (left, right) => right.rrfScore - left.rrfScore || left.title.localeCompare(right.title),
  );
}

export function estimateVectorizeFreeUsage({
  vectorCount,
  dimensions,
  monthlyNewVectors = 0,
  freeStoredDimensions = 5_000_000,
  freeQueriedDimensions = 30_000_000,
}) {
  const storedDimensions = vectorCount * dimensions;
  const monthlyWriteDimensions = monthlyNewVectors * dimensions;
  const projectedStoredDimensions = storedDimensions + monthlyWriteDimensions;
  const queryCapacityDimensions = freeQueriedDimensions - storedDimensions - monthlyWriteDimensions;
  return {
    storedDimensions,
    projectedStoredDimensions,
    withinFreeStorageDimensions: projectedStoredDimensions <= freeStoredDimensions,
    monthlyWriteDimensions,
    monthlyQueryDimensionsForIndexBuild: storedDimensions + monthlyWriteDimensions,
    maxQueriesWithinFreeQueryDimensions: Math.max(
      0,
      Math.floor(queryCapacityDimensions / dimensions),
    ),
  };
}

function stableHash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function flattenPassages(indexes) {
  return [...indexes.values()].flatMap((index) =>
    index.documents.flatMap((document) =>
      document.excerpts.map((excerpt, passageIndex) => ({
        url: document.url,
        title: document.title,
        locale: document.locale,
        passageIndex,
        text: `title: ${document.title} | text: ${excerpt}`,
      })),
    ),
  );
}

async function loadEmbeddings(texts, inputHash) {
  let cached;
  try {
    cached = JSON.parse(await readFile(cachePath, 'utf8'));
  } catch {
    cached = null;
  }
  if (
    cached?.inputHash === inputHash &&
    cached?.model === model &&
    cached.vectors?.length === texts.length
  ) {
    console.log(`Using cached ${cached.vectors.length} ${model} embeddings.`);
    return cached.vectors;
  }

  const embeddings = [];
  for (let start = 0; start < texts.length; start += batchSize) {
    const input = texts.slice(start, start + batchSize);
    const response = await fetch('http://127.0.0.1:11434/api/embed', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, input, truncate: true, keep_alive: '10m' }),
    });
    if (!response.ok)
      throw new Error(`Ollama embedding request failed with HTTP ${response.status}.`);
    const result = await response.json();
    if (!Array.isArray(result.embeddings) || result.embeddings.length !== input.length) {
      throw new Error('Ollama returned an unexpected embedding batch.');
    }
    embeddings.push(...result.embeddings);
    console.log(`Embedded ${embeddings.length}/${texts.length} passages and questions.`);
  }
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(cachePath, JSON.stringify({ inputHash, model, vectors: embeddings }));
  return embeddings;
}

function passageRanks(passages, vectors, queryVector, locale) {
  const scored = passages.map((passage, index) => ({ ...passage, vector: vectors[index] }));
  return rankVectorArticles(scored, queryVector, locale);
}

function evaluateRankings(cases, rankingsById) {
  const answerable = cases.filter(({ kind }) => kind === 'in-scope');
  const unanswerable = cases.filter(({ kind }) => kind === 'out-of-scope');
  const rankFor = (item, results) => {
    const expected = item.relevantUrls ?? (item.expectedUrl ? [item.expectedUrl] : []);
    const rank = results.findIndex(({ url }) => expected.includes(url));
    return rank < 0 ? null : rank + 1;
  };
  const ranks = answerable.map((item) => rankFor(item, rankingsById.get(item.id) ?? []));
  const hit = (maxRank) => ranks.filter((rank) => rank !== null && rank <= maxRank).length;
  const falseRetrievals = unanswerable.filter(
    (item) => (rankingsById.get(item.id)?.length ?? 0) > 0,
  ).length;
  return {
    answerable: answerable.length,
    hitAt1: hit(1),
    hitAt3: hit(3),
    hitAt3Rate: answerable.length ? hit(3) / answerable.length : 0,
    meanReciprocalRank: answerable.length
      ? ranks.reduce((total, rank) => total + (rank ? 1 / rank : 0), 0) / answerable.length
      : 0,
    outOfScope: unanswerable.length,
    falseRetrievals,
  };
}

function formatReport(name, result) {
  const answerable = result.answerable ?? result.inScope;
  const falseRetrievals = Array.isArray(result.falseRetrievals)
    ? result.falseRetrievals.length
    : result.falseRetrievals;
  return {
    method: name,
    hitAt1: `${result.hitAt1}/${answerable}`,
    hitAt3: `${result.hitAt3}/${answerable} (${(result.hitAt3Rate * 100).toFixed(1)}%)`,
    mrr: result.meanReciprocalRank.toFixed(3),
    noAnswerFalseRetrieval: `${falseRetrievals}/${result.outOfScope}`,
  };
}

async function main() {
  const indexes = new Map();
  for (const [locale, path] of indexPaths)
    indexes.set(locale, JSON.parse(await readFile(path, 'utf8')));
  const cases = [
    ...JSON.parse(await readFile(baseCasesPath, 'utf8')),
    ...JSON.parse(await readFile(challengeCasesPath, 'utf8')),
  ];
  const passages = flattenPassages(indexes);
  const queryTexts = cases.map(({ question }) => question);
  const allTexts = [...passages.map(({ text }) => text), ...queryTexts];
  const inputHash = stableHash(`${model}\n${allTexts.join('\n---\n')}`);
  const embeddings = await loadEmbeddings(allTexts, inputHash);
  const passageVectors = embeddings.slice(0, passages.length);
  const queryVectors = embeddings.slice(passages.length);
  const staticRankings = new Map();
  for (const item of cases) {
    if (item.kind === 'context-required') continue;
    staticRankings.set(
      item.id,
      findRelevantSources(indexes.get(item.locale), item.question, item.locale, 20, {
        minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
      }),
    );
  }

  const vectorRankings = new Map();
  const rankedWithScores = new Map();
  cases.forEach((item, index) => {
    if (item.kind === 'context-required') return;
    const ranked = passageRanks(passages, passageVectors, queryVectors[index], item.locale);
    rankedWithScores.set(item.id, ranked);
    vectorRankings.set(item.id, ranked.slice(0, 3));
  });

  const outputs = [formatReport('static-keyword', evaluateRetrieval(cases, indexes))];
  outputs.push(formatReport('vector-top3-no-threshold', evaluateRankings(cases, vectorRankings)));
  const thresholdSweep = thresholds.map((threshold) => {
    const thresholdedVectors = new Map();
    const hybrid = new Map();
    const hybridGated = new Map();
    for (const item of cases) {
      if (item.kind === 'context-required') continue;
      const vector = (rankedWithScores.get(item.id) ?? []).filter(
        ({ score }) => score >= threshold,
      );
      thresholdedVectors.set(item.id, vector.slice(0, 3));
      const lexical = staticRankings.get(item.id) ?? [];
      hybrid.set(item.id, fuseRankings([lexical, vector]).slice(0, 3));
      const bestVectorScore = rankedWithScores.get(item.id)?.[0]?.score ?? Number.NEGATIVE_INFINITY;
      hybridGated.set(
        item.id,
        bestVectorScore >= threshold ? fuseRankings([lexical, vector]).slice(0, 3) : [],
      );
    }
    return {
      threshold,
      vector: evaluateRankings(cases, thresholdedVectors),
      hybrid: evaluateRankings(cases, hybrid),
      hybridGated: evaluateRankings(cases, hybridGated),
    };
  });
  for (const threshold of thresholdSweep) {
    outputs.push(formatReport(`vector-threshold-${threshold.threshold}`, threshold.vector));
    outputs.push(formatReport(`hybrid-rrf-threshold-${threshold.threshold}`, threshold.hybrid));
    outputs.push(
      formatReport(`hybrid-rrf-gated-threshold-${threshold.threshold}`, threshold.hybridGated),
    );
  }

  const vectorCount = passages.length;
  const dimensions = passageVectors[0]?.length ?? 0;
  const cost = [384, 768, 1024, 1536].map((dimension) => ({
    dimensions: dimension,
    ...estimateVectorizeFreeUsage({ vectorCount, dimensions: dimension, monthlyNewVectors: 100 }),
    float32StorageMiB: Number(((vectorCount * dimension * 4) / (1024 * 1024)).toFixed(2)),
  }));
  const staticIndexBytes = [...indexPaths.values()].reduce(
    (sizes, path) => {
      const bytes = Buffer.from(requireReadCache.get(path));
      sizes.raw += bytes.length;
      sizes.gzip += gzipSync(bytes).length;
      return sizes;
    },
    { raw: 0, gzip: 0 },
  );
  const result = {
    model,
    embeddingDimensions: dimensions,
    corpus: {
      documents: [...indexes.values()].reduce((total, index) => total + index.documents.length, 0),
      passages: vectorCount,
      totalQuestions: cases.length,
      answerableQuestions: cases.filter(({ kind }) => kind === 'in-scope').length,
      noAnswerQuestions: cases.filter(({ kind }) => kind === 'out-of-scope').length,
      contextQuestions: cases.filter(({ kind }) => kind === 'context-required').length,
    },
    staticKeyword: outputs[0],
    vectorNoThreshold: outputs[1],
    thresholdSweep: outputs.slice(2),
    vectorizeCostScenarios: cost,
    staticIndexBytes,
  };
  const report = JSON.stringify(result, null, 2);
  await writeFile(reportPath, report);
  console.log(report);
}

const requireReadCache = new Map();
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  for (const path of indexPaths.values()) {
    requireReadCache.set(path, await readFile(path, 'utf8'));
  }
  await main();
}
