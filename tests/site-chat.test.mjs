import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanArticleMarkdown,
  createChatIndex,
  createChatSearchIndex,
  findRelevantSources,
  MIN_CHAT_MATCHING_TERMS,
} from '../src/lib/site-chat.mjs';
import { handleChatRequest } from '../src/lib/site-chat-api.mjs';

const sources = [
  {
    title: 'Engineering management',
    url: '/en/writing/2026/08/engineering-management/',
    locale: 'en',
    text: 'Feedback loops help engineering teams improve delivery and collaboration.',
  },
  {
    title: '工程管理中的反馈回路',
    url: '/writing/2026/08/feedback-loops/',
    locale: 'zh-CN',
    text: '团队通过反馈回路持续改进交付和协作。',
  },
  {
    title: 'Photography notes',
    url: '/en/photos/photography-notes/',
    locale: 'en',
    text: 'A collection of street photography from San Francisco.',
  },
];

test('chat retrieval returns only matching sources in the requested locale', () => {
  const results = findRelevantSources(
    sources,
    'How do feedback loops help engineering teams?',
    'en',
  );

  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Engineering management');
});

test('chat retrieval returns no source for an unrelated question', () => {
  assert.deepEqual(findRelevantSources(sources, 'What is the weather today?', 'en'), []);
});

test('chat retrieval ranks Chinese articles by matching title and body terms', () => {
  const results = findRelevantSources(sources, '反馈回路如何帮助团队改进？', 'zh-CN');

  assert.equal(results.length, 1);
  assert.equal(results[0].title, '工程管理中的反馈回路');
});

test('chat retrieval merges matching excerpts from the same article into one source', () => {
  const results = findRelevantSources(
    [
      { ...sources[0], text: 'Feedback loops are useful.' },
      { ...sources[0], text: 'Engineering teams use feedback to improve.' },
    ],
    'How do feedback loops help engineering teams?',
    'en',
  );

  assert.equal(results.length, 1);
  assert.match(results[0].text, /feedback to improve/);
});

test('chat retrieval ranks a matching passage above terms scattered across unrelated passages', () => {
  const results = findRelevantSources(
    [
      {
        title: 'A broad article',
        url: '/broad/',
        locale: 'zh-CN',
        excerpts: ['研发效率', '效率反馈'],
      },
      {
        title: 'A focused article',
        url: '/focused/',
        locale: 'zh-CN',
        excerpts: ['研发效率反馈应该尽快交到开发者手里。'],
      },
    ],
    '研发效率反馈',
    'zh-CN',
  );

  assert.equal(results[0].url, '/focused/');
  assert.match(results[0].text, /研发效率反馈/);
});

test('chat retrieval abstains when the query terms are scattered across separate excerpts', () => {
  const index = createChatSearchIndex([
    {
      title: 'A general article about engineering topics',
      description: 'A sufficiently long description for this article to be indexed.',
      body: 'Teams discuss leadership in regular meetings.\n\nCompensation policy changes each year.',
      url: '/scattered-evidence/',
      locale: 'en',
    },
  ], { maxExcerptLength: 45 });

  assert.deepEqual(
    findRelevantSources(index, 'How do teams leadership compensation work?', 'en', 4, {
      minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
    }),
    [],
  );
});

test('chat index precomputes exact search terms that preserve passage ranking', () => {
  const index = createChatIndex(
    [
      {
        title: 'A broad article',
        description: 'General team collaboration.',
        body: '研发效率提升需要把团队研发效率目标拆解到真实工作，并持续收集反馈。\n\n效率反馈需要结合用户访谈和交付质量分析。',
        url: '/broad/',
        locale: 'zh-CN',
      },
      {
        title: 'A focused article',
        description: 'A sufficiently long description for indexing.',
        body: '研发效率反馈应该尽快交到开发者手里，并帮助团队调整协作流程和工作优先级。',
        url: '/focused/',
        locale: 'zh-CN',
      },
    ],
    { maxExcerptLength: 80 },
  );

  assert.ok(
    index.every(
      ({ search }) => Array.isArray(search?.vocabulary) && Array.isArray(search.passageTerms),
    ),
  );
  assert.equal(findRelevantSources(index, '研发效率反馈', 'zh-CN')[0].url, '/focused/');
});

