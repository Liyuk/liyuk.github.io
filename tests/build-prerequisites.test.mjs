import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('production builds install the Chromium headless shell required by Mermaid', () => {
  assert.match(packageJson.scripts.prebuild ?? '', /playwright install chromium --only-shell/);
});
