import { getAllPublished } from './content-query.ts';
import { createContentDiscoveryDocument, type ContentCollection, type ContentLocale } from './content-discovery.ts';

export type { ContentLocale } from './content-discovery.ts';

/** One locale-aware, published-only corpus shared by static retrieval assets. */
export async function getPublishedContentCorpus(locale: ContentLocale) {
  const collections = await getAllPublished(locale);
  const entries = [
    ...collections.writing.map((entry) => ({ entry, collection: 'writing' as const })),
    ...collections.consulting.map((entry) => ({ entry, collection: 'consulting' as const })),
    ...collections.research.map((entry) => ({ entry, collection: 'research' as const })),
    ...collections.projects.map((entry) => ({ entry, collection: 'project' as const })),
  ] satisfies { entry: { id: string; body?: string; data: { title: string; description: string; tags?: string[]; column?: { slug: string } } }; collection: ContentCollection }[];

  return entries.map(({ entry, collection }) => createContentDiscoveryDocument(entry, collection, locale));
}