test('inverted chat index retrieves exact passages without scanning every article', () => {
  const index = createChatSearchIndex([
    {
      title: 'A broad article',
      description: 'A general article about collaboration and team routines.',
      body: 'Teams discuss planning and product delivery in their regular meetings.',
      url: '/broad/',
      locale: 'en',
    },
    {
      title: 'Engineering productivity feedback loops',
      description: 'How to measure engineering productivity using delivery outcomes and feedback.',
      body: 'Teams should measure engineering productivity through delivery outcomes, system health, and developer feedback.',
      url: '/focused/',
      locale: 'en',
    },
  ]);

  assert.ok(Array.isArray(index.documents));
  assert.equal(typeof index.vocabulary, 'string');
  assert.ok(Array.isArray(index.vocabularyOffsets));
  assert.equal(typeof index.postings, 'string');
  assert.equal(
    findRelevantSources(index, 'How should we measure engineering productivity?', 'en')[0].url,
    '/focused/',
  );
});

test('chat retrieval can find an article through its curated topic keywords', () => {
  const index = createChatSearchIndex([
    {
      title: 'A useful engineering note',
      description: 'A sufficiently long description to be included in the chat index.',
      keywords: ['研发效率', '开发者生产力'],
      body: 'Teams improve through short feedback loops and safer delivery practices.',
      url: '/research/developer-productivity/',
      locale: 'zh-CN',
    },
    {
      title: 'A general team note',
      description: 'A sufficiently long description to be included in the chat index.',
      keywords: ['团队协作'],
      body: 'Teams discuss general collaboration practices and shared goals.',
      url: '/writing/teamwork/',
      locale: 'zh-CN',
    },
  ]);

  const results = findRelevantSources(index, '研发效率怎么衡量？', 'zh-CN');

  assert.equal(results[0].url, '/research/developer-productivity/');
});

test('chat retrieval abstains when a question matches only a shared place name', () => {
  const index = createChatSearchIndex([
    {
      title: '在旧金山散步',
      description: '记录旧金山西海岸的一次旅行和街头观察。',
      body: '在旧金山的街道上散步，记录城市生活和海边风景。',
      url: '/writing/san-francisco-walk/',
      locale: 'zh-CN',
    },
  ]);

  assert.deepEqual(
    findRelevantSources(index, '今天旧金山天气怎么样？', 'zh-CN', 4, {
      minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
    }),
    [],
  );
});

test('chat retrieval keeps exact short topic queries eligible for results', () => {
  const index = createChatSearchIndex([
    {
      title: 'AI 工程实践',
      description: '关于人工智能在工程团队里的应用。',
      body: '工程团队需要评估人工智能如何改变协作和交付。',
      url: '/writing/ai-engineering/',
      locale: 'zh-CN',
    },
  ]);

  const results = findRelevantSources(index, 'AI', 'zh-CN', 4, {
    minMatchingTerms: MIN_CHAT_MATCHING_TERMS,
  });

  assert.equal(results[0].url, '/writing/ai-engineering/');
});

test('chat index keeps readable article text while excluding code blocks', () => {
  const index = createChatIndex([
    {
      title: 'A useful note',
      description: 'A published description about useful engineering practices.',
      body: 'Teams learn through clear feedback loops.\n\n```js\nsecretExample()\n```\n\nA second useful paragraph describes collaboration.',
      url: '/writing/example/',
      locale: 'en',
    },
  ]);
  const indexedText = index.flatMap((source) => source.excerpts).join(' ');

  assert.match(indexedText, /published description/);
  assert.match(indexedText, /feedback loops/);
  assert.match(indexedText, /collaboration/);
  assert.doesNotMatch(indexedText, /secretExample/);
  assert.equal(cleanArticleMarkdown('[read this](https://example.com)'), 'read this');
});

