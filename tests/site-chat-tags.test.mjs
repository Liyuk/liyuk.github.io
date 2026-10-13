import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

import { getIndexableTags, tagSearchAliases, tags } from '../src/lib/taxonomy.ts';
import { createContentDiscoveryDocument } from '../src/lib/content-discovery.ts';
import { createChatSearchIndex } from '../src/lib/site-chat.mjs';
import { handleChatRequest } from '../src/lib/site-chat-api.mjs';

const tagCases = JSON.parse(
  await readFile(new URL('./fixtures/site-chat-tag-cases.json', import.meta.url), 'utf8'),
);

function parseSourceEntry(raw, sourcePath) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/u);
  assert.ok(match, `${sourcePath} should have YAML frontmatter`);
  const [, frontmatter, body] = match;
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*(.*)$`, 'mu'))?.[1];
  const unquote = (value = '') => value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, '$1$2');
  const tagsValue = field('tags')?.match(/^\[([^\]]*)\]$/u)?.[1] ?? '';
  const tags = tagsValue.split(',').map((tag) => tag.trim()).filter(Boolean);
  const id = sourcePath
    .replace(/^src\/content\/writing\//u, '')
    .replace(/\/zh\.md$/u, '/zh');
  return {
    id,
    body,
    data: {
      title: unquote(field('title')),
      description: unquote(field('description')),
      tags,
    },
  };
}

async function findMarkdownFiles(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${item.name}`;
    if (item.isDirectory()) files.push(...await findMarkdownFiles(path));
    else if (item.name.endsWith('.md')) files.push(path);
  }
  return files;
}

