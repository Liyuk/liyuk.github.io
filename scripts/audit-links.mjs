// Verify that every same-site href in the built static output resolves to a
// generated file. External URLs are intentionally out of scope: checking them
// in a publish gate would make a deployment depend on third-party availability.
//
// Run after `npm run build`: npm run audit:links
import { readFile, readdir, stat, glob } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.mjs';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

function pageRoute(distDir, htmlFile) {
  const rel = path.relative(distDir, htmlFile).split(path.sep).join('/');
  return rel === 'index.html' ? '/' : `/${rel.replace(/index\.html$/, '')}`;
}

// Returns { pathname, hash } for anything that points back at this site —
// including a bare `#fragment` (same page) and an absolute `https://liyuk.com/…`
// URL, both of which an earlier version skipped entirely.
function localHref(rawHref, route) {
  if (!rawHref || /^(?:mailto:|tel:|data:|javascript:)/i.test(rawHref)) return null;
  try {
    const url = new URL(rawHref, `https://site.invalid${route}`);
    const isSameSite =
      url.origin === 'https://site.invalid' || `${url.protocol}//${url.host}` === site.url;
    if (!isSameSite) return null;
    return { pathname: url.pathname, hash: decodeURIComponent(url.hash.slice(1)) };
  } catch {
    return null;
  }
}

const ID_RE = /\bid=(?:"([^"]*)"|'([^']*)')/gi;
function idsIn(html) {
  return new Set([...html.matchAll(ID_RE)].map((match) => match[1] ?? match[2]));
}

// Resolve a URL path to the built file that serves it, so a fragment can be
// looked up in the page it actually lands on.
async function builtFileFor(distDir, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const base = path.resolve(distDir);
  const target = path.resolve(base, `.${decoded}`);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) return null;
  const candidates = decoded.endsWith('/')
    ? [path.join(target, 'index.html')]
    : [target, `${target}.html`, path.join(target, 'index.html')];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return null;
}

async function isFile(candidate) {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

export async function auditLinks({
  distDir = path.join(process.cwd(), 'dist'),
  sourceRoot = path.join(process.cwd(), 'src/content'),
} = {}) {
  const errors = [];
  let files;
  try {
    files = (await walk(distDir)).filter((file) => file.endsWith('.html'));
  } catch {
    return {
      errors: [
        `找不到构建目录 ${path.relative(process.cwd(), distDir) || 'dist'}；请先运行 npm run build。`,
      ],
      checked: 0,
    };
  }

  const seen = new Set();
  const idCache = new Map();
  let checked = 0;
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const route = pageRoute(distDir, file);
    idCache.set(file, idsIn(html));
    const hrefs = [...html.matchAll(/\bhref=(?:"([^"]*)"|'([^']*)')/gi)].map(
      (match) => match[1] ?? match[2],
    );
    for (const href of hrefs) {
      const local = localHref(href, route);
      if (!local || local.pathname === '/en/404/') continue;
      checked++;
      const key = `${route} -> ${local.pathname}#${local.hash}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const targetFile = await builtFileFor(distDir, local.pathname);
      if (!targetFile) {
        errors.push(`${route}: 站内链接 ${href} 未解析到 dist 中的文件。`);
        continue;
      }
      if (!local.hash || local.hash === 'top') continue;
      if (!idCache.has(targetFile))
        idCache.set(targetFile, idsIn(await readFile(targetFile, 'utf8')));
      if (!idCache.get(targetFile).has(local.hash)) {
        errors.push(`${route}: 锚点 ${href} 在目标页面中没有对应的 id。`);
      }
    }
  }
  for await (const file of glob(path.join(sourceRoot, '**/*en.md'))) {
    const raw = await readFile(file, 'utf8');
    for (const match of raw.matchAll(/\]\((\/[^\s)]+)\)/g)) {
      const href = match[1];
      if (/^\/(?:writing|research|projects|photos)\//.test(href) && !href.startsWith('/en/')) {
        errors.push(
          `${path.relative(process.cwd(), file)}: 英文内容链接必须指向 /en/ 变体：${href}。`,
        );
      }
    }
  }

  return { errors, checked };
}

async function main() {
  const { errors, checked } = await auditLinks();
  if (errors.length) {
    for (const error of errors) console.error(`  ✘ ${error}`);
    console.error(`\n链接审计未通过：${errors.length} 个问题（已检查 ${checked} 个站内 href）。`);
    process.exitCode = 1;
  } else {
    console.log(`链接审计通过：${checked} 个站内 href 均能解析到构建产物。`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
