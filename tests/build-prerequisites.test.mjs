import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('production builds install the Chromium headless shell required by Mermaid', () => {
  assert.match(packageJson.scripts.prebuild ?? '', /playwright install chromium --only-shell/);
});

test('production builds audit article bodies before indexing them', () => {
  assert.match(
    packageJson.scripts.build,
    /astro build && node scripts\/audit-rendered-content\.mjs && pagefind --site dist/,
  );
});

test('Mermaid uses the same font stack as the site', async () => {
  const astroConfig = await readFile(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(astroConfig, /fontFamily:\s*'Inter, "Noto Sans SC", "PingFang SC"/);
});

test('the writing template demonstrates accessible Mermaid titles and descriptions', async () => {
  const writingTemplate = await readFile(new URL('../src/content/writing/_template.md', import.meta.url), 'utf8');
  assert.match(writingTemplate, /accTitle:/);
  assert.match(writingTemplate, /accDescr:/);
});
