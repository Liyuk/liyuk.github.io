import { getAllPublished } from '../lib/content-query.ts';
import { contentUrl } from '../lib/content-paths.ts';
import { createChatIndex } from '../lib/site-chat.mjs';
import type { CollectionEntry } from 'astro:content';

export const prerender = true;

type ChatDocument = {
  title: string;
  description: string;
  body?: string;
  collection: 'writing' | 'research' | 'consulting' | 'project';
  url: string;
  locale: string;
};

type DatedEntry =
  | (CollectionEntry<'writing'> & { collection: 'writing' })
  | (CollectionEntry<'consulting'> & { collection: 'consulting' })
  | (CollectionEntry<'research'> & { collection: 'research' })
  | (CollectionEntry<'project'> & { collection: 'project' });

export async function GET() {
  const documents: ChatDocument[] = [];

  for (const locale of ['zh-CN', 'en']) {
    const collections = await getAllPublished(locale);
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
        body: entry.body,
        collection: entry.collection,
        url: contentUrl(entry.collection, entry.id, locale),
        locale,
      });
    }
  }

  return Response.json(createChatIndex(documents), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
