import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE_ORIGIN = 'https://liyuk.com';

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|#39|lt|gt|nbsp);/giu, (entity, code) => {
    if (code[0] === '#') {
      const number = code[1]?.toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return { amp: '&', quot: '"', apos: "'", '#39': "'", lt: '<', gt: '>', nbsp: ' ' }[code.toLowerCase()] ?? entity;
  });
}

function text(value = '') {
  return decodeEntities(value.replace(/<[^>]*>/gu, ' ').replace(/\s+/gu, ' ').trim());
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'iu'));
  return match ? decodeEntities(match[2]) : undefined;
}

function metaContent(html, key, value) {
  const metas = html.match(/<meta\b[^>]*>/giu) ?? [];
  const tag = metas.find((item) => attribute(item, key)?.toLowerCase() === value.toLowerCase());
  return tag ? attribute(tag, 'content') : undefined;
}

function canonicalUrl(html) {
  const links = html.match(/<link\b[^>]*>/giu) ?? [];
  const canonical = links.find((item) => (attribute(item, 'rel') ?? '').toLowerCase().split(/\s+/u).includes('canonical'));
  const href = canonical ? attribute(canonical, 'href') : undefined;
  if (!href) return undefined;
  try {
    const parsed = new URL(href, SITE_ORIGIN);
    return parsed.origin === SITE_ORIGIN ? parsed.pathname : undefined;
  } catch {
    return undefined;
  }
}

function internalLinks(html) {
  const hrefs = [...html.matchAll(/<a\b[^>]*>/giu)]
    .map(([tag]) => attribute(tag, 'href'))
    .filter(Boolean);
  const links = new Set();
  for (const href of hrefs) {
    try {
      const url = new URL(href, SITE_ORIGIN);
      if (url.origin === SITE_ORIGIN) links.add(url.pathname);
    } catch {
      // Ignore malformed and non-URL anchor values.
    }
  }
  return [...links];
}

/** Extract indexable reader-facing text from a rendered static route. */
export function parseSeoPage(html, route) {
  if (/\bnoindex\b/iu.test(metaContent(html, 'name', 'robots') ?? '')) return null;
  const canonical = canonicalUrl(html);
  if (!canonical || canonical !== route) return null;
  const title = text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/iu)?.[1]);
  const description = metaContent(html, 'name', 'description');
  const lang = attribute(html.match(/<html\b[^>]*>/iu)?.[0] ?? '', 'lang');
  if (!title || !description || !lang) return null;
  const keywords = (metaContent(html, 'name', 'keywords') ?? '').split(',').map((item) => text(item)).filter(Boolean);
  const blocks = [...html.matchAll(/<(h1|h2|h3|p|li|dt|dd)\b[^>]*>([\s\S]*?)<\/\1>/giu)]
    .map(([, tag, value]) => {
      const content = text(value);
      if (!content) return '';
      const prefix = { h1: '# ', h2: '## ', h3: '### ' }[tag.toLowerCase()] ?? '';
      return `${prefix}${content}`;
    })
    .filter(Boolean);
  return {
    url: canonical,
    locale: lang === 'en' ? 'en' : 'zh-CN',
    title,
    description,
    keywords,
    links: internalLinks(html),
    excerpts: blocks.length ? [blocks.join('\n\n')] : [],
    isStaticPage: true,
  };
}

function routeFromFile(distDir, file) {
  const relative = path.relative(distDir, file).split(path.sep).join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative.replace(/\.html$/u, '')}/`;
}

async function htmlFiles(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...await htmlFiles(file));
    else if (item.isFile() && item.name.endsWith('.html')) files.push(file);
  }
  return files;
}

/** Read every indexable HTML route from the current production build. */
export async function staticSeoPages(distDir = 'dist') {
  const pages = [];
  for (const file of await htmlFiles(distDir)) {
    const route = routeFromFile(distDir, file);
    if (route === '/404.html') continue;
    const document = parseSeoPage(await readFile(file, 'utf8'), route);
    if (document) pages.push(document);
  }
  return pages;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const pages = await staticSeoPages(process.argv[2] ?? 'dist');
  console.log(`Read ${pages.length} indexable static pages.`);
}
