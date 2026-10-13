import { getAllPublished } from '../../lib/content-query.ts';
import { contentUrl, galleryUrl } from '../../lib/content-paths.ts';
import { createChatSearchIndex } from '../../lib/site-chat.mjs';
import {
  columns as columnTaxonomy,
  tagSearchAliases,
  tags as tagTaxonomy,
} from '../../lib/taxonomy.ts';
import type { CollectionEntry } from 'astro:content';

export const prerender = true;

type Locale = 'zh-CN' | 'en';

type DatedEntry =
  | (CollectionEntry<'writing'> & { collection: 'writing' })
  | (CollectionEntry<'consulting'> & { collection: 'consulting' })
  | (CollectionEntry<'research'> & { collection: 'research' })
  | (CollectionEntry<'project'> & { collection: 'project' });

type GalleryEntry = CollectionEntry<'gallery'>;

export function getStaticPaths() {
  return ['zh-CN', 'en'].map((locale) => ({
    params: { locale },
    props: { locale: locale as Locale },
  }));
}

export async function GET({ props }: { props: { locale: Locale } }) {
  const { locale } = props;
  const documents = [];
  const collections = await getAllPublished(locale);
  const searchKeywords = (data: {
    tags: string[];
    column?: { slug: string };
  }) => [
    ...data.tags.flatMap((tag) => {
      const label = tagTaxonomy[tag];
      const aliases = tagSearchAliases[tag]?.[locale === 'en' ? 1 : 0] ?? [];
      return [...(label ? [label[locale === 'en' ? 1 : 0]] : []), ...aliases];
    }),
    ...(data.column
      ? [
          columnTaxonomy[data.column.slug]?.label[locale],
          columnTaxonomy[data.column.slug]?.description[locale],
        ].filter((value): value is string => Boolean(value))
      : []),
  ];
  const datedEntries: DatedEntry[] = [
    ...collections.writing.map((entry) => ({ ...entry, collection: 'writing' as const })),
    ...collections.consulting.map((entry) => ({ ...entry, collection: 'consulting' as const })),
    ...collections.research.map((entry) => ({ ...entry, collection: 'research' as const })),
    ...collections.projects.map((entry) => ({ ...entry, collection: 'project' as const })),
  ];

  for (const entry of datedEntries) {
    documents.push({
      title: entry.data.title,
      description: entry.data.description,
      keywords: searchKeywords(entry.data),
      body: entry.body,
      url: contentUrl(entry.collection, entry.id, locale),
      locale,
    });
  }

  for (const entry of collections.galleries as GalleryEntry[]) {
    documents.push({
      title: entry.data.title,
      description: entry.data.description,
      keywords: searchKeywords(entry.data),
      body: entry.body,
      url: galleryUrl(entry.data.slug, locale),
      locale,
    });
  }

  return Response.json(createChatSearchIndex(documents), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
