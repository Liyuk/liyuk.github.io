const HAN_RUN = /\p{Script=Han}+/gu;
const TOKEN = /[\p{L}\p{N}]{2,}/gu;
const CHAT_COLLECTIONS = new Set(['writing', 'research', 'consulting', 'project']);

function terms(value) {
  const normalized = value.toLocaleLowerCase();
  const result = new Set(normalized.match(TOKEN) ?? []);
  for (const run of normalized.match(HAN_RUN) ?? []) {
    if (run.length === 1) result.add(run);
    for (let index = 0; index < run.length - 1; index += 1) {
      result.add(run.slice(index, index + 2));
    }
  }
  return result;
}

export function cleanArticleMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[`*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findRelevantSources(sources, question, locale, limit = 4) {
  const queryTerms = terms(question);
  if (queryTerms.size === 0) return [];

  const uniqueSources = new Map();
  for (const source of sources) {
    if (source.locale !== locale) continue;
    const key = `${source.locale}:${source.url}`;
    const text = Array.isArray(source.excerpts) ? source.excerpts.join('\n') : source.text;
    const existing = uniqueSources.get(key);
    if (existing) existing.text = `${existing.text}\n${text}`;
    else uniqueSources.set(key, { ...source, text });
  }

  return [...uniqueSources.values()]
    .map((source) => {
      const titleTerms = terms(source.title);
      const descriptionTerms = terms(source.description ?? '');
      const textTerms = terms(source.text);
      let score = 0;
      for (const term of queryTerms) {
        if (titleTerms.has(term)) score += 5;
        if (descriptionTerms.has(term)) score += 2;
        if (textTerms.has(term)) score += 1;
      }
      return { source, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.source.title.localeCompare(right.source.title))
    .slice(0, limit)
    .map(({ source }) => source);
}

function splitIntoChunks(text, maxLength = 600, overlapLength = 80) {
  const sentences = text.match(/[^。！？.!?]+[。！？.!?]?/gu) ?? [text];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    const next = `${current}${sentence}`;
    if (next.length > maxLength && current) {
      const previous = current.trim();
      chunks.push(previous);
      current = `${previous.slice(-overlapLength)}${sentence}`;
      while (current.length > maxLength) {
        chunks.push(current.slice(0, maxLength).trim());
        current = current.slice(maxLength - overlapLength);
      }
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function createChatIndex(documents) {
  return documents.filter((document) => CHAT_COLLECTIONS.has(document.collection)).flatMap((document) => {
    const text = cleanArticleMarkdown(`${document.description || ''}\n\n${document.body || ''}`);
    const chunks = splitIntoChunks(text, 600);
    const selectedChunks = chunks.length <= 3
      ? chunks
      : [chunks[0], chunks[Math.floor((chunks.length - 1) / 2)], chunks.at(-1)];
    const excerpts = selectedChunks
      .filter((chunk) => chunk.length >= 20)
      .map((chunk) => chunk.slice(0, 600));
    if (excerpts.length === 0) return [];
    return [{
        title: document.title,
        description: (document.description || '').slice(0, 180),
        url: document.url,
        locale: document.locale,
        excerpts,
      }];
  });
}
