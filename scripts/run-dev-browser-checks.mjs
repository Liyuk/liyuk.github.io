// Start an isolated Astro development server, run a draft smoke script, and
// always clean up the child process. This intentionally does not use Astro's
// background-server lock, so it cannot stop or reuse a developer's own server.
import { access, readdir, readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content');
const ASTRO_BIN = path.join(ROOT, 'node_modules', '.bin', 'astro');
const READY_TIMEOUT_MS = 90_000;
const CHILD_STOP_TIMEOUT_MS = 10_000;

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

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const values = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (field) values[field[1]] = field[2].trim();
  }
  return values;
}

function isDraft(raw) {
  return parseFrontmatter(raw)?.draft === 'true';
}

function isTemplate(file) {
  return path.basename(file).startsWith('_template.');
}

function routeForFile(file) {
  const rel = path.relative(CONTENT_ROOT, file).split(path.sep);
  const collection = rel[0];
  if (collection === 'galleries') {
    const slug = rel
      .at(-1)
      .replace(/\.en?\.mdx?$/, '')
      .replace(/\.mdx?$/, '');
    return `/photos/${slug}/`;
  }
  const route = collection === 'projects' ? 'projects' : collection;
  const slug = rel.slice(1, -1).join('/');
  return `/${route}/${slug}/`;
}

async function findRoutes() {
  const files = (await walk(CONTENT_ROOT)).filter((file) => /\.mdx?$/.test(file));
  const routes = { writing: null, research: null, projects: null, gallery: null };
  for (const file of files.sort()) {
    if (isTemplate(file)) continue;
    const raw = await readFile(file, 'utf8');
    if (!isDraft(raw)) continue;
    const rel = path.relative(CONTENT_ROOT, file).split(path.sep);
    const key = rel[0] === 'galleries' ? 'gallery' : rel[0];
    if (key in routes && !routes[key]) routes[key] = routeForFile(file);
  }
  return routes;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForReady(base, child) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let lastError = 'not started';
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`Astro dev exited before ready (code ${child.exitCode}).`);
    try {
      const response = await fetch(`${base}/`);
      if (response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Astro dev at ${base}: ${lastError}`);
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    let timer;
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    child.once('exit', done);
    child.kill('SIGTERM');
    timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
      child.once('exit', done);
    }, CHILD_STOP_TIMEOUT_MS);
  });
}

async function runScript(script, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: ROOT,
      env,
      stdio: 'inherit',
    });
    child.once('error', () => resolve(1));
    child.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function main() {
  const script = process.argv[2] ?? 'tests/draft-smoke.mjs';
  await access(ASTRO_BIN);
  const routes = await findRoutes();
  const required = ['writing'];
  const missing = required.filter((collection) => !routes[collection]);
  if (missing.length) {
    console.log(`没有可预览的非模板草稿（${missing.join(', ')}），跳过 draft smoke。`);
    return;
  }
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const output = [];
  const child = spawn(
    ASTRO_BIN,
    ['dev', '--host', '127.0.0.1', '--port', String(port), '--ignore-lock'],
    {
      cwd: ROOT,
      env: { ...process.env, ASTRO_DEV_BACKGROUND: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (chunk) => output.push(chunk.toString()));
  child.stderr.on('data', (chunk) => output.push(chunk.toString()));
  try {
    await waitForReady(base, child);
    console.log(`▶ Astro dev 已启动：${base}`);
    const code = await runScript(script, {
      ...process.env,
      E2E_BASE: base,
      DRAFT_WRITING_ROUTE: routes.writing,
      DRAFT_RESEARCH_ROUTE: routes.research ?? '',
      DRAFT_PROJECT_ROUTE: routes.projects ?? '',
      DRAFT_GALLERY_ROUTE: routes.gallery ?? '',
    });
    if (code !== 0) process.exitCode = code;
  } finally {
    await stopChild(child);
    if (child.exitCode !== 0 && child.exitCode !== null) {
      console.error(output.join('').slice(-4000));
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
