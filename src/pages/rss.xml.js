import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../data/site.mjs';
import { publishedFilter } from '../lib/content-model.mjs';
import { getPageCopy } from '../i18n/page-copy.mjs';
import { writingUrl } from '../lib/content-paths.mjs';

export async function GET(context) {
  const posts = await getCollection('writing', publishedFilter);
  const copy = getPageCopy(site.locale).rss;
  return rss({
    title: copy.title,
    description: copy.description,
    site: context.site,
    items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.publishedAt, link: writingUrl(post.id, post.data.locale) })),
  });
}
