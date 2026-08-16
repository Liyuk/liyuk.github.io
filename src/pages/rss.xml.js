import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../data/site.mjs';
import { publishedIn } from '../lib/content-model.ts';
import { i18n } from '../i18n/index.mjs';
import { writingUrl } from '../lib/content-paths.ts';

export async function GET(context) {
  const posts = await getCollection('writing', publishedIn(site.locale));
  const copy = i18n(site.locale).page.rss;
  return rss({
    title: copy.title,
    description: copy.description,
    site: context.site,
    items: posts.map((post) => ({ title: post.data.title, description: post.data.description, pubDate: post.data.publishedAt, link: writingUrl(post.id, post.data.locale) })),
  });
}
