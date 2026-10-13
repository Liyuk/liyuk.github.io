const HAN_RUN = /\p{Script=Han}+/gu;
const TOKEN = /[\p{L}\p{N}]{2,}/gu;
const CHAT_COLLECTIONS = new Set(['writing', 'research', 'consulting', 'project']);
const QUERY_STOP_TERMS = new Set([
  'about', 'after', 'also', 'and', 'are', 'can', 'could', 'do', 'does', 'for', 'from', 'help', 'helps',
  'how', 'into', 'is', 'it', 'me', 'my', 'of', 'on', 'please', 'should', 'that', 'the', 'this', 'to',
  'today', 'we', 'what', 'when', 'where', 'which', 'who', 'why', 'with', 'would', 'you',
  '今天', '最近', '怎么样', '怎么', '么样', '如何', '什么', '有没', '没有', '帮我', '一下', '一个',
  '这个', '那个', '这篇', '本文', '本站', '是不是', '能不', '不能', '可以', '应该', '是否', '为什么',
  '怎样', '哪里', '哪些', '多少', '的话', '不等', '一样', '有啥', '有何', '么办',
]);
export const MIN_CHAT_MATCHING_TERMS = 3;
const preparedSearchIndexes = new WeakMap();
const postingBytesByIndex = new WeakMap();

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

function queryTermsForSearch(value) {
  return new Set([...terms(value)].filter((term) => !QUERY_STOP_TERMS.has(term)));
}

function findTermId(vocabulary, term) {
  let low = 0;
  let high = vocabulary.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const candidate = vocabulary[middle];
    if (candidate === term) return middle;
    if (candidate < term) low = middle + 1;
    else high = middle - 1;
  }
  return -1;
}

function findEncodedTermId(vocabulary, offsets, term) {
  let low = 0;
  let high = offsets.length - 2;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    const candidate = vocabulary.slice(offsets[middle], offsets[middle + 1] - 1);
    if (candidate === term) return middle;
    if (candidate < term) low = middle + 1;
    else high = middle - 1;
  }
  return -1;
}

function readVarint(bytes, cursor) {
  let value = 0;
  let shift = 0;
  let byte;
  do {
    byte = bytes[cursor.index];
    cursor.index += 1;
    value |= (byte & 0x7f) << shift;
    shift += 7;
  } while (byte & 0x80);
  return value >>> 0;
}

function decodePostingBytes(index) {
  let bytes = postingBytesByIndex.get(index);
  if (!bytes) {
    const binary = atob(index.postings);
    bytes = new Uint8Array(binary.length);
    for (let offset = 0; offset < binary.length; offset += 1) {
      bytes[offset] = binary.charCodeAt(offset);
    }
    postingBytesByIndex.set(index, bytes);
  }
  return bytes;
}

function hasTermId(sortedIds, termId) {
  let low = 0;
  let high = sortedIds.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (sortedIds[middle] === termId) return true;
    if (sortedIds[middle] < termId) low = middle + 1;
    else high = middle - 1;
  }
  return false;
}

