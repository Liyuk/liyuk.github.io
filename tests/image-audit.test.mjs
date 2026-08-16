import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { extractImageReferences, auditImageQuality } from '../scripts/audit-images.mjs';

test('image audit recognizes Markdown and frontmatter image references', () => {
  const references = extractImageReferences(`
![流程图](./images/workflow.svg)
![带空格的图](<./images/cover image.png>)
hero:
  src: /images/projects/example/hero.png
`);

  assert.deepEqual(references, [
    './images/workflow.svg',
    './images/cover image.png',
    '/images/projects/example/hero.png',
  ]);
});

test('image quality audit flags oversized and PNG images', async () => {
  const root = await mkdtemp(join(tmpdir(), 'img-audit-'));
  // public/images with a small webp, an oversized webp, and a PNG
  await mkdir(join(root, 'public', 'images', 'gallery'), { recursive: true });
  await writeFile(join(root, 'public', 'images', 'gallery', 'small.webp'), 'x'.repeat(10 * 1024)); // 10 KB
  await writeFile(join(root, 'public', 'images', 'gallery', 'big.webp'), 'x'.repeat(300 * 1024)); // 300 KB > 200 KB
  await writeFile(join(root, 'public', 'images', 'gallery', 'photo.png'), 'x'.repeat(50 * 1024));

  const { flags } = await auditImageQuality(root, { maxBytes: 200 * 1024 });
  const joined = flags.join('\n');
  assert.match(joined, /big\.webp/);
  assert.match(joined, /photo\.png/);
  assert.doesNotMatch(joined, /small\.webp/);
});

test('image quality audit reports nothing on a clean set', async () => {
  const root = await mkdtemp(join(tmpdir(), 'img-audit-'));
  await mkdir(join(root, 'public', 'images'), { recursive: true });
  await writeFile(join(root, 'public', 'images', 'ok.webp'), 'x'.repeat(50 * 1024)); // 50 KB, webp

  const { flags } = await auditImageQuality(root, { maxBytes: 200 * 1024 });
  assert.deepEqual(flags, []);
});

