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
  // `/writing/` and `#top`; the external URL stays out of scope.
  assert.equal(result.checked, 2);
});

test('link audit resolves same-site absolute URLs instead of skipping them', async () => {
  const dist = await makeDist();
  await writeFile(
    path.join(dist, 'index.html'),
    '<a href="https://liyuk.com/missing/">Absolute</a>',
  );

  const result = await auditLinks({ distDir: dist });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /https:\/\/liyuk\.com\/missing\//);
});

test('link audit catches a fragment with no matching id, on this page or another', async () => {
  const dist = await makeDist();
  await mkdir(path.join(dist, 'writing'), { recursive: true });
  await writeFile(
    path.join(dist, 'index.html'),
    '<h2 id="real">Real</h2><a href="#real">Same page ok</a><a href="#ghost">Same page broken</a>' +
      '<a href="/writing/#there">Cross page ok</a><a href="/writing/#nowhere">Cross page broken</a>',
  );
  await writeFile(path.join(dist, 'writing', 'index.html'), '<h2 id="there">There</h2>');

  const result = await auditLinks({ distDir: dist });
  assert.equal(result.errors.length, 2, result.errors.join('\n'));
  assert.ok(result.errors.some((error) => error.includes('#ghost')));
  assert.ok(result.errors.some((error) => error.includes('#nowhere')));
});

test('link audit reports a missing same-site route', async () => {
  const dist = await makeDist();
  await writeFile(path.join(dist, 'index.html'), '<a href="/missing/">Missing</a>');

  const result = await auditLinks({ distDir: dist });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /\/missing\//);
});