function findWithPrecomputedTerms(sources, queryTerms, locale, limit, minMatchingTerms) {
  const localized = sources.filter((source) => source.locale === locale);
  const termsBySource = localized.map(
    (source) =>
      new Map([...queryTerms].map((term) => [term, findTermId(source.search.vocabulary, term)])),
  );
  const documentFrequency = new Map();
  for (const term of queryTerms) {
    let count = 0;
    localized.forEach((source, sourceIndex) => {
      const termId = termsBySource[sourceIndex].get(term);
      if (termId >= 0) count += 1;
    });
    documentFrequency.set(term, count);
  }
  const inverseDocumentFrequency = (term) => {
    const count = documentFrequency.get(term) ?? 0;
    return Math.log(1 + (localized.length - count + 0.5) / (count + 0.5));
  };
  return localized
    .map((source, sourceIndex) => {
      const excerpts = source.excerpts ?? [source.text ?? ''];
      const termIds = termsBySource[sourceIndex];
      let bestPassage = '';
      let bestPassageScore = 0;
      let bestPassageIndex = 0;
      for (let passageIndex = 0; passageIndex < excerpts.length; passageIndex += 1) {
        let score = 0;
        for (const term of queryTerms) {
          const termId = termIds.get(term);
          if (termId < 0) continue;
          const weight = inverseDocumentFrequency(term);
          if (hasTermId(source.search.titleTerms, termId)) score += weight * 5;
          if (hasTermId(source.search.descriptionTerms, termId)) score += weight * 2;
          if (hasTermId(source.search.keywordTerms, termId)) score += weight * 2.5;
          if (hasTermId(source.search.passageTerms[passageIndex], termId)) score += weight;
        }
        if (score > bestPassageScore) {
          bestPassage = excerpts[passageIndex];
          bestPassageScore = score;
          bestPassageIndex = passageIndex;
        }
      }
      const metadataTerms = new Set([
        ...source.search.titleTerms,
        ...source.search.descriptionTerms,
        ...source.search.keywordTerms,
      ]);
      const evidenceTerms = new Set([
        ...metadataTerms,
        ...(source.search.passageTerms[bestPassageIndex] ?? []),
      ]);
      return {
        source: { ...source, text: bestPassage || excerpts[0] || '' },
        score: bestPassageScore,
        matchingTerms: [...termIds.values()].filter(
          (termId) => termId >= 0 && evidenceTerms.has(termId),
        ).length,
      };
    })
    .filter(({ score, matchingTerms }) => score > 0 && matchingTerms >= minMatchingTerms)
    .sort(
      (left, right) =>
        right.score - left.score || left.source.title.localeCompare(right.source.title),
    )
    .slice(0, limit)
    .map(({ source }) => source);
}

function findWithInvertedIndex(index, queryTerms, locale, limit, minMatchingTerms) {
  const { documents, postingOffsets, vocabulary, vocabularyOffsets } = index;
  const postingBytes = decodePostingBytes(index);
  const localizedCount = documents.filter((document) => document.locale === locale).length;
  const candidates = new Map();

  for (const term of queryTerms) {
    const termId = findEncodedTermId(vocabulary, vocabularyOffsets, term);
    if (termId < 0) continue;
    const cursor = { index: postingOffsets[termId] };
    const postingCount = readVarint(postingBytes, cursor);
    let documentFrequency = 0;
    const records = [];
    let documentId = 0;
    for (let record = 0; record < postingCount; record += 1) {
      documentId += readVarint(postingBytes, cursor);
      const fieldFlags = readVarint(postingBytes, cursor);
      const passageCount = readVarint(postingBytes, cursor);
      const passageIds = [];
      let passageId = 0;
      for (let passage = 0; passage < passageCount; passage += 1) {
        passageId += readVarint(postingBytes, cursor);
        passageIds.push(passageId);
      }
      if (documents[documentId].locale === locale) {
        documentFrequency += 1;
        records.push([documentId, fieldFlags, passageIds]);
      }
    }
    if (documentFrequency === 0) continue;
    const weight = Math.log(
      1 + (localizedCount - documentFrequency + 0.5) / (documentFrequency + 0.5),
    );

    for (const [documentId, fieldFlags, passageIds] of records) {
      const document = documents[documentId];
      let candidate = candidates.get(documentId);
      if (!candidate) {
        candidate = {
          score: 0,
          metadataTermIds: new Set(),
          passageScores: new Map(),
          passageTermIds: new Map(),
        };
        candidates.set(documentId, candidate);
      }
      if (fieldFlags & 7) candidate.metadataTermIds.add(termId);
      if (fieldFlags & 1) candidate.score += weight * 5;
      if (fieldFlags & 2) candidate.score += weight * 2;
      if (fieldFlags & 4) candidate.score += weight * 2.5;
      for (const passageId of passageIds) {
        candidate.passageScores.set(
          passageId,
          (candidate.passageScores.get(passageId) ?? 0) + weight,
        );
        const passageTerms = candidate.passageTermIds.get(passageId) ?? new Set();
        passageTerms.add(termId);
        candidate.passageTermIds.set(passageId, passageTerms);
      }
    }
  }

  return [...candidates.entries()]
    .map(([documentId, candidate]) => {
      const document = documents[documentId];
      const bestPassageId = [...candidate.passageScores.entries()].sort(
        (left, right) => right[1] - left[1] || left[0] - right[0],
      )[0]?.[0];
      const excerpts = document.excerpts ?? [document.text ?? ''];
      const evidenceTerms = new Set(candidate.metadataTermIds);
      for (const termId of candidate.passageTermIds.get(bestPassageId) ?? []) {
        evidenceTerms.add(termId);
      }
      return {
        source: { ...document, text: excerpts[bestPassageId ?? 0] ?? '' },
        score: candidate.score + (candidate.passageScores.get(bestPassageId) ?? 0),
        matchingTerms: evidenceTerms.size,
      };
    })
    .filter(({ score, matchingTerms }) => score > 0 && matchingTerms >= minMatchingTerms)
    .sort(
      (left, right) =>
        right.score - left.score || left.source.title.localeCompare(right.source.title),
    )
    .slice(0, limit)
    .map(({ source }) => source);
}

