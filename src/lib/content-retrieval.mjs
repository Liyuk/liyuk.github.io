import { findRelevantSources, MIN_CHAT_MATCHING_TERMS } from './site-chat.mjs';

const VECTOR_MODEL = '@cf/baai/bge-m3';
const VECTOR_MIN_SCORE = 0.6;

function isCurrentPageQuestion(question) {
  return /这篇|本文|这篇文章|文中|这页|这段|作者在这里|this article|this page|this post|the article|in this post|what is it about/iu.test(question);
}

function isShortTopicQuery(question) {
  const normalized = question.trim();
  return Array.from(normalized).length <= 12 && !/[?？。！!，,]/u.test(normalized);
}

async function getCurrentPageSource(index, input, requestUrl, assets) {
  if (!input.currentPath || !isCurrentPageQuestion(input.question)) return undefined;
  try {
    const pageUrl = new URL(input.currentPath, requestUrl);
    if (pageUrl.origin !== new URL(requestUrl).origin) return undefined;
    const document = index.documents.find((candidate) =>
      candidate.url === pageUrl.pathname && candidate.locale === input.locale,
    );
    if (!document) return undefined;
    let text;
    try {
      const contextUrl = `/chat-context${document.url.replace(/\/$/u, '')}.json`;
      const response = await assets.fetch(new Request(new URL(contextUrl, requestUrl)));
      if (response.ok) {
        const context = await response.json();
        if (context?.title === document.title && context?.url === document.url && context?.locale === document.locale && typeof context?.text === 'string') {
          text = context.text;
        }
      }
    } catch {
      // Fall back to excerpts when the full article context asset is unavailable.
    }
    text ||= document.excerpts?.join('\n\n') || document.text || '';
    return { ...document, text };
  } catch {
    return undefined;
  }
}

async function findVectorSources(index, question, locale, env) {
  if (!env?.AI || !env?.VECTOR_INDEX) return { available: false, bestScore: Number.NEGATIVE_INFINITY, sources: [] };
  try {
    const embedding = await env.AI.run(VECTOR_MODEL, { text: [question] });
    const vector = embedding?.data?.[0];
    if (!Array.isArray(vector) || vector.length !== 1_024) {
      return { available: false, bestScore: Number.NEGATIVE_INFINITY, sources: [] };
    }
    const result = await env.VECTOR_INDEX.query(vector, {
      topK: 50,
      namespace: locale,
      returnMetadata: 'all',
    });
    const documents = Array.isArray(index) ? index : index.documents;
    const allowed = new Map(
      documents.filter((document) => document.locale === locale).map((document) => [document.url, document]),
    );
    const bestByArticle = new Map();
    let bestScore = Number.NEGATIVE_INFINITY;
    let ignoredStalePassage = false;
    for (const match of result.matches ?? []) {
      const document = allowed.get(match.metadata?.url);
      const passageIndex = match.metadata?.passageIndex;
      const excerpt = Number.isInteger(passageIndex) ? document?.excerpts?.[passageIndex] : undefined;
      if (!document || typeof excerpt !== 'string') {
        ignoredStalePassage = true;
        continue;
      }
      const passageText = `title: ${document.title} | text: ${excerpt}`;
      const passageHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passageText));
      const expectedHash = [...new Uint8Array(passageHash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      if (match.metadata?.contentHash !== expectedHash) {
        ignoredStalePassage = true;
        continue;
      }
      bestScore = Math.max(bestScore, match.score);
      const previous = bestByArticle.get(document.url);
      if (!previous || match.score > previous.score) {
        bestByArticle.set(document.url, { source: { ...document, text: excerpt }, score: match.score });
      }
    }
    const sources = [...bestByArticle.values()]
      .filter(({ score }) => score >= VECTOR_MIN_SCORE)
      .sort((left, right) => right.score - left.score)
      .slice(0, 20)
      .map(({ source }) => source);
    return {
      available: !ignoredStalePassage || sources.length > 0,
      bestScore: sources.length > 0 ? bestScore : ignoredStalePassage ? Number.NEGATIVE_INFINITY : bestScore,
      sources,
    };
  } catch {
    // Vectorize is optional; keyword retrieval remains the fallback.
    return { available: false, bestScore: Number.NEGATIVE_INFINITY, sources: [] };
  }
}

function fuseSources(rankings, limit = 4) {
  const fused = new Map();
  for (const ranking of rankings) {
    ranking.forEach((source, index) => {
      const entry = fused.get(source.url) ?? { ...source, score: 0 };
      const evidence = [entry.text, source.text].filter((text, textIndex, values) =>
        typeof text === 'string' && values.indexOf(text) === textIndex,
      );
      entry.text = evidence.join('\n\n');
      entry.score += 1 / (60 + index + 1);
      fused.set(source.url, entry);
    });
  }
  return [...fused.values()].sort((left, right) => right.score - left.score).slice(0, limit);
}

/** Retrieves grounded sources without coupling retrieval to Gemini or SSE. */
export async function retrieveContentSources({ index, input, question, requestUrl, assets, env }) {
  const currentPageQuestion = isCurrentPageQuestion(input.question);
  const currentPageSource = await getCurrentPageSource(index, input, requestUrl, assets);
  const keywordSources = findRelevantSources(index, question, input.locale, 20, {
    minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
  });
  const vectorResult = currentPageSource || (currentPageQuestion && input.currentPath)
    ? { available: false, bestScore: Number.NEGATIVE_INFINITY, sources: [] }
    : await findVectorSources(index, question, input.locale, env);
  const hybridSources = vectorResult.available
    ? vectorResult.bestScore >= VECTOR_MIN_SCORE
      ? fuseSources([keywordSources, vectorResult.sources], 4)
      // A short topic can have clear title/tag evidence even when its embedding score is low.
      : isShortTopicQuery(question)
        ? keywordSources.slice(0, 4)
        : []
    : keywordSources;
  const sources = currentPageSource
    ? [currentPageSource]
    : currentPageQuestion && input.currentPath
      ? []
      : hybridSources;
  return { sources };
}
