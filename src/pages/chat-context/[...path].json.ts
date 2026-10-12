import { getAllPublished } from '../../lib/content-query.ts';
import { contentUrl } from '../../lib/content-paths.ts';
import { cleanArticleMarkdown } from '../../lib/site-chat.mjs';
import type { CollectionEntry } from 'astro:content';

export const prerender = true;

type Locale = 'zh-CN' | 'en';
type DatedEntry =
  | (CollectionEntry<'writing'> & { collection: 'writing' })
  | (CollectionEntry<'consulting'> & { collection: 'consulting' })
  | (CollectionEntry<'research'> & { collection: 'research' })
  | (CollectionEntry<'project'> & { collection: 'project' });

export async function getStaticPaths() {
  const paths = [];
  for (const locale of ['zh-CN', 'en'] as const) {
    const collections = await getAllPublished(locale);
    const entries: DatedEntry[] = [
      ...collections.writing.map((entry) => ({ ...entry, collection: 'writing' as const })),
      ...collections.consulting.map((entry) => ({ ...entry, collection: 'consulting' as const })),
      ...collections.research.map((entry) => ({ ...entry, collection: 'research' as const })),
      ...collections.projects.map((entry) => ({ ...entry, collection: 'project' as const })),
    ];

    for (const entry of entries) {
      const url = contentUrl(entry.collection, entry.id, locale);
      paths.push({
        params: { path: url.replace(/^\/+|\/+$/gu, '') },
        props: { title: entry.data.title, url, locale, body: entry.body ?? '' },
      });
    }
  }
  return paths;
}

export function GET({ props }: { props: { title: string; url: string; locale: Locale; body: string } }) {
  return Response.json({
    title: props.title,
    url: props.url,
    locale: props.locale,
    text: cleanArticleMarkdown(props.body),
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
