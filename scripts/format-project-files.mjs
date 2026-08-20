// The formatter covers project-owned automation and root engineering entrypoints.
// Personal notes under docs/ are intentionally excluded from repository checks.
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT_FILES = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'prettier.config.mjs',
  '.github/dependabot.yml',
];
const ROOT_DIRECTORIES = ['.github/workflows'];
const SCRIPT_PREFIXES = [
  'audit-content.mjs',
  'audit-links.mjs',
  'audit-seo.mjs',
  'format-project-files.mjs',
  'run-browser-checks.mjs',
  'run-dev-browser-checks.mjs',
];
const TEST_PREFIXES = [
  'a11y-smoke.mjs',
  'content-audit.test.mjs',
  'draft-smoke.mjs',
  'link-audit.test.mjs',
  'seo-audit.test.mjs',
];

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

async function filesToFormat() {
  const roots = await Promise.all(ROOT_DIRECTORIES.map(walk));
  const scriptFiles = SCRIPT_PREFIXES.map((name) => path.join('scripts', name));
  const testFiles = TEST_PREFIXES.map((name) => path.join('tests', name));
  return [...ROOT_FILES, ...roots.flat(), ...scriptFiles, ...testFiles];
}

async function main() {
  const mode = process.argv.includes('--write') ? '--write' : '--check';
  const files = await filesToFormat();
  const prettier = path.join(process.cwd(), 'node_modules', 'prettier', 'bin', 'prettier.cjs');
  const result = spawnSync(process.execPath, [prettier, mode, ...files], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
