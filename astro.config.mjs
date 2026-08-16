import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeScrollWrap } from './src/lib/rehype-scroll-wrap.mjs';

export default defineConfig({
  site: 'https://liyuk.github.io',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  markdown: {
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
  },
  integrations: [sitemap({ filter: (page) => !page.endsWith('/search/') && !page.endsWith('/en/search/') })],
});
