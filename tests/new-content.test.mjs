import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSlug, buildFrontmatter, isValidDate, validateSlug, validateTags } from '../scripts/lib/cli.mjs';
import { buildPostFrontmatter, parseTags, parseRelatedQueries, postPath, pickSlug, rankSearchSuggestions, resolveQueryChoice } from '../scripts/new-post.mjs';
import { askGalleryColumn, buildGalleryFrontmatter, galleryFilePath, imageIdFromName, scanImageFiles } from '../scripts/new-gallery.mjs';
import { publishFrontmatter, findEntriesBySlug, requiresEditorialConfirmation, searchMetadataError } from '../scripts/publish.mjs';
import { validateSearchMetadata } from '../src/lib/search-intent.ts';

test('buildSlug turns English titles into kebab-case', () => {
  assert.equal(buildSlug('Hello World'), 'hello-world');
  assert.equal(buildSlug('  Trim   Me  '), 'trim-me');
  assert.equal(buildSlug('Café & Code'), 'cafe-code');
  assert.equal(buildSlug('already-kebab'), 'already-kebab');
  assert.equal(buildSlug('UPPER case'), 'upper-case');
});

test('buildSlug returns null for Chinese titles', () => {
  assert.equal(buildSlug('这是一个中文标题'), null);
});

test('isValidDate validates YYYY-MM-DD', () => {
  assert.equal(isValidDate('2026-08-15'), true);
  assert.equal(isValidDate('2028-02-29'), true); // leap year
  assert.equal(isValidDate('2026-02-29'), false); // 2026 is not a leap year
  assert.equal(isValidDate('2026-02-30'), false); // Feb never has 30 days
  assert.equal(isValidDate('2026-13-01'), false); // month 13
  assert.equal(isValidDate('26-08-15'), false); // non-zero-padded year
  assert.equal(isValidDate(''), false);
});

test('validateSlug rejects unsafe slugs', () => {
  assert.equal(validateSlug('maomao-2026'), null);
  assert.equal(validateSlug('Maomao'), 'slug 只能包含小写字母、数字和连字符（如 maomao-2026）');
  assert.equal(validateSlug('maomao 2026'), 'slug 只能包含小写字母、数字和连字符（如 maomao-2026）');
});

test('validateTags allows known tags and warns on new ones', () => {
  const registry = { technology: 1, 'work-leadership': 1 };
  assert.equal(validateTags(['technology'], registry), null);
  assert.equal(validateTags(['technology', 'work-leadership'], registry), null);
  assert.ok(validateTags(['nonexistent'], registry)?.includes('nonexistent'));
});

test('parseTags splits on commas and spaces', () => {
  assert.deepEqual(parseTags('a, b c'), ['a', 'b', 'c']);
  assert.deepEqual(parseTags('  技术， 数据 '), ['技术', '数据']);
  assert.deepEqual(parseTags(''), []);
});

test('parseRelatedQueries preserves phrases and splits comma separated variants', () => {
  assert.deepEqual(parseRelatedQueries('AI gateway fallback, LLM 网关，429 重试'), ['AI gateway fallback', 'LLM 网关', '429 重试']);
  assert.deepEqual(parseRelatedQueries(''), []);
});

test('new-post query ideas prioritize site demand and accept a selected suggestion', () => {
  const ideas = rankSearchSuggestions([
    { query: 'old query', locale: 'zh-CN', impressions: 80, flags: [] },
    { query: 'sprint query', locale: 'zh-CN', impressions: 12, flags: ['sprint'] },
    { query: 'English query', locale: 'en', impressions: 100, flags: ['sprint'] },
  ], 'zh-CN', 2);
  assert.deepEqual(ideas.map((item) => item.query), ['sprint query', 'old query']);
  assert.equal(resolveQueryChoice('1', ideas), 'sprint query');
  assert.equal(resolveQueryChoice('a new query', ideas), 'a new query');
});

test('pickSlug uses the asked slug, else auto-derives', () => {
  assert.equal(pickSlug('Whatever', 'custom-slug'), 'custom-slug');
  assert.equal(pickSlug('Hello World', null), 'hello-world');
  assert.equal(pickSlug('中文标题', null), null);
});

test('buildPostFrontmatter produces legal consulting (strict) frontmatter', () => {
  const fm = buildPostFrontmatter('consulting', {
    title: '一次转岗对话',
    description: '一次关于转岗时机的咨询记录。',
    createdAt: '2026-08-29',
    publishedAt: '2026-08-29',
    draft: true,
    tags: ['career'],
    format: 'interview',
    episode: 3,
    guest: 'K',
    column: { slug: 'technical-systems', order: 4 },
    searchIntent: 'service',
    primaryQuery: '工程师转管理咨询',
    relatedQueries: ['技术管理咨询', '工程师转管理如何准备'],
  });
  assert.equal(fm.format, 'interview');
  assert.equal(fm.episode, 3);
  assert.deepEqual(fm.column, { slug: 'technical-systems', order: 4 });
  // strict schema: no keys beyond what consulting allows
  const allowed = new Set(['title', 'description', 'createdAt', 'draft', 'tags', 'publishedAt', 'format', 'episode', 'guest', 'column', 'searchIntent', 'primaryQuery', 'relatedQueries']);
  for (const key of Object.keys(fm)) assert.ok(allowed.has(key), `unexpected key: ${key}`);
  assert.equal(fm.primaryQuery, '工程师转管理咨询');
  assert.equal(fm.searchIntent, 'service');
  assert.deepEqual(fm.relatedQueries, ['技术管理咨询', '工程师转管理如何准备']);
});

