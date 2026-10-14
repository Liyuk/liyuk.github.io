import { contentUrl } from './content-paths.ts';
import { columns, tagSearchAliases, tags } from './taxonomy.ts';
import { getContentFeatures } from './content-features.ts';

export type ContentLocale = 'zh-CN' | 'en';
export type ContentCollection = 'writing' | 'consulting' | 'research' | 'project';

type DiscoveryEntry = {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    tags?: string[];
    column?: { slug: string };
  };
};

/** Maps a published Astro entry into the shared content-discovery contract. */
export function createContentDiscoveryDocument(
  entry: DiscoveryEntry,
  collection: ContentCollection,
  locale: ContentLocale,
) {
  const features = getContentFeatures(entry);
  const localeIndex = locale === 'en' ? 1 : 0;
  const tagLabels = features.tags
    .map((tag) => tags[tag]?.[localeIndex])
    .filter((label): label is string => Boolean(label));
  const keywords = [
    ...features.tags.flatMap((tag) => {
      const aliases = tagSearchAliases[tag]?.[localeIndex] ?? [];
      return [...(tags[tag] ? [tags[tag][localeIndex]] : []), ...aliases];
    }),
    ...(features.columnSlug
      ? [columns[features.columnSlug]?.label[locale], columns[features.columnSlug]?.description[locale]]
          .filter((value): value is string => Boolean(value))
      : []),
  ];

  return {
    collection,
    title: entry.data.title,
    description: entry.data.description,
    tagLabels,
    keywords,
    body: entry.body ?? '',
    url: contentUrl(collection, entry.id, locale),
    locale,
    features,
  };
}