function parsePublishedEntry(raw, sourcePath) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/u);
  assert.ok(match, `${sourcePath} should have YAML frontmatter`);
  const [, frontmatter, body] = match;
  const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*(.*)$`, 'mu'))?.[1];
  const unquote = (value = '') => value.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, '$1$2');
  const tagsValue = field('tags')?.match(/^\[([^\]]*)\]$/u)?.[1] ?? '';
  const entryId = sourcePath.replace(/^src\/content\/[a-z]+\//u, '').replace(/\.md$/u, '');
  const sourceCollection = sourcePath.split('/')[2];
  const collection = sourceCollection === 'projects' ? 'project' : sourceCollection;
  const locale = sourcePath.endsWith('.en.md') || sourcePath.endsWith('/en.md') ? 'en' : 'zh-CN';
  return {
    collection,
    locale,
    entry: {
      id: entryId,
      body,
      data: {
        draft: field('draft') === 'true',
        locale,
        title: unquote(field('title')),
        description: unquote(field('description')),
        tags: tagsValue.split(',').map((tag) => tag.trim()).filter(Boolean),
      },
    },
  };
}

test('site tag questions return grounded answers and sources through the chat API', async () => {
  const documents = [];
  const expectedUrls = new Map();

  for (const item of tagCases) {
    assert.ok(tags[item.tag], `${item.tag} must exist in the site tag registry`);
    assert.ok(
      tagSearchAliases[item.tag]?.[0]?.includes(item.question),
      `${item.question} must be a Chinese alias registered for ${item.tag}`,
    );
    const raw = await readFile(new URL(`../${item.sourcePath}`, import.meta.url), 'utf8');
    const entry = parseSourceEntry(raw, item.sourcePath);
    assert.ok(entry.data.tags.includes(item.tag), `${item.sourcePath} must carry ${item.tag}`);
    const document = createContentDiscoveryDocument(entry, 'writing', 'zh-CN');
    documents.push(document);
    expectedUrls.set(item.id, document.url);
  }

  const index = createChatSearchIndex(documents);
  const queries = tagCases.flatMap((item) => [
    { ...item, question: tags[item.tag][0], queryType: 'tag label' },
    { ...item, queryType: 'tag alias' },
  ]);
  const misses = [];

  for (const item of queries) {
    const expectedDocument = index.documents.find(({ url }) => url === expectedUrls.get(item.id));
    let modelPrompt = '';
    const request = new Request('https://liyuk.com/api/chat', {
      method: 'POST',
      headers: { origin: 'https://liyuk.com', 'content-type': 'application/json' },
      body: JSON.stringify({ question: item.question, locale: 'zh-CN' }),
    });
    const response = await handleChatRequest(request, {
      GEMINI_API_KEY: 'test-only-api-key',
      ASSETS: { fetch: async () => Response.json(index) },
    }, async (_url, options) => {
      const payload = JSON.parse(options.body);
      modelPrompt = payload.contents.at(-1).parts[0].text;
      return Response.json({ candidates: [{ content: { parts: [{ text: `根据本站文章回答：${item.question}` }] } }] });
    });
    const result = await response.json();
    const hasExpectedSource = result.sources?.some(({ url }) => url === expectedUrls.get(item.id));
    const includesExpectedContent = modelPrompt.includes(expectedDocument.title)
      && expectedDocument.excerpts.some((excerpt) => modelPrompt.includes(excerpt.slice(0, 80)));

    if (response.status !== 200 || typeof result.answer !== 'string' || !result.answer.trim() || !hasExpectedSource || !includesExpectedContent) {
      misses.push({
        id: item.id,
        tag: item.tag,
        queryType: item.queryType,
        question: item.question,
        status: response.status,
        returnedSources: result.sources?.map(({ url }) => url),
        promptIncludesArticle: includesExpectedContent,
      });
    }
  }

  assert.deepEqual(misses, []);
});

test('every published tag shown on the site has an answer with a matching article source', async () => {
  const allEntries = [];
  const searchableDocumentsByLocale = new Map([['zh-CN', []], ['en', []]]);
  const taggedUrlsByLocale = new Map([['zh-CN', new Map()], ['en', new Map()]]);

  for (const sourcePath of await findMarkdownFiles('src/content')) {
    if (sourcePath.includes('/_template.')) continue;
    const parsed = parsePublishedEntry(await readFile(sourcePath, 'utf8'), sourcePath);
    if (parsed.entry.data.draft) continue;
    allEntries.push(parsed.entry);
    if (!['writing', 'consulting', 'research', 'project'].includes(parsed.collection)) continue;

    const document = createContentDiscoveryDocument(parsed.entry, parsed.collection, parsed.locale);
    searchableDocumentsByLocale.get(parsed.locale).push(document);
    for (const tag of parsed.entry.data.tags) {
      const urls = taggedUrlsByLocale.get(parsed.locale).get(tag) ?? new Set();
      urls.add(document.url);
      taggedUrlsByLocale.get(parsed.locale).set(tag, urls);
    }
  }

  const misses = [];
  for (const locale of ['zh-CN', 'en']) {
    const localeEntries = allEntries.filter((entry) => entry.data.locale === locale);
    const visibleTags = getIndexableTags(localeEntries);
    const documents = searchableDocumentsByLocale.get(locale);
    const index = createChatSearchIndex(documents);
    const assets = { fetch: async () => Response.json(index) };

    for (const { slug } of visibleTags) {
      assert.ok(tags[slug], `visible tag ${slug} must exist in the site tag registry`);
      const label = tags[slug][locale === 'en' ? 1 : 0];
      const expectedUrls = taggedUrlsByLocale.get(locale).get(slug) ?? new Set();
      assert.ok(expectedUrls.size > 0, `${locale} tag ${slug} must have a searchable published article`);

      for (const question of [`#${label}`, label]) {
        let modelPrompt = '';
        let modelInstruction = '';
        const response = await handleChatRequest(new Request('https://liyuk.com/api/chat', {
          method: 'POST',
          headers: { origin: 'https://liyuk.com', 'content-type': 'application/json' },
          body: JSON.stringify({ question, locale }),
        }), {
          GEMINI_API_KEY: 'test-only-api-key',
          ASSETS: assets,
        }, async (_url, options) => {
          const payload = JSON.parse(options.body);
          modelPrompt = payload.contents.at(-1).parts[0].text;
          modelInstruction = payload.systemInstruction.parts[0].text;
          const answer = locale === 'en'
            ? `I found published articles about ${label} on this site.`
            : `我在本站找到关于“${label}”的已发布文章。`;
          return Response.json({ candidates: [{ content: { parts: [{ text: answer }] } }] });
        });
        const result = await response.json();
        const matchingSource = result.sources?.find(({ url }) => expectedUrls.has(url));
        const sourceDocument = index.documents.find(({ url }) => url === matchingSource?.url);
        const groundedInPrompt = sourceDocument
          && modelPrompt.includes(sourceDocument.title)
          && sourceDocument.excerpts.some((excerpt) => modelPrompt.includes(excerpt.slice(0, 80)));
        const hasTagBrowseGuidance = locale === 'en'
          ? modelInstruction.includes('treat it as a request to browse that topic')
          : modelInstruction.includes('将它视为浏览该主题的请求');

        if (response.status !== 200 || !result.answer?.trim() || !matchingSource || !groundedInPrompt || !hasTagBrowseGuidance) {
          misses.push({
            locale,
            tag: slug,
            question,
            status: response.status,
            answer: result.answer,
            returnedSources: result.sources?.map(({ url }) => url),
            groundedInPrompt: Boolean(groundedInPrompt),
            hasTagBrowseGuidance,
          });
        }
      }
    }
  }

  assert.deepEqual(misses, []);
});
