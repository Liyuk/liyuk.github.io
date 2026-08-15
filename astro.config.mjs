import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://liyuk.github.io',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.endsWith('/search/') && !page.endsWith('/en/search/') })],
});
