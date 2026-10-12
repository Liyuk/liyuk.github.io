import test from 'node:test';
import assert from 'node:assert/strict';

import { createChatIndex, createChatSearchIndex, findRelevantSources } from '../src/lib/site-chat.mjs';
import { handleChatRequest } from '../src/lib/site-chat-api.mjs';

test('chat retrieval finds a published article through its curated topic aliases', () => {
  const index = createChatIndex([{
    collection: 'writing',
    title: 'Team capability guide',
    description: 'A guide to engineering teams and their routines.',
    keywords: ['knowledge handoff', 'knowledge transfer'],
    body: 'A small engineering team documents routines and development practices.',
    url: '/en/writing/knowledge-handoff/',
    locale: 'en',
  }]);

  const results = findRelevantSources(index, 'knowledge handoff', 'en');

  assert.equal(results[0]?.url, '/en/writing/knowledge-handoff/');
});


test('chat retrieval abstains when a query only matches different passages', () => {
  const index = createChatSearchIndex([{
    collection: 'writing',
    title: 'Team handbook',
    description: 'A guide to team practices and policies.',
    body: 'Leadership shapes decision making.\n\nCompensation affects retention.',
    url: '/en/writing/team-handbook/',
    locale: 'en',
  }], { maxExcerptLength: 30 });

  const results = findRelevantSources(index, 'leadership compensation', 'en');

  assert.deepEqual(results, []);
});

test('chat API accepts and searches the compressed static index', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({ question: 'How can teams measure developer efficiency?', locale: 'en' }),
  });
  const index = createChatSearchIndex([{
    collection: 'writing',
    title: 'Developer productivity',
    description: 'How to evaluate engineering team outcomes.',
    keywords: ['developer efficiency', 'engineering productivity'],
    body: 'Teams can measure developer efficiency through delivery outcomes and system health.',
    url: '/en/writing/developer-productivity/',
    locale: 'en',
  }]);
  let modelCalls = 0;
  const response = await handleChatRequest(
    request,
    {
      GEMINI_API_KEY: 'test-only-api-key',
      ASSETS: { fetch: async () => Response.json(index) },
    },
    async () => {
      modelCalls += 1;
      return Response.json({ candidates: [{ content: { parts: [{ text: 'Measure outcomes.' }] } }] });
    },
  );

  assert.equal(response.status, 200);
  assert.equal(modelCalls, 1);
  assert.deepEqual((await response.json()).sources, [
    { title: 'Developer productivity', url: '/en/writing/developer-productivity/' },
  ]);
});

test('chat index can cap stored excerpts at representative article sections', () => {
  const body = Array.from({ length: 12 }, (_, index) =>
    `Section ${index + 1}. ${String.fromCharCode(97 + index).repeat(250)} ${index === 11 ? 'final section marker' : 'detail'}.`,
  ).join('\n\n');
  const index = createChatIndex([{
    collection: 'writing',
    title: 'Long article',
    description: 'A description long enough to enter the index.',
    body,
    url: '/en/writing/long-article/',
    locale: 'en',
  }], { maxExcerptLength: 300, maxExcerptsPerDocument: 3 });

  assert.equal(index[0].excerpts.length, 3);
  assert.match(index[0].excerpts[0], /Section 1/);
  assert.match(index[0].excerpts[1], /Section 6/);
  assert.match(index[0].excerpts[2], /final section marker/);
});

test('chat API reuses the parsed language index for later questions in the same isolate', async () => {
  const index = createChatSearchIndex([{
    collection: 'writing',
    title: 'Developer productivity',
    description: 'How engineering teams evaluate delivery outcomes.',
    keywords: ['developer efficiency', 'engineering productivity'],
    body: 'Teams measure delivery outcomes and system health.',
    url: '/en/writing/developer-productivity/',
    locale: 'en',
  }]);
  let indexFetches = 0;
  const assets = {
    fetch: async () => {
      indexFetches += 1;
      return Response.json(index);
    },
  };
  const sendQuestion = (question) => handleChatRequest(
    new Request('https://liyuk.com/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
      body: JSON.stringify({ question, locale: 'en' }),
    }),
    { GEMINI_API_KEY: 'test-only-api-key', ASSETS: assets },
    async () => Response.json({ candidates: [{ content: { parts: [{ text: 'Measure outcomes.' }] } }] }),
  );

  await sendQuestion('How do teams measure developer efficiency?');
  await sendQuestion('How do teams measure engineering productivity?');

  assert.equal(indexFetches, 1);
});
