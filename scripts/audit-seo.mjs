// Verify the built site's indexable pages expose coherent metadata, language
// alternates, article JSON-LD, and sitemap membership.
//
// Run after `npm run build`: npm run audit:seo
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ORIGIN = 'https://liyuk.com';

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

function tagAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2] ?? '';
}

function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function metaContent(html, attribute, value) {
  const tag = tags(html, 'meta').find(
    (candidate) => tagAttribute(candidate, attribute).toLowerCase() === value.toLowerCase(),
  );
  return tagAttribute(tag ?? '', 'content');
}

function linkValues(html, rel) {
  return tags(html, 'link')
    .filter((tag) => tagAttribute(tag, 'rel').toLowerCase().split(/\s+/).includes(rel))
    .map((tag) => ({ href: tagAttribute(tag, 'href'), hreflang: tagAttribute(tag, 'hreflang') }));
}

function textContent(html, tagName) {
  return (
    html
      .match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, 'i'))?.[1]
      ?.replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim() ?? ''
  );
}

function normalizePath(value) {
  const url = new URL(value, SITE_ORIGIN);
  return url.pathname.endsWith('/') || url.pathname.includes('.')
    ? url.pathname
    : `${url.pathname}/`;
}

function expectedAlternates(route) {
  const rootRoute = route.startsWith('/en/') ? route.slice(3) : route;
  return {
    'zh-CN': `${SITE_ORIGIN}${rootRoute}`,
    en: `${SITE_ORIGIN}/en${rootRoute === '/' ? '/' : rootRoute}`,
    'x-default': `${SITE_ORIGIN}${rootRoute}`,
  };
}

function isNoindex(html) {
  return /\bnoindex\b/i.test(metaContent(html, 'name', 'robots'));
}