test('consulting entries land in the consulting collection directory', () => {
  assert.ok(postPath('consulting', '2026-08-29', 'a-transfer-conversation').endsWith('src/content/consulting/2026/08/a-transfer-conversation/zh.md'));
});

test('optional consulting fields are omitted rather than emitted empty', () => {
  const fm = buildPostFrontmatter('consulting', {
    title: 'T', description: 'D', createdAt: '2026-08-29', publishedAt: '2026-08-29', draft: true, tags: [],
  });
  assert.equal(fm.format, 'career-case');
  assert.equal('episode' in fm, false);
  assert.equal('guest' in fm, false);
  assert.equal('column' in fm, false);
});

test('buildPostFrontmatter produces legal writing (strict) frontmatter', () => {
  const fm = buildPostFrontmatter('article', {
    title: '测试', description: '描述', createdAt: '2026-08-15', draft: true, tags: ['technology'],
    publishedAt: '2026-08-15', type: 'note', column: { slug: 'technical-systems', order: 2 },
    searchIntent: 'howto', primaryQuery: '怎样建立技术知识库', relatedQueries: ['技术知识库入口页'],
  });
  assert.equal(fm.title, '测试');
  assert.equal(fm.publishedAt, '2026-08-15');
  assert.equal(fm.type, 'note');
  assert.deepEqual(fm.column, { slug: 'technical-systems', order: 2 });
  // strict schema: no keys beyond what writing allows
  assert.equal(fm.reading, undefined);
  const allowed = new Set(['title', 'description', 'createdAt', 'draft', 'tags', 'publishedAt', 'type', 'column', 'searchIntent', 'primaryQuery', 'relatedQueries']);
  for (const key of Object.keys(fm)) assert.ok(allowed.has(key), `unexpected key: ${key}`);
  assert.equal(fm.primaryQuery, '怎样建立技术知识库');
});

test('buildPostFrontmatter emits research required fields', () => {
  const fm = buildPostFrontmatter('research', {
    title: 'R', description: 'D', createdAt: '2026-08-15', draft: true, tags: [],
    version: '0.1', status: 'preprint', repositoryUrl: 'https://github.com/x/y', paperUrl: 'https://github.com/x/y',
  });
  assert.equal(fm.status, 'preprint');
  assert.equal(fm.version, '0.1');
  assert.equal(fm.repositoryUrl, 'https://github.com/x/y');
  assert.ok(!('publishedAt' in fm));
});

test('buildPostFrontmatter emits project work vs tool fields', () => {
  const work = buildPostFrontmatter('project', {
    title: 'P', description: 'D', createdAt: '2026-08-15', draft: true, tags: [],
    status: 'active', repositoryUrl: 'https://platform.example', workUrl: 'https://platform.example',
    work: { penName: '笔名', platform: '平台', status: '连载中' },
  });
  assert.equal(work.work.penName, '笔名');
  assert.ok(!('hero' in work));

  const tool = buildPostFrontmatter('project', {
    title: 'P', description: 'D', createdAt: '2026-08-15', draft: true, tags: [],
    status: 'active', repositoryUrl: 'https://github.com/x/y', hero: { src: '/img.png', alt: 'a' },
  });
  assert.equal(tool.hero.alt, 'a');
  assert.ok(!('work' in tool));
});

test('postPath places files under the dated collection directory', () => {
  const p = postPath('article', '2026-08-15', 'my-post');
  assert.ok(p.endsWith('src/content/writing/2026/08/my-post/zh.md'), p);
  assert.ok(postPath('project', '2026-08-15', 'x').endsWith('src/content/projects/2026/08/x/zh.md'));
  assert.ok(postPath('research', '2026-08-15', 'x').endsWith('src/content/research/2026/08/x/zh.md'));
});

test('buildFrontmatter renders arrays and nested objects as YAML', () => {
  const fm = buildFrontmatter({ title: '测试', tags: ['a', 'b'], column: { slug: 'x', order: 2 } });
  assert.ok(fm.includes('tags: [a, b]'), fm);
  assert.ok(fm.includes('column: { slug: x, order: 2 }'), fm);
  assert.ok(fm.startsWith('---'));
  assert.ok(fm.endsWith('---\n'));
});

