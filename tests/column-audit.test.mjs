import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { auditColumns, parseColumnField } from '../scripts/audit-columns.mjs';
import { columns as columnRegistry, startGroups } from '../src/lib/taxonomy.ts';

test('column audit passes on the current content (positive, unique orders)', async () => {
  const errors = await auditColumns();
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('column audit only requires a registered column and valid order', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-column-audit-'));
  const writingDir = path.join(root, 'writing', '2026', '08', 'example');
  await mkdir(writingDir, { recursive: true });
  await writeFile(
    path.join(writingDir, 'zh.md'),
    `---\ntitle: 示例\ndescription: 示例\ncolumn: { slug: technical-systems, order: 99 }\n---\n正文\n`,
  );

  try {
    const errors = await auditColumns({ contentRoot: root });
    assert.deepEqual(errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('column parsing accepts both the inline and the block YAML shape', () => {
  assert.deepEqual(parseColumnField('column: { slug: technical-systems, order: 2 }'), { slug: 'technical-systems', order: '2' });
  assert.deepEqual(parseColumnField('column:\n  slug: technical-systems\n  order: 2\n'), { slug: 'technical-systems', order: '2' });
  assert.deepEqual(parseColumnField("column:\n  slug: 'technical-systems'\n  order: 2\n"), { slug: 'technical-systems', order: '2' });
  assert.equal(parseColumnField('title: T\ntags: [a]\n'), null);
});

test('block-form columns are audited, not silently skipped', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-column-block-'));
  const dir = path.join(root, 'writing', '2026', '08', 'block-form');
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, 'zh.md'),
    `---\ntitle: 示例\ncolumn:\n  slug: not-a-registered-column\n  order: 1\n---\n正文\n`,
  );

  try {
    const errors = await auditColumns({ contentRoot: root });
    assert.equal(errors.length, 1, errors.join('\n'));
    assert.match(errors[0], /未知专栏 slug/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a non-positive order is reported rather than skipped by the pattern', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-column-order-'));
  const dir = path.join(root, 'writing', '2026', '08', 'bad-order');
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, 'zh.md'),
    `---\ntitle: 示例\ncolumn: { slug: technical-systems, order: 0 }\n---\n正文\n`,
  );

  try {
    const errors = await auditColumns({ contentRoot: root });
    assert.equal(errors.length, 1, errors.join('\n'));
    assert.match(errors[0], /order 必须是正整数/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('an empty audit scope fails instead of reporting a clean pass', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'liyuk-column-empty-'));
  try {
    const errors = await auditColumns({ contentRoot: root });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /审计范围为空/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('start page groups cover every registered column exactly once', () => {
  const listed = startGroups.flatMap((group) => group.columns);
  const registered = Object.keys(columnRegistry);

  for (const slug of registered) {
    assert.equal(
      listed.filter((s) => s === slug).length,
      1,
      `专栏 "${slug}" 必须恰好出现在一个 start 分组里`,
    );
  }
  for (const slug of listed) {
    assert.ok(slug in columnRegistry, `start 分组引用了未注册的专栏 "${slug}"`);
  }
});