export function cleanArticleMarkdown(markdown) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ');
  const headingPath = [];
  const paragraphs = [];

  for (const block of cleaned.split(/\n\s*\n/)) {
    const lines = block.trim().split('\n');
    const heading = lines[0].match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      headingPath.length = level;
      headingPath[level - 1] = heading[2].replace(/[`*_>#|]/g, ' ').trim();
      lines.shift();
    }

    const paragraph = lines
      .join(' ')
      .replace(/[`*_>#|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!paragraph) continue;
    const context = headingPath.filter(Boolean).join(' / ');
    paragraphs.push(context ? `${context}\n${paragraph}` : paragraph);
  }

  return paragraphs.join('\n\n');
}

export function formatChatAnswer(answer) {
  return answer
    .replace(/\s*\[S\d+\]/gu, '')
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function findRelevantSources(sources, question, locale, limit = 4, { minMatchingTerms = MIN_CHAT_MATCHING_TERMS } = {}) {
  const queryTerms = queryTermsForSearch(question);
  if (queryTerms.size === 0) return [];
  const requiredMatchingTerms = Math.min(minMatchingTerms, queryTerms.size);

  if (
    !Array.isArray(sources) &&
    Array.isArray(sources?.documents) &&
    typeof sources?.postings === 'string'
  ) {
    return findWithInvertedIndex(sources, queryTerms, locale, limit, requiredMatchingTerms);
  }

  if (sources.length > 0 && sources.every((source) => Array.isArray(source.search?.vocabulary))) {
    return findWithPrecomputedTerms(sources, queryTerms, locale, limit, requiredMatchingTerms);
  }

  let preparedByLocale = preparedSearchIndexes.get(sources);
  if (!preparedByLocale) {
    preparedByLocale = new Map();
    preparedSearchIndexes.set(sources, preparedByLocale);
  }
  let prepared = preparedByLocale.get(locale);
  if (!prepared) {
    const uniqueSources = new Map();
    for (const source of sources) {
      if (source.locale !== locale) continue;
      const key = `${source.locale}:${source.url}`;
      const excerpts = Array.isArray(source.excerpts) ? source.excerpts : [source.text];
      const existing = uniqueSources.get(key);
      if (existing) existing.excerpts.push(...excerpts);
      else uniqueSources.set(key, { ...source, excerpts: [...excerpts] });
    }

    const localizedSources = [...uniqueSources.values()];
    const documentFrequency = new Map();
    const indexedSources = localizedSources.map((source) => {
      const documentTerms = terms(
        [source.title, source.description ?? '', ...source.excerpts].join('\n'),
      );
      for (const term of documentTerms) {
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
      return {
        ...source,
        titleTerms: terms(source.title),
        descriptionTerms: terms(source.description ?? ''),
        keywordTerms: terms((source.keywords ?? []).join('\n')),
        indexedExcerpts: source.excerpts.map((excerpt) => ({ excerpt, terms: terms(excerpt) })),
      };
    });
    prepared = {
      sourceCount: indexedSources.length,
      sources: indexedSources,
      documentFrequency,
    };
    preparedByLocale.set(locale, prepared);
  }

  const inverseDocumentFrequency = (term) => {
    const count = prepared.documentFrequency.get(term) ?? 0;
    return Math.log(1 + (prepared.sourceCount - count + 0.5) / (count + 0.5));
  };

  return prepared.sources
    .map((source) => {
      let bestPassage = '';
      let bestPassageScore = 0;
      for (const { excerpt, terms: passageTerms } of source.indexedExcerpts) {
        let passageScore = 0;
        for (const term of queryTerms) {
          const weight = inverseDocumentFrequency(term);
          if (source.titleTerms.has(term)) passageScore += weight * 5;
          if (source.descriptionTerms.has(term)) passageScore += weight * 2;
          if (source.keywordTerms.has(term)) passageScore += weight * 2.5;
          if (passageTerms.has(term)) passageScore += weight;
        }
        if (passageScore > bestPassageScore) {
          bestPassage = excerpt;
          bestPassageScore = passageScore;
        }
      }
      return {
        source: { ...source, text: bestPassage || source.excerpts[0] || '' },
        score: bestPassageScore,
        matchingTerms: [...queryTerms].filter(
          (term) =>
            source.titleTerms.has(term) ||
            source.descriptionTerms.has(term) ||
            source.keywordTerms.has(term) ||
            source.indexedExcerpts
              .find(({ excerpt }) => excerpt === bestPassage)?.terms.has(term),
        ).length,
      };
    })
    .filter(({ score, matchingTerms }) => score > 0 && matchingTerms >= requiredMatchingTerms)
    .sort(
      (left, right) =>
        right.score - left.score || left.source.title.localeCompare(right.source.title),
    )
    .slice(0, limit)
    .map(({ source }) => source);
}

function splitLongParagraph(paragraph, maxLength) {
  const lineBreak = paragraph.indexOf('\n');
  const heading = lineBreak >= 0 ? paragraph.slice(0, lineBreak) : '';
  const body = lineBreak >= 0 ? paragraph.slice(lineBreak + 1) : paragraph;
  const headingPrefix = heading ? `${heading}\n` : '';
  const contentLength = Math.max(1, maxLength - headingPrefix.length);
  const sentences = body.match(/[^。！？.!?]+[。！？.!?]?/gu) ?? [body];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if (sentence.length > contentLength) {
      if (current.trim()) chunks.push(`${headingPrefix}${current.trim()}`);
      current = '';
      const characters = Array.from(sentence);
      for (let offset = 0; offset < characters.length; offset += contentLength) {
        chunks.push(
          `${headingPrefix}${characters
            .slice(offset, offset + contentLength)
            .join('')
            .trim()}`,
        );
      }
      continue;
    }
    const next = `${current}${sentence}`;
    if (next.length > contentLength && current) {
      chunks.push(`${headingPrefix}${current.trim()}`);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(`${headingPrefix}${current.trim()}`);
  return chunks;
}

function splitIntoChunks(text, maxLength = 900) {
  const chunks = [];
  let current = '';
  for (const paragraph of text.split(/\n\n+/)) {
    if (paragraph.length > maxLength) {
      if (current.trim()) chunks.push(current.trim());
      current = '';
      chunks.push(...splitLongParagraph(paragraph, maxLength));
      continue;
    }
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > maxLength && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function createChatIndex(
  documents,
  { maxExcerptLength = 1_200, maxExcerptsPerDocument = Number.POSITIVE_INFINITY } = {},
) {
  if (!Number.isInteger(maxExcerptLength) || maxExcerptLength < 1) {
    throw new TypeError('maxExcerptLength must be a positive integer.');
  }
  if (maxExcerptsPerDocument !== Number.POSITIVE_INFINITY && (!Number.isInteger(maxExcerptsPerDocument) || maxExcerptsPerDocument < 1)) {
    throw new TypeError('maxExcerptsPerDocument must be a positive integer or Infinity.');
  }

  return documents
    .filter((document) => !document.collection || CHAT_COLLECTIONS.has(document.collection))
    .flatMap((document) => {
    const text = cleanArticleMarkdown(document.body || '') || cleanArticleMarkdown(document.description || '');
    const allExcerpts = splitIntoChunks(text, maxExcerptLength).filter((chunk) => chunk.length >= 20);
    const excerpts = allExcerpts.length > maxExcerptsPerDocument
      ? [...new Set([0, Math.floor((allExcerpts.length - 1) / 2), allExcerpts.length - 1])]
          .slice(0, maxExcerptsPerDocument)
          .map((index) => allExcerpts[index])
      : allExcerpts;
    if (excerpts.length === 0) return [];
    return [
      {
        title: document.title,
        description: (document.description || '').slice(0, 180),
        keywords: document.keywords ?? [],
        url: document.url,
        locale: document.locale,
        excerpts,
        search: (() => {
          const titleTerms = terms(document.title);
          const descriptionTerms = terms((document.description || '').slice(0, 180));
          const keywordTerms = terms((document.keywords ?? []).join('\n'));
          const passageTerms = excerpts.map((excerpt) => terms(excerpt));
          const vocabulary = [
            ...new Set([
              ...titleTerms,
              ...descriptionTerms,
              ...keywordTerms,
              ...passageTerms.flatMap((passage) => [...passage]),
            ]),
          ].sort();
          const termIds = new Map(vocabulary.map((term, index) => [term, index]));
          const encodeTerms = (values) =>
            [...values].map((term) => termIds.get(term)).sort((a, b) => a - b);
          return {
            vocabulary,
            titleTerms: encodeTerms(titleTerms),
            descriptionTerms: encodeTerms(descriptionTerms),
            keywordTerms: encodeTerms(keywordTerms),
            passageTerms: passageTerms.map(encodeTerms),
          };
        })(),
      },
    ];
  });
}

export function createChatSearchIndex(documents, options) {
  const indexedDocuments = createChatIndex(documents, options);
  const vocabulary = [
    ...new Set(indexedDocuments.flatMap((document) => document.search.vocabulary)),
  ].sort();
  const termIds = new Map(vocabulary.map((term, index) => [term, index]));
  const postings = Array.from({ length: vocabulary.length }, () => []);

  indexedDocuments.forEach((document, documentId) => {
    const titleTerms = new Set(document.search.titleTerms);
    const descriptionTerms = new Set(document.search.descriptionTerms);
    const keywordTerms = new Set(document.search.keywordTerms);
    const passageTerms = document.search.passageTerms;
    const localTermsToPassages = new Map();
    passageTerms.forEach((passage, passageId) => {
      for (const localTermId of passage) {
        const passageIds = localTermsToPassages.get(localTermId) ?? [];
        passageIds.push(passageId);
        localTermsToPassages.set(localTermId, passageIds);
      }
    });

    for (let localTermId = 0; localTermId < document.search.vocabulary.length; localTermId += 1) {
      const term = document.search.vocabulary[localTermId];
      const globalTermId = termIds.get(term);
      const fieldFlags =
        Number(titleTerms.has(localTermId)) |
        (Number(descriptionTerms.has(localTermId)) << 1) |
        (Number(keywordTerms.has(localTermId)) << 2);
      postings[globalTermId].push([
        documentId,
        fieldFlags,
        localTermsToPassages.get(localTermId) ?? [],
      ]);
    }
  });

  const postingBytes = [];
  const postingOffsets = [];
  const writeVarint = (value) => {
    let remaining = value;
    while (remaining >= 0x80) {
      postingBytes.push((remaining & 0x7f) | 0x80);
      remaining >>>= 7;
    }
    postingBytes.push(remaining);
  };
  for (const termPostings of postings) {
    postingOffsets.push(postingBytes.length);
    writeVarint(termPostings.length);
    let previousDocumentId = 0;
    for (const [documentId, fieldFlags, passageIds] of termPostings) {
      writeVarint(documentId - previousDocumentId);
      previousDocumentId = documentId;
      writeVarint(fieldFlags);
      writeVarint(passageIds.length);
      let previousPassageId = 0;
      for (const passageId of passageIds) {
        writeVarint(passageId - previousPassageId);
        previousPassageId = passageId;
      }
    }
  }

  let vocabularyText = '';
  const vocabularyOffsets = [];
  for (const term of vocabulary) {
    vocabularyOffsets.push(vocabularyText.length);
    vocabularyText += `${term}\n`;
  }
  vocabularyOffsets.push(vocabularyText.length);
  let postingBinary = '';
  for (let offset = 0; offset < postingBytes.length; offset += 0x8000) {
    postingBinary += String.fromCharCode(...postingBytes.slice(offset, offset + 0x8000));
  }

  return {
    vocabulary: vocabularyText,
    vocabularyOffsets,
    postingOffsets,
    postings: btoa(postingBinary),
    documents: indexedDocuments.map(({ search, ...document }) => document),
  };
}