test('chat index carries section headings into the passages below them', () => {
  const index = createChatIndex(
    [
      {
        title: 'Team knowledge',
        description: 'A long description that will be included in the article index.',
        body: [
          '## 经验沉淀',
          `${'团队在日常协作中记录经验，并把做法整理成其他成员可以重复使用的流程。'.repeat(2)}`,
          `${'新人通过真实任务学习判断依据，团队持续更新文档和知识入口。'.repeat(2)}`,
          '## 责任边界',
          `${'每个角色都应该明确自己的决定范围、交接责任和升级条件。'.repeat(2)}`,
        ].join('\n\n'),
        url: '/writing/team-knowledge/',
        locale: 'zh-CN',
      },
    ],
    { maxExcerptLength: 120 },
  );
  const excerpts = index[0].excerpts;

  assert.ok(excerpts.some((excerpt) => excerpt.includes('经验沉淀')));
  assert.ok(excerpts.some((excerpt) => excerpt.includes('责任边界')));
  assert.ok(
    excerpts
      .filter((excerpt) => excerpt.includes('团队在日常协作'))
      .every((excerpt) => excerpt.includes('经验沉淀')),
  );
  assert.ok(
    excerpts
      .filter((excerpt) => excerpt.includes('每个角色'))
      .every((excerpt) => excerpt.includes('责任边界')),
  );
});

test('chat index covers the whole article with readable excerpts under the configured size', () => {
  const body = Array.from(
    { length: 8 },
    (_, index) =>
      `Section ${index + 1}: ${String.fromCharCode(97 + index).repeat(500)} ${index === 7 ? 'final marker for this article' : 'detail'}.`,
  ).join('\n\n');
  const index = createChatIndex([
    {
      title: 'Long article',
      description: 'A long article description with enough detail to be indexed.',
      body,
      url: '/writing/long-article/',
      locale: 'en',
    },
  ]);

  assert.equal(index.length, 1);
  assert.ok(index[0].excerpts.length > 3);
  assert.ok(index[0].excerpts.every((excerpt) => excerpt.length <= 1_200));
  assert.ok(index[0].excerpts.some((excerpt) => excerpt.includes('Section 3:')));
  assert.match(index[0].excerpts.at(-1), /final marker for this article/);
});

test('chat index splits a single oversized sentence instead of truncating its ending', () => {
  const longSentence = `开头标记 ${'长'.repeat(1_100)} 结尾标记。`;
  const index = createChatIndex(
    [
      {
        title: 'Long sentence',
        description: 'A sufficiently long description for indexing.',
        body: longSentence,
        url: '/writing/long-sentence/',
        locale: 'zh-CN',
      },
    ],
    { maxExcerptLength: 900 },
  );

  assert.ok(index[0].excerpts.every((excerpt) => excerpt.length <= 900));
  assert.ok(index[0].excerpts.join('').includes('结尾标记'));
});

test('chat index lets offline evaluations vary the excerpt size', () => {
  const index = createChatIndex(
    [
      {
        title: 'Chunk size experiment',
        description: 'A sufficiently long description for indexing.',
        body: Array.from({ length: 5 }, (_, i) => `第${i + 1}段。${'内容'.repeat(300)}`).join(
          '\n\n',
        ),
        url: '/writing/chunk-size/',
        locale: 'zh-CN',
      },
    ],
    { maxExcerptLength: 300 },
  );

  assert.ok(index[0].excerpts.length > 5);
  assert.ok(index[0].excerpts.every((excerpt) => excerpt.length <= 300));
});

test('chat API rejects malformed requests before calling external services', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: '{not json',
  });
  let externalCalls = 0;

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    async () => {
      externalCalls += 1;
      throw new Error('Unexpected external request');
    },
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: 'INVALID_REQUEST', message: 'Invalid chat request.' },
  });
  assert.equal(externalCalls, 0);
});

test('chat API rejects a current-page URL outside its own site', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({
      question: 'What does this article say?',
      locale: 'en',
      pageUrl: 'https://attacker.example/article/',
    }),
  });
  let externalCalls = 0;

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    async () => {
      externalCalls += 1;
      throw new Error('Unexpected external request');
    },
  );

  assert.equal(response.status, 400);
  assert.equal(externalCalls, 0);
});

test('chat API returns cited answer and never forwards the browser request body verbatim', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({ question: 'What helps engineering teams improve?', locale: 'en' }),
  });
  const calls = [];
  const indexedSources = createChatSearchIndex(
    sources.map(({ title, url, locale, text }) => ({ title, url, locale, body: text })),
  );
  const fetcher = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes('/chat-index/')) {
      return Response.json(indexedSources);
    }
    return Response.json({
      candidates: [{ content: { parts: [{ text: 'Feedback loops support improvement. [S1]' }] } }],
    });
  };

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    fetcher,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.answer, 'Feedback loops support improvement. [S1]');
  assert.deepEqual(result.sources, [
    { title: 'Engineering management', url: '/en/writing/2026/08/engineering-management/' },
  ]);
  assert.ok(calls[0].url.endsWith('/chat-index/en.json'));
  assert.equal(calls.length, 2);
  assert.equal(calls[1].init.headers['x-goog-api-key'], 'test-only-api-key');
  assert.match(calls[1].init.body, /feedback loops help engineering teams improve/i);
});

