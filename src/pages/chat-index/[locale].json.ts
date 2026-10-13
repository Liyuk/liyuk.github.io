import { getAllPublished } from '../../lib/content-query.ts';
import { contentUrl } from '../../lib/content-paths.ts';
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
type SearchMetadata = { tags: string[]; column?: { slug: string } };

export function getStaticPaths() {
  return ['zh-CN', 'en'].map((locale) => ({
    params: { locale },
    props: { locale: locale as Locale },
  }));
}

function searchKeywords(data: SearchMetadata, locale: Locale) {
  const localeIndex = locale === 'en' ? 1 : 0;
  return [
    ...data.tags.flatMap((tag) => {
      const label = tagTaxonomy[tag]?.[localeIndex];
      const aliases = tagSearchAliases[tag]?.[localeIndex] ?? [];
      return [...(label ? [label] : []), ...aliases];
    }),
    ...(data.column
      ? [
          columnTaxonomy[data.column.slug]?.label[locale],
          columnTaxonomy[data.column.slug]?.description[locale],
        ].filter((value): value is string => Boolean(value))
      : []),
  ];
}

export async function GET({ props }: { props: { locale: Locale } }) {
  const { locale } = props;
  const collections = await getAllPublished(locale);
  const datedEntries: DatedEntry[] = [
    ...collections.writing.map((entry) => ({ ...entry, collection: 'writing' as const })),
    ...collections.consulting.map((entry) => ({ ...entry, collection: 'consulting' as const })),
    ...collections.research.map((entry) => ({ ...entry, collection: 'research' as const })),
    ...collections.projects.map((entry) => ({ ...entry, collection: 'project' as const })),
  ];
  const documents = datedEntries.map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    keywords: searchKeywords(entry.data, locale),
    collection: entry.collection,
    body: entry.body,
    url: contentUrl(entry.collection, entry.id, locale),
    locale,
  }));

  return Response.json(createChatSearchIndex(documents, { maxExcerptsPerDocument: 3 }), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
