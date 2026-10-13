/** Stable content metadata shared by recommendations and retrieval adapters. */
export function getContentFeatures(entry: {
  data: { tags?: string[]; column?: { slug: string; order?: number } };
}) {
  return {
    tags: entry.data.tags ?? [],
    columnSlug: entry.data.column?.slug,
  };
}