test('chat API uses the published current article as context for page-specific questions', async () => {
  const page = sources[1];
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({
      question: '这篇主要在说什么？',
      locale: 'zh-CN',
      pageUrl: page.url,
      pageText: 'untrusted browser supplied text',
    }),
  });
  const indexedSources = createChatSearchIndex(
    sources.map(({ title, url, locale, text }) => ({
      title,
      url,
      locale,
      body:
        locale === 'zh-CN'
          ? `${text} 这段补充内容用于确保文章进入已发布索引。\n\n${'团队需要让反馈进入工作流程，并持续验证交付和协作是否改善。'.repeat(60)}\n\n最终结论是：先定义问题，围绕证据逐步做出可验证的选择。`
          : text,
    })),
  );
  let modelRequest;
  const fetcher = async (input, init = {}) => {
    if (String(input).includes('/chat-index/')) return Response.json(indexedSources);
    modelRequest = JSON.parse(init.body);
    return Response.json({
      candidates: [{ content: { parts: [{ text: '文章介绍了团队反馈回路。[S1]' }] } }],
    });
  };

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    fetcher,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result.sources, [{ title: page.title, url: page.url }]);
  assert.match(modelRequest.contents[0].parts[0].text, /团队通过反馈回路持续改进交付和协作/);
  assert.match(modelRequest.contents[0].parts[0].text, /最终结论是：先定义问题，围绕证据逐步做出可验证的选择/);
  assert.doesNotMatch(modelRequest.contents[0].parts[0].text, /untrusted browser supplied text/);
  assert.match(modelRequest.systemInstruction.parts[0].text, /当前页面|current page/i);
});

test('chat API recognizes common Chinese follow-ups about the page being read', async () => {
  const page = sources[1];
  const indexedSources = createChatSearchIndex([
    {
      title: page.title,
      url: page.url,
      locale: page.locale,
      body: `${page.text} ${'作者从反馈回路解释团队如何改进工作和协作。'.repeat(4)}`,
    },
  ]);
  const questions = [
    '这篇主要在说什么？',
    '作者为什么这样说？',
    '文中的方法怎么用？',
    '这和另一篇文章有什么关系？',
    '能用这篇的框架吗？',
  ];
  const fetcher = async (input) =>
    String(input).includes('/chat-index/')
      ? Response.json(indexedSources)
      : Response.json({ candidates: [{ content: { parts: [{ text: '依据当前文章回答。[S1]' }] } }] });

  for (const question of questions) {
    const request = new Request('https://liyuk.com/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
      body: JSON.stringify({ question, locale: 'zh-CN', pageUrl: page.url }),
    });
    const response = await handleChatRequest(
      request,
      { GEMINI_API_KEY: 'test-only-api-key' },
      fetcher,
    );

    assert.equal(response.status, 200, question);
    assert.deepEqual((await response.json()).sources, [{ title: page.title, url: page.url }]);
  }
});

test('chat API reuses the parsed article index within a warm function instance', async () => {
  let indexCalls = 0;
  let modelCalls = 0;
  const fetcher = async (input) => {
    if (String(input).includes('/chat-index/')) {
      indexCalls += 1;
      return Response.json(sources);
    }
    modelCalls += 1;
    return Response.json({
      candidates: [{ content: { parts: [{ text: 'A cited response. [S1]' }] } }],
    });
  };

  for (let i = 0; i < 2; i += 1) {
    const request = new Request('https://liyuk.com/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
      body: JSON.stringify({ question: 'What helps engineering teams improve?', locale: 'en' }),
    });
    const response = await handleChatRequest(
      request,
      { GEMINI_API_KEY: 'test-only-api-key' },
      fetcher,
    );
    assert.equal(response.status, 200);
  }

  assert.equal(indexCalls, 1);
  assert.equal(modelCalls, 2);
});

