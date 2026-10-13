import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { tagSearchAliases, tags } from '../src/lib/taxonomy.ts';
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
