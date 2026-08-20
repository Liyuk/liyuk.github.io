// Serve `dist/` with a small deterministic static server, run one or more
// Playwright scripts against it, then clean up. This avoids relying on an
// interactive `astro preview` process in CI.
import { createReadStream } from 'node:fs';
import { access, mkdir, rm, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DIST_DIR = path.join(process.cwd(), 'dist');
const RUN_TIMEOUT_MS = Number(process.env.BROWSER_CHECK_TIMEOUT_MS ?? 120_000);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

async function readableFile(candidate) {
  try {
    if (!(await stat(candidate)).isFile()) return null;
    await access(candidate);
    return candidate;
  } catch {
    return null;
  }
}

async function requestFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const root = path.resolve(DIST_DIR);
  const target = path.resolve(root, `.${decoded}`);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) return null;

  const candidates = decoded.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, `${target}.html`, path.join(target, 'index.html')];
  for (const candidate of candidates) {
    const file = await readableFile(candidate);
    if (file) return file;
  }
  return null;
}

function startServer() {
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = await requestFile(pathname);
    const isNotFound = !file;
    const fallback = isNotFound ? path.join(DIST_DIR, '404.html') : file;
    const target = (await readableFile(fallback)) ?? null;
    if (!target) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(isNotFound ? 404 : 200, {
      'Content-Type': MIME_TYPES[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    createReadStream(target).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function runScript(script, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    });
    let settled = false;
    let timedOut = false;
    let killTimer;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      resolve(timedOut ? 1 : code);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      console.error(`浏览器检查超时：${script}`);
      child.kill('SIGTERM');
      killTimer = setTimeout(() => {
        if (child.exitCode === null) child.kill('SIGKILL');
      }, 5_000);
    }, RUN_TIMEOUT_MS);
    child.once('exit', (code, signal) => finish(code ?? (signal ? 1 : 0)));
    child.once('error', () => finish(1));
  });
}

async function main() {
  const scripts = process.argv.slice(2);
  if (!scripts.length)
    throw new Error('用法：node scripts/run-browser-checks.mjs <test script> [...]');
  await access(path.join(DIST_DIR, 'index.html'));

  const artifactDir =
    process.env.E2E_ARTIFACTS_DIR ?? path.join(process.cwd(), 'artifacts', 'browser-checks');
  await mkdir(artifactDir, { recursive: true });
  await Promise.all(
    ['e2e-failure.png', 'e2e-trace.zip'].map((name) =>
      rm(path.join(artifactDir, name), { force: true }),
    ),
  );
  const server = await startServer();
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  console.log(`▶ 静态站点已启动：${base}`);

  try {
    for (const script of scripts) {
      const code = await runScript(script, {
        ...process.env,
        E2E_BASE: base,
        E2E_ARTIFACTS_DIR: artifactDir,
      });
      if (code !== 0) process.exitCode = code;
      if (code !== 0) break;
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
