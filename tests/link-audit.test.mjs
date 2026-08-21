import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditLinks } from '../scripts/audit-links.mjs';

async function makeDist() {
  return mkdtemp(path.join(os.tmpdir(), 'liyuk-link-audit-'));
}

test('link audit accepts generated routes and ignores external URLs', async () => {
  const dist = await makeDist();
  await mkdir(path.join(dist, 'writing'), { recursive: true });
  await writeFile(
    path.join(dist, 'index.html'),
    '<a href="/writing/">Writing</a><a href="https://example.com">External</a><a href="#top">Top</a>',
  );
  await writeFile(path.join(dist, 'writing', 'index.html'), '<h1>Writing</h1>');

  const result = await auditLinks({ distDir: dist });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 1);
});

test('link audit reports a missing same-site route', async () => {
  const dist = await makeDist();
  await writeFile(path.join(dist, 'index.html'), '<a href="/missing/">Missing</a>');

  const result = await auditLinks({ distDir: dist });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /\/missing\//);
});
