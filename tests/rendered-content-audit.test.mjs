import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditRenderedContent } from '../scripts/audit-rendered-content.mjs';

test('rendered content audit rejects an article with an empty prose body', async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'liyuk-rendered-content-'));

  try {
    const articleDir = path.join(distDir, 'research', 'example');
    await mkdir(articleDir, { recursive: true });
    await writeFile(
      path.join(articleDir, 'index.html'),
      '<article class="article shell"><div class="prose"></div></article>',
    );

    const result = await auditRenderedContent({ distDir });

    assert.equal(result.articles, 1);
    assert.deepEqual(result.errors, ['/research/example/: 正文容器为空。']);
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
});

test('rendered content audit accepts article content and ignores non-article pages', async () => {
  const distDir = await mkdtemp(path.join(os.tmpdir(), 'liyuk-rendered-content-'));

  try {
    await writeFile(
      path.join(distDir, 'index.html'),
      '<main><div class="prose"></div></main>',
    );
    const articleDir = path.join(distDir, 'writing', 'example');
    await mkdir(articleDir, { recursive: true });
    await writeFile(
      path.join(articleDir, 'index.html'),
      '<article class="article shell"><div class="prose"><p>正文内容</p></div></article>',
    );

    const result = await auditRenderedContent({ distDir });

    assert.equal(result.articles, 1);
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
});
