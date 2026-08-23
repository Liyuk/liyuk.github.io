import type { CollectionEntry } from 'astro:content';
import { getAllPublished } from './content-query.ts';
import { contentUrl, galleryUrl } from './content-paths.ts';
import { lastUpdatedDate, publishedDate } from './timeline.ts';

type FeedEntry =
  | CollectionEntry<'writing'>
  | CollectionEntry<'consulting'>
  | CollectionEntry<'research'>
  | CollectionEntry<'project'>
  | CollectionEntry<'gallery'>;
type FeedRecord = {
  entry: FeedEntry;
  collection: 'writing' | 'consulting' | 'research' | 'project' | 'gallery';
};

export async function getFeedItems(locale: string) {
  const { writing, consulting, research, projects, galleries } = await getAllPublished(locale);
  const entries: FeedRecord[] = [
    ...writing.map((entry) => ({ entry, collection: 'writing' as const })),
    ...consulting.map((entry) => ({ entry, collection: 'consulting' as const })),
    ...research.map((entry) => ({ entry, collection: 'research' as const })),
    ...projects.map((entry) => ({ entry, collection: 'project' as const })),
    ...galleries.map((entry) => ({ entry, collection: 'gallery' as const })),
  ];
  return entries
    .sort((a, b) => lastUpdatedDate(b.entry).valueOf() - lastUpdatedDate(a.entry).valueOf())
    .map(({ entry, collection }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: publishedDate(entry),
      lastUpdated: lastUpdatedDate(entry),
      link:
        collection === 'gallery'
          ? galleryUrl((entry as CollectionEntry<'gallery'>).data.slug, locale)
          : contentUrl(collection, entry.id, locale),
      categories: [collection, ...entry.data.tags],
    }));
}
