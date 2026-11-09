// Render a 1200x630 social card for every built page whose og:image points at
// /og/… (BaseLayout assigns one to indexable articles without their own image;
// see ogCardUrl in src/lib/seo.ts). Card text comes from the page's own
// metadata — the JSON-LD content node and article:section — so the card can
// never disagree with what the page declares.
//
// Runs inside `npm run build`, after `astro build`. Rendered cards are cached
// under node_modules/.cache/og-cards keyed by their inputs, so unchanged pages
// are copied rather than re-rendered.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.mjs';

const SITE_ORIGIN = 'https://liyuk.com';
const WIDTH = 1200;
const HEIGHT = 630;
// Bump when the card template changes so cached renders are invalidated.
const TEMPLATE_VERSION = 1;
const CONTENT_TYPES = new Set([
  'Article',
  'ScholarlyArticle',
  'SoftwareSourceCode',
  'CreativeWork',
  'ImageGallery',
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

function decodeEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function metaProperty(html, property) {
  const tag = html.match(new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]*)"`, 'i'));
  return tag ? decodeEntities(tag[1]) : '';
}

function contentNode(html) {
  for (const match of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(match[1]);
      const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      const node = nodes.find((candidate) => CONTENT_TYPES.has(candidate['@type']));
      if (node) return node;
    } catch {
      // Malformed JSON-LD is audit-seo's concern; fall through to the next block.
    }
  }
  return undefined;
}

/** Extract card inputs from one built page, or undefined if it needs no card. */
export function cardSpec(html) {
  const ogImage = metaProperty(html, 'og:image');
  if (!ogImage.startsWith(`${SITE_ORIGIN}/og/`)) return undefined;
  const node = contentNode(html);
  const locale = html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1] ?? 'zh-CN';
  const title = node?.headline ?? node?.name ?? metaProperty(html, 'og:title');
  return {
    output: new URL(ogImage).pathname,
    locale,
    title,
    section: metaProperty(html, 'article:section'),
    date: (node?.datePublished ?? node?.dateCreated ?? '').slice(0, 10),
  };
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function visualWidth(value) {
  let width = 0;
  for (const char of value) width += /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u.test(char) ? 2 : 1;
  return width;
}

/** Card HTML for one spec. Palette mirrors global.css / og-default.png. */
export function cardHtml({ locale, title, section, date }) {
  const english = locale === 'en';
  const width = visualWidth(title);
  const titleSize = width <= 36 ? 72 : width <= 64 ? 60 : width <= 100 ? 50 : 42;
  const brand = english ? site.brandEn : site.brand;
  return `<!doctype html><html lang="${escapeHtml(locale)}"><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px}
body{background:#f7f4ee;color:#232522;font-family:Inter,"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","WenQuanYi Zen Hei","Microsoft YaHei",sans-serif;display:flex;flex-direction:column;padding:72px 88px 64px 96px;position:relative}
body::before{content:"";position:absolute;left:0;top:0;bottom:0;width:16px;background:#35685d}
.eyebrow{display:flex;gap:18px;align-items:center;color:#35685d;font-size:26px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.eyebrow span+span::before{content:"·";margin-right:18px;color:#696a65}
h1{margin-top:40px;font-family:"Songti SC","Noto Serif CJK SC","Source Han Serif SC",Georgia,"WenQuanYi Zen Hei",serif;font-size:${titleSize}px;line-height:1.22;font-weight:700;letter-spacing:${english ? '-.01em' : '.01em'};display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;text-wrap:balance}
footer{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #d8d3c8;padding-top:28px;color:#696a65;font-size:26px}
footer strong{color:#232522;font-weight:600}
</style></head><body>
<div class="eyebrow">${section ? `<span>${escapeHtml(section)}</span>` : ''}${date ? `<span>${escapeHtml(date)}</span>` : ''}</div>
<h1>${escapeHtml(title)}</h1>
<footer><div><strong>${escapeHtml(site.name)}</strong> · ${escapeHtml(brand)}</div><div>liyuk.com</div></footer>
</body></html>`;
}

function cacheKey(spec) {
  return createHash('sha256')
    .update(JSON.stringify({ v: TEMPLATE_VERSION, spec: { ...spec, output: undefined } }))
    .digest('hex')
    .slice(0, 24);
}

async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

export async function generateOgCards({
  distDir = path.join(process.cwd(), 'dist'),
  cacheDir = path.join(process.cwd(), 'node_modules', '.cache', 'og-cards'),
} = {}) {
  const htmlFiles = (await walk(distDir)).filter((file) => file.endsWith('.html'));
  const specs = new Map();
  for (const file of htmlFiles) {
    const spec = cardSpec(await readFile(file, 'utf8'));
    if (spec) specs.set(spec.output, spec);
  }

  await mkdir(cacheDir, { recursive: true });
  const pending = [];
  let cached = 0;
  for (const spec of specs.values()) {
    const cacheFile = path.join(cacheDir, `${cacheKey(spec)}.png`);
    const target = path.join(distDir, spec.output);
    await mkdir(path.dirname(target), { recursive: true });
    if (await exists(cacheFile)) {
      await copyFile(cacheFile, target);
      cached++;
    } else {
      pending.push({ spec, cacheFile, target });
    }
  }

  if (pending.length > 0) {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
      for (const { spec, cacheFile, target } of pending) {
        await page.setContent(cardHtml(spec), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: cacheFile, type: 'png' });
        await copyFile(cacheFile, target);
      }
    } finally {
      await browser.close();
    }
  }

  return { total: specs.size, rendered: pending.length, cached };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generateOgCards();
  console.log(
    `OG 分享卡：${result.total} 张（新渲染 ${result.rendered}，缓存 ${result.cached}）。`,
  );
}
