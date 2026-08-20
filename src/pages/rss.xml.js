import rss from '@astrojs/rss';
import { site } from '../data/site.mjs';
import { i18n } from '../i18n/index.mjs';
import { getFeedItems } from '../lib/rss-items.ts';

export async function GET(context) {
  const copy = i18n(site.locale).page.rss;
  const items = await getFeedItems(site.locale);
  return rss({
    title: copy.title,
    description: copy.description,
    site: context.site,
    items: items.map((item) => ({
      title: item.title,
      description: item.description,
      pubDate: item.pubDate,
      link: item.link,
      categories: item.categories,
      customData: `<atom:updated>${item.lastUpdated.toISOString()}</atom:updated>`,
    })),
    customData: '<language>zh-CN</language>',
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
  });
}
