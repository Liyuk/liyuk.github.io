/** Editorial search intent labels recorded with a content entry. */
export const SEARCH_INTENTS = [
  'definition',
  'howto',
  'troubleshoot',
  'compare',
  'data',
  'service',
  'project',
  'visual',
  'essay',
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export interface SearchMetadata {
  primaryQuery?: unknown;
  searchIntent?: unknown;
  relatedQueries?: unknown;
}

/** Validate author-provided query metadata without treating it as ranking input. */
export function validateSearchMetadata(metadata: SearchMetadata): string | null {
  const primaryQuery = typeof metadata.primaryQuery === 'string' ? metadata.primaryQuery.trim() : '';
  if (primaryQuery.length < 2 || primaryQuery.length > 120) {
    return 'primaryQuery 必须是 2–120 个字符的读者检索表达。';
  }
  if (/\b[^\s@]+@[^\s@]+\.[^\s@]+\b|https?:\/\//iu.test(primaryQuery)) {
    return 'primaryQuery 不得包含邮箱或 URL。';
  }
  if (!SEARCH_INTENTS.includes(metadata.searchIntent as SearchIntent)) {
    return `searchIntent 必须是以下之一：${SEARCH_INTENTS.join(', ')}。`;
  }

  const related = metadata.relatedQueries ?? [];
  if (!Array.isArray(related) || related.length > 5 || related.some((query) => typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 120)) {
    return 'relatedQueries 最多 5 个，每个都必须是 2–120 个字符的检索表达。';
  }
  const normalized = [primaryQuery.toLocaleLowerCase(), ...related.map((query) => query.trim().toLocaleLowerCase())];
  if (new Set(normalized).size !== normalized.length) {
    return 'primaryQuery 和 relatedQueries 不得重复。';
  }
  return null;
}
