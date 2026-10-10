const HAN_RUN = /\p{Script=Han}+/gu;
const TOKEN = /[\p{L}\p{N}]{2,}/gu;
const CHAT_COLLECTIONS = new Set(['writing', 'research', 'consulting', 'project']);
const ENGLISH_STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'also', 'am', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'been',
  'before', 'being', 'between', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'during',
  'each', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i',
  'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'no', 'nor', 'not',
  'of', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);
const CHINESE_STOP_TERMS = new Set(['这个', '那个', '什么', '怎么', '么样', '如何', '文章', '内容']);
const CHINESE_STOP_CHARACTERS = /[的了是在有与对及和吗么]/u;

function terms(value) {
  const normalized = value.toLocaleLowerCase();
  const result = new Set((normalized.match(TOKEN) ?? []).filter((term) => !ENGLISH_STOPWORDS.has(term)));
  for (const run of normalized.match(HAN_RUN) ?? []) {
    if (run.length === 1 && !CHINESE_STOP_CHARACTERS.test(run)) result.add(run);
    for (let index = 0; index < run.length - 1; index += 1) {
      const term = run.slice(index, index + 2);
      if (!CHINESE_STOP_CHARACTERS.test(term) && !CHINESE_STOP_TERMS.has(term)) result.add(term);
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
    const excerpts = Array.isArray(source.excerpts) ? source.excerpts : [source.text];
    const existing = uniqueSources.get(key);
    if (existing) existing.excerpts.push(...excerpts);
    else uniqueSources.set(key, { ...source, excerpts: [...excerpts] });
  }

  return [...uniqueSources.values()]
    .map((source) => {
      const titleTerms = terms(source.title);
      const descriptionTerms = terms(source.description ?? '');
      const rankedExcerpts = source.excerpts
        .map((excerpt) => {
          const excerptTerms = terms(excerpt);
          const score = [...queryTerms].reduce((total, term) => total + (excerptTerms.has(term) ? 1 : 0), 0);
          return { excerpt, score };
        })
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score);
      const excerptTerms = new Set(rankedExcerpts.flatMap(({ excerpt }) => [...terms(excerpt)]));
      let score = 0;
      let matchedTerms = 0;
      for (const term of queryTerms) {
        const inTitle = titleTerms.has(term);
        const inDescription = descriptionTerms.has(term);
        const inExcerpt = excerptTerms.has(term);
        if (inTitle) score += 5;
        if (inDescription) score += 2;
        if (inExcerpt) score += 1;
        if (inTitle || inDescription || inExcerpt) matchedTerms += 1;
      }
      const excerpts = rankedExcerpts.length > 0 ? rankedExcerpts.map(({ excerpt }) => excerpt) : source.excerpts.slice(0, 1);
      return { source: { ...source, text: excerpts.join('\n') }, score, matchedTerms };
    })
    .filter(({ score, matchedTerms }) => score > 0 && matchedTerms >= Math.min(2, queryTerms.size))
    .sort((left, right) => right.score - left.score || left.source.title.localeCompare(right.source.title))
    .slice(0, limit)
    .map(({ source }) => source);
}

function splitIntoChunks(text, maxLength = 600, overlapLength = 80) {
  const sentences = text.match(/[^。！？.!?]+[。！？.!?]?/gu) ?? [text];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if (!current && sentence.length > maxLength) {
      let remainder = sentence;
      while (remainder.length > maxLength) {
        chunks.push(remainder.slice(0, maxLength).trim());
        remainder = remainder.slice(maxLength - overlapLength);
      }
      current = remainder;
      continue;
    }
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