test('chat API gives an on-site fallback without spending model quota when retrieval finds nothing', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({ question: 'What is the weather today?', locale: 'en' }),
  });
  let modelCalls = 0;
  const fetcher = async (input) => {
    if (String(input).includes('/chat-index/')) return Response.json(sources);
    modelCalls += 1;
    throw new Error('The model should not be called');
  };

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    fetcher,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(result.answer, /could not find/i);
  assert.deepEqual(result.sources, []);
  assert.equal(modelCalls, 0);
});

test('chat API does not spend model quota on weak matches that fail the evidence threshold', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' },
    body: JSON.stringify({ question: '今天旧金山天气怎么样？', locale: 'zh-CN' }),
  });
  const index = createChatSearchIndex([
    {
      title: '在旧金山散步',
      description: '记录旧金山西海岸的一次旅行和街头观察。',
      body: '在旧金山的街道上散步，记录城市生活和海边风景。',
      url: '/writing/san-francisco-walk/',
      locale: 'zh-CN',
    },
  ]);
  let modelCalls = 0;
  const fetcher = async (input) => {
    if (String(input).includes('/chat-index/')) return Response.json(index);
    modelCalls += 1;
    throw new Error('The model should not be called for weak evidence');
  };

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    fetcher,
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(result.answer, /没有在本站|could not find/i);
  assert.deepEqual(result.sources, []);
  assert.equal(modelCalls, 0);
});

test('chat API rejects cross-origin requests', async () => {
  const request = new Request('https://liyuk.com/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
    body: JSON.stringify({ question: 'What is this site about?', locale: 'en' }),
  });

  const response = await handleChatRequest(
    request,
    { GEMINI_API_KEY: 'test-only-api-key' },
    async () => {
      throw new Error('Unexpected external request');
    },
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: { code: 'ORIGIN_NOT_ALLOWED', message: 'This origin cannot use the chat service.' },
  });
});


test('chat API combines vector candidates with keyword results and validates passage ids against the published index', async () => {
  const request = new Request('https://liyuk.com/api/chat', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' }, body: JSON.stringify({ question: '团队经验怎么传下来？', locale: 'zh-CN' }) });
  const index = createChatSearchIndex([{ title: '团队经验沉淀', description: '团队经验传递和交接实践。', body: '团队需要通过文档传递经验并做好交接。', url: '/writing/team-knowledge/', locale: 'zh-CN' }]);
  let prompt;
  const env = { GEMINI_API_KEY: 'test', AI: { run: async (_model, input) => ({ data: [[1, ...Array(1023).fill(0)]] }) }, VECTOR_INDEX: { query: async () => ({ matches: [{ score: .8, metadata: { url: '/writing/team-knowledge/', passageIndex: 0 } }, { score: .99, metadata: { url: '/unpublished/', passageIndex: 0 } }] }) } };
  const response = await handleChatRequest(request, env, async (input, init) => {
    if (String(input).includes('/chat-index/')) return Response.json(index);
    prompt = JSON.parse(init.body).contents[0].parts[0].text;
    return Response.json({ candidates: [{ content: { parts: [{ text: '依据文章回答。[S1]' }] } }] });
  });
  assert.equal(response.status, 200);
  assert.match(prompt, /团队需要通过文档传递经验/);
  assert.doesNotMatch(prompt, /unpublished/);
});

test('chat API falls back to keyword retrieval when vector services fail', async () => {
  const request = new Request('https://liyuk.com/api/chat', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://liyuk.com' }, body: JSON.stringify({ question: 'How do feedback loops help engineering teams?', locale: 'en' }) });
  const index = createChatSearchIndex(sources.map(({ title, url, locale, text }) => ({ title, description: text, body: text, url, locale })));
  const response = await handleChatRequest(request, { GEMINI_API_KEY: 'test', AI: { run: async () => { throw Error('unavailable'); } }, VECTOR_INDEX: { query: async () => ({ matches: [] }) } }, async (input) => String(input).includes('/chat-index/') ? Response.json(index) : Response.json({ candidates: [{ content: { parts: [{ text: 'Keyword fallback answer.' }] } }] }));
  assert.equal(response.status, 200);
  assert.match((await response.json()).answer, /Keyword fallback/);
});