function parseJsonLd(html) {
  return tags(html, 'script')
    .filter((tag) => tagAttribute(tag, 'type').toLowerCase() === 'application/ld+json')
    .map((tag) => {
      const body = html.slice(html.indexOf(tag) + tag.length);
      const raw = body.match(/^([\s\S]*?)<\/script>/i)?.[1]?.trim();
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function graphNodes(html) {
  return parseJsonLd(html).flatMap((data) =>
    data?.['@graph'] && Array.isArray(data['@graph']) ? data['@graph'] : [data],
  );
}

function absoluteLinks(text) {
  return [...text.matchAll(/https?:\/\/[^\s)]+/g)].map(([value]) => value.replace(/[.,;]+$/, ''));
}

async function isFile(candidate) {
  try {
    return (await stat(candidate)).isFile();
  } catch {
    return false;
  }
}

async function auditSeo({ distDir = path.join(process.cwd(), 'dist') } = {}) {
  const errors = [];
  let files;
  try {
    files = await walk(distDir);
  } catch {
    return {
      errors: [
        `找不到构建目录 ${path.relative(process.cwd(), distDir) || 'dist'}；请先运行 npm run build。`,
      ],
      checked: 0,
    };
  }

  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const indexableRoutes = new Set();
  let checked = 0;

  for (const file of htmlFiles) {
    const route = pageRoute(distDir, file);
    if (route === '/404.html') continue;
    checked++;
    const html = await readFile(file, 'utf8');
    const noindex = isNoindex(html);
    const lang = tagAttribute(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang');
    const title = textContent(html, 'title');
    const description = metaContent(html, 'name', 'description');
    const canonicalLinks = linkValues(html, 'canonical');
    const canonical = canonicalLinks[0]?.href ?? '';

    if (!lang) errors.push(`${route}: 缺少 html lang。`);
    if (!title) errors.push(`${route}: 缺少非空 title。`);
    if (!description) errors.push(`${route}: 缺少非空 meta description。`);
    if (canonicalLinks.length !== 1)
      errors.push(`${route}: canonical 应恰好出现一次，实际 ${canonicalLinks.length} 次。`);
    if (canonical) {
      try {
        if (new URL(canonical).origin !== SITE_ORIGIN)
          errors.push(`${route}: canonical 必须指向本站：${canonical}。`);
      } catch {
        errors.push(`${route}: canonical 不是有效 URL：${canonical}。`);
      }
      if (normalizePath(canonical) !== route) {
        errors.push(`${route}: canonical 应指向当前路由，实际为 ${canonical}。`);
      }
    }

    if (noindex) continue;
    indexableRoutes.add(route);

    for (const [hreflang, expected] of Object.entries(expectedAlternates(route))) {
      const matches = linkValues(html, 'alternate').filter((link) => link.hreflang === hreflang);
      if (matches.length !== 1 || matches[0].href !== expected) {
        errors.push(
          `${route}: hreflang=${hreflang} 应为 ${expected}，实际 ${matches.map((match) => match.href).join(', ') || '缺失'}。`,
        );
      }
    }

    for (const [attribute, value] of [
      ['property', 'og:title'],
      ['property', 'og:description'],
      ['property', 'og:url'],
      ['property', 'og:image'],
      ['name', 'twitter:card'],
    ]) {
      if (!metaContent(html, attribute, value)) errors.push(`${route}: 缺少 ${value}。`);
    }
    if (metaContent(html, 'property', 'og:url') !== canonical) {
      errors.push(`${route}: og:url 应与 canonical 一致。`);
    }

    const nodes = graphNodes(html);
    const website = nodes.find((data) => data['@type'] === 'WebSite');
    const person = nodes.find((data) => data['@type'] === 'Person');
    const page = nodes.find(
      (data) => data['@type'] === 'WebPage' || data['@type'] === 'CollectionPage',
    );
    if (!noindex) {
      if (!website?.['@id']) errors.push(`${route}: JSON-LD 缺少稳定 WebSite @id。`);
      if (!person?.['@id'] || !Array.isArray(person.sameAs))
        errors.push(`${route}: JSON-LD 缺少作者实体或 sameAs。`);
      if (!page?.['@id'] || page.url !== canonical)
        errors.push(`${route}: JSON-LD WebPage 与 canonical 不一致。`);
      if (page?.inLanguage !== lang)
        errors.push(`${route}: JSON-LD WebPage inLanguage 与 html lang 不一致。`);
      if (!textContent(html, 'h1')) errors.push(`${route}: 缺少可见 h1。`);
    }

    const ogType = metaContent(html, 'property', 'og:type');
    const typedContent = nodes.find((data) =>
      [
        'Article',
        'ScholarlyArticle',
        'SoftwareSourceCode',
        'CreativeWork',
        'ImageGallery',
      ].includes(data['@type']),
    );
    if (ogType === 'article') {
      const expectedType = route.includes('/research/')
        ? 'ScholarlyArticle'
        : route.includes('/projects/')
          ? ['SoftwareSourceCode', 'CreativeWork']
          : route.includes('/photos/')
            ? 'ImageGallery'
            : 'Article';
      const validType = Array.isArray(expectedType)
        ? expectedType.includes(typedContent?.['@type'])
        : typedContent?.['@type'] === expectedType;
      if (!validType)
        errors.push(
          `${route}: JSON-LD 内容类型不正确，实际为 ${typedContent?.['@type'] ?? '缺失'}。`,
        );
      if (typedContent) {
        if (!typedContent['@id']) errors.push(`${route}: 内容 JSON-LD 缺少稳定 @id。`);
        if (typedContent.url !== canonical)
          errors.push(`${route}: 内容 JSON-LD url 与 canonical 不一致。`);
        if (typedContent.inLanguage !== lang)
          errors.push(`${route}: 内容 JSON-LD inLanguage 与 html lang 不一致。`);
        if (
          !typedContent.datePublished &&
          typedContent['@type'] !== 'SoftwareSourceCode' &&
          typedContent['@type'] !== 'CreativeWork'
        ) {
          errors.push(`${route}: 内容 JSON-LD 缺少 datePublished。`);
        }
      }
    }
  }

  const sitemapFiles = files.filter(
    (file) =>
      file.endsWith('.xml') &&
      path.basename(file).startsWith('sitemap-') &&
      path.basename(file) !== 'sitemap-index.xml',
  );
  const sitemapRoutes = new Set();
  if (sitemapFiles.length === 0) {
    errors.push('找不到 sitemap-*.xml；请确认 Astro sitemap 已生成。');
  } else {
    for (const file of sitemapFiles) {
      const xml = await readFile(file, 'utf8');
      for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
        const url = match[1].trim();
        try {
          const parsed = new URL(url);
          if (parsed.origin !== SITE_ORIGIN) {
            errors.push(`sitemap 包含非本站 URL：${url}。`);
            continue;
          }
          const route = normalizePath(parsed.pathname);
          sitemapRoutes.add(route);
          if (!indexableRoutes.has(route))
            errors.push(`sitemap 收录了非 indexable 页面：${route}。`);
          const target = path.resolve(distDir, `.${route}`, 'index.html');
          if (!(await isFile(target))) errors.push(`sitemap URL 未对应构建文件：${url}。`);
        } catch {
          errors.push(`sitemap 包含无效 URL：${url}。`);
        }
      }
    }
  }

  for (const route of indexableRoutes) {
    if (!sitemapRoutes.has(route)) errors.push(`indexable 页面未出现在 sitemap：${route}。`);
  }

  const robotsPath = path.join(distDir, 'robots.txt');
  if (!(await isFile(robotsPath))) {
    errors.push('找不到 robots.txt。');
  } else {
    const robots = await readFile(robotsPath, 'utf8');
    const sitemapReference = robots.match(/^Sitemap:\s*(\S+)\s*$/im)?.[1] ?? '';
    if (sitemapReference !== `${SITE_ORIGIN}/sitemap-index.xml`) {
      errors.push(
        `robots.txt 的 Sitemap 应为 ${SITE_ORIGIN}/sitemap-index.xml，实际为 ${sitemapReference || '缺失'}。`,
      );
    }
  }

  const llmsPath = path.join(distDir, 'llms.txt');
  if (!(await isFile(llmsPath))) {
    errors.push('找不到 llms.txt。');
  } else {
    const llms = await readFile(llmsPath, 'utf8');
    if (llms.trim().length < 80) errors.push('llms.txt 内容过短，缺少可用的站点/内容索引。');
    for (const url of absoluteLinks(llms)) {
      try {
        const parsed = new URL(url);
        if (parsed.origin !== SITE_ORIGIN) {
          errors.push(`llms.txt 包含非本站 URL：${url}。`);
          continue;
        }
        const resource =
          parsed.pathname === '/llms.txt' ||
          parsed.pathname === '/robots.txt' ||
          parsed.pathname === '/sitemap-index.xml' ||
          parsed.pathname.endsWith('.xml');
        const route = normalizePath(parsed.pathname);
        if (!resource && !indexableRoutes.has(route)) {
          errors.push(`llms.txt 链接未指向 indexable 页面：${url}。`);
        }
      } catch {
        errors.push(`llms.txt 包含无效 URL：${url}。`);
      }
    }
  }

  return { errors, checked, indexable: indexableRoutes.size, sitemap: sitemapRoutes.size };
}

async function main() {
  const result = await auditSeo();
  if (result.errors.length) {
    for (const error of result.errors) console.error(`  ✘ ${error}`);
    console.error(
      `\nSEO 审计未通过：${result.errors.length} 个问题（已检查 ${result.checked} 个页面）。`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `SEO 审计通过：${result.indexable} 个 indexable 页面、${result.sitemap} 个 sitemap URL 均符合元数据约定。`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

export { auditSeo, expectedAlternates, normalizePath };
