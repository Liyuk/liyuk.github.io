import { defineConfig } from 'astro/config';
import { glob, readFile } from 'node:fs/promises';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeScrollWrap } from './src/lib/rehype-scroll-wrap.mjs';

const routeDateIndex = new Map();
for await (const file of glob('src/content/**/*.{md,mdx}')) {
  const raw = await readFile(file, 'utf8');
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)?.[1];
  if (!frontmatter) continue;
  const value = (key) => frontmatter.match(new RegExp(`^${key}:\\s*([^\\n]+)$`, 'm'))?.[1]?.trim();
  if (value('draft') === 'true') continue;
  const locale = (value('locale') ?? 'zh-CN').replace(/^['"]|['"]$/g, '');
  const date = value('updatedAt') ?? value('publishedAt') ?? value('createdAt');
  if (!date) continue;
  const normalized = file.replaceAll('\\\\', '/');
  const match = normalized.match(/^src\/content\/(writing|research|projects)\/(\d{4}\/\d{2}\/[^/]+)\/(?:zh|en)\.(?:md|mdx)$/);
  const gallery = normalized.match(/^src\/content\/galleries\/([^/]+?)(\.en)?\.(?:md|mdx)$/);
  const route = match
    ? `/${match[1] === 'projects' ? 'projects' : match[1]}/${match[2]}/`
    : gallery
      ? `/photos/${gallery[1]}/`
      : null;
  if (!route) continue;
  const localizedRoute = locale === 'en' ? `/en${route}` : route;
  routeDateIndex.set(localizedRoute, date.replace(/^['"]|['"]$/g, ''));
}


export default defineConfig({
  site: 'https://liyuk.com',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
    processor: unified({
      // Only disable quote conversion (fixes CJK quote direction); keep other
      // smartypants effects (apostrophes, dashes, ellipses) for English text.
      smartypants: { quotes: false },
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        // `neutral` (grayscale) fits the site's muted palette better than `default`
        // (blue/purple). Dark-mode recolor of the inline SVG is handled in global.css.
        [rehypeMermaid, { strategy: 'inline-svg', mermaidConfig: { theme: 'neutral' } }],
        // A malformed formula renders in red instead of failing the whole build.
        [rehypeKatex, { throwOnError: false, strict: 'ignore' }],
        // Wrap wide tables/mermaid SVGs in a scroll container for narrow screens.
        rehypeScrollWrap,
      ],
    }),
    // Skip Shiki for `mermaid` blocks so rehype-mermaid can render them to SVG.
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: 'light',
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.endsWith('/search/') &&
        !page.endsWith('/en/search/') &&
        !page.endsWith('/favorites/') &&
        !page.endsWith('/en/favorites/'),
      serialize(item) {
        const route = new URL(item.url).pathname;
        const lastmod = routeDateIndex.get(route);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
});
