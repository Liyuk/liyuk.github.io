import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditContent } from '../scripts/audit-content.mjs';

async function fixture(root, relativePath, frontmatter) {
  const file = path.join(root, relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `---\n${frontmatter}\n---\nBody\n`);
}

const shared = `title: Example\ndescription: Example\ncreatedAt: 2026-08-19\npublishedAt: 2026-08-19\ndraft: false\ntags: [technology]`;

test('content audit accepts a consistent required translation pair', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(root, `writing/2026/08/consistent/zh.md`, shared);
  await fixture(
    root,
    `writing/2026/08/consistent/en.md`,
    `title: Example\ndescription: Example\nlocale: en\ntranslationStatus: reviewed\ntranslationKey: 2026/08/consistent\ncreatedAt: 2026-08-19\npublishedAt: 2026-08-19\ndraft: false\ntags: [technology]`,
  );

  const result = await auditContent({ contentRoot: root });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('content audit rejects inconsistent English metadata and unknown tags', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(root, `projects/2026/08/broken/zh.md`, `${shared}\ntags: [technology]`);
  await fixture(
    root,
    `projects/2026/08/broken/en.md`,
    `title: Broken\ndescription: Broken\nlocale: en\ntranslationStatus: original\ntranslationKey: wrong-key\ncreatedAt: 2026-08-18\npublishedAt: 2026-08-19\ndraft: true\ntags: [not-registered]`,
  );

  const result = await auditContent({ contentRoot: root });
  assert.ok(result.errors.some((error) => error.includes('translationKey')));
  assert.ok(result.errors.some((error) => error.includes('translationStatus')));
  assert.ok(result.errors.some((error) => error.includes('createdAt')));
  assert.ok(result.errors.some((error) => error.includes('draft')));
  assert.ok(result.errors.some((error) => error.includes('未注册标签')));
});

test('content audit rejects a published English translation still marked draft', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(root, `writing/2026/08/status/zh.md`, shared);
  await fixture(
    root,
    `writing/2026/08/status/en.md`,
    `title: Example\ndescription: Example\nlocale: en\ntranslationStatus: draft\ntranslationKey: 2026/08/status\ncreatedAt: 2026-08-19\npublishedAt: 2026-08-19\ndraft: false\ntags: [technology]`,
  );
  const result = await auditContent({ contentRoot: root });
  assert.ok(result.errors.some((error) => error.includes('已发布的 en 内容')));
});

test('content audit allows an unpublished English translation in draft status', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(
    root,
    `writing/2026/08/private-status/zh.md`,
    `${shared.replace('draft: false', 'draft: true')}`,
  );
  await fixture(
    root,
    `writing/2026/08/private-status/en.md`,
    `title: Example\ndescription: Example\nlocale: en\ntranslationStatus: draft\ntranslationKey: 2026/08/private-status\ncreatedAt: 2026-08-19\ndraft: true\ntags: [technology]`,
  );
  const result = await auditContent({ contentRoot: root });
  assert.equal(
    result.errors.some((error) => error.includes('translationStatus')),
    false,
  );
});
test('research translation fallback remains visible as a warning', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(root, `research/2026/08/pending/zh.md`, shared);

  const result = await auditContent({ contentRoot: root });
  assert.deepEqual(result.errors, []);
  assert.ok(result.warnings.some((warning) => warning.includes('fallback-allowed')));
});

test('required collections fail published content without an English sibling', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(root, `galleries/needs-en.md`, shared);

  const result = await auditContent({ contentRoot: root });
  assert.ok(result.errors.some((error) => error.includes('策略为 required')));
});

test('content audit requires a seoTitle when a published title exceeds the search budget', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  const longTitle = '这是一个非常非常长的中文标题，长到搜索结果页面一定会把它截断掉';
  await fixture(
    root,
    `research/2026/08/long/zh.md`,
    shared.replace('title: Example', `title: ${longTitle}`),
  );
  await fixture(
    root,
    `research/2026/08/short/zh.md`,
    shared.replace('title: Example', `title: ${longTitle}\nseoTitle: "关键词前置的短标题"`),
  );
  await fixture(
    root,
    `research/2026/08/still-long/zh.md`,
    shared.replace('title: Example', `title: ${longTitle}\nseoTitle: "${longTitle}再长一点"`),
  );
  await fixture(
    root,
    `research/2026/08/draft/zh.md`,
    shared.replace('title: Example', `title: ${longTitle}`).replace('draft: false', 'draft: true'),
  );

  const { errors } = await auditContent({ contentRoot: root });
  assert.ok(
    errors.some(
      (error) => error.includes('long/zh.md') && error.includes('请补一个关键词前置的 seoTitle'),
    ),
  );
  assert.ok(
    errors.some((error) => error.includes('still-long/zh.md') && error.includes('seoTitle 宽度')),
  );
  assert.ok(!errors.some((error) => error.includes('/short/zh.md') && error.includes('宽度')));
  assert.ok(!errors.some((error) => error.includes('/draft/zh.md') && error.includes('宽度')));
});

test('content audit rejects a seoTitle identical to the title', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-content-audit-'));
  await fixture(
    root,
    `research/2026/08/same/zh.md`,
    shared.replace('title: Example', 'title: Example\nseoTitle: Example'),
  );
  const { errors } = await auditContent({ contentRoot: root });
  assert.ok(errors.some((error) => error.includes('seoTitle 与 title 相同')));
});