test('gallery helpers build ids, paths and frontmatter', () => {
  assert.equal(imageIdFromName('IMG_1234.heic', 0), 'img-1234-1');
  assert.equal(imageIdFromName('maomao.jpg', 0), 'maomao-1');
  assert.equal(imageIdFromName('照片.png', 0), 'photo-1');

  const path = galleryFilePath('maomao');
  assert.ok(path.endsWith('src/content/galleries/maomao.md'), path);

  const fm = buildGalleryFrontmatter({
    title: 'T', description: 'D', slug: 'maomao', createdAt: '2026-08-15', cover: 'maomao-1',
    images: [{ id: 'maomao-1', src: '/x.webp', width: 100, height: 200 }],
    primaryQuery: '猫咪窗边摄影', relatedQueries: ['猫咪日常照片'],
  });
  assert.equal(fm.cover, 'maomao-1');
  assert.equal(fm.images[0].width, 100);
  assert.equal(fm.searchIntent, 'visual');
  assert.equal(fm.primaryQuery, '猫咪窗边摄影');
});

test('scanImageFiles filters non-images and dotfiles', async () => {
  // Point at a real directory containing images (public/images/galleries/maomao).
  const dir = new URL('../public/images/galleries/maomao', import.meta.url).pathname;
  const files = await scanImageFiles(dir);
  assert.ok(files.length >= 2, `expected images, got ${files.length}`);
  assert.ok(files.every((f) => f.endsWith('.webp')), files.join(','));
});

test('a gallery can join a column, and omits the key when it does not', () => {
  const base = { title: 'T', description: 'D', slug: 's', createdAt: '2026-08-29', cover: 'c', images: [] };
  const withColumn = buildGalleryFrontmatter({ ...base, column: { slug: 'technical-systems', order: 2 } });
  assert.deepEqual(withColumn.column, { slug: 'technical-systems', order: 2 });
  assert.equal('column' in buildGalleryFrontmatter(base), false);
});

test('the gallery column prompt only returns registered slugs and positive orders', async (t) => {
  const registry = { 'technical-systems': { label: { 'zh-CN': '技术系统' } } };
  const scripted = (answers) => {
    const queue = [...answers];
    return { ask: async () => queue.shift() ?? '' };
  };
  // The prompt prints the column menu; keep it off the test runner's stdout
  // channel, which carries the serialized results of every test in this file.
  const log = console.log;
  console.log = () => {};
  t.after(() => {
    console.log = log;
  });

  assert.deepEqual(await askGalleryColumn(scripted(['1', '3']), registry), { slug: 'technical-systems', order: 3 });
  assert.deepEqual(await askGalleryColumn(scripted(['技术系统', '1']), registry), { slug: 'technical-systems', order: 1 });
  assert.equal(await askGalleryColumn(scripted(['']), registry), null);
  assert.equal(await askGalleryColumn(scripted(['1', '2']), {}), null);
});

test('publishing normalizes draft and translation status by locale', () => {
  const english = publishFrontmatter('---\ntitle: T\ndraft: true\ntranslationStatus: draft\n---\nbody', 'en');
  assert.match(english, /draft: false/);
  assert.match(english, /translationStatus: reviewed/);
  const chinese = publishFrontmatter('---\ntitle: T\ndraft: true\n---\nbody', 'zh-CN');
  assert.match(chinese, /draft: false/);
  assert.match(chinese, /translationStatus: original/);
  assert.equal(publishFrontmatter('---\ntitle: T\ndraft: false\ntranslationStatus: reviewed\n---\nbody', 'en'), null);
});

test('publishing requires explicit editorial confirmation while any sibling is a draft', () => {
  assert.equal(requiresEditorialConfirmation([
    { content: '---\ndraft: true\n---\nbody' },
    { content: '---\ndraft: false\n---\nbody' },
  ]), true);
  assert.equal(requiresEditorialConfirmation([
    { content: '---\ndraft: false\n---\nbody' },
  ]), false);
});

test('search metadata requires a reader query and a supported intent', () => {
  assert.equal(validateSearchMetadata({ primaryQuery: 'AI Gateway 是什么', searchIntent: 'definition' }), null);
  assert.match(validateSearchMetadata({ primaryQuery: '', searchIntent: 'definition' }), /primaryQuery/);
  assert.match(validateSearchMetadata({ primaryQuery: '工程师面试', searchIntent: 'trending' }), /searchIntent/);
  assert.match(validateSearchMetadata({ primaryQuery: '工作', searchIntent: 'essay', relatedQueries: ['工作', '管理'] }), /重复/);
});

test('publish preflight requires search metadata on drafts in each locale', () => {
  assert.equal(searchMetadataError('---\nprimaryQuery: AI Gateway 是什么\nsearchIntent: definition\nrelatedQueries: [AI 网关, LLM gateway]\n---\n正文'), null);
  assert.match(searchMetadataError('---\ntitle: 缺少 SEO 意图\n---\n正文'), /primaryQuery/);
  assert.match(searchMetadataError('---\nprimaryQuery: 工程师面试\nsearchIntent: trending\n---\n正文'), /searchIntent/);
});


test('findEntriesBySlug locates a real gallery', async () => {
  const matches = await findEntriesBySlug('maomao');
  assert.ok(matches.length >= 1, 'should find maomao gallery');
  assert.ok(matches.every((m) => m.collection === 'gallery'), JSON.stringify(matches));
});
