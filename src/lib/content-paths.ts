export function contentSlug(entryId: string): string {
  const segments = entryId.split('/');
  return segments.at(-1) === 'zh' || segments.at(-1) === 'en'
    ? segments.slice(0, -1).join('/')
    : entryId;
}

export const writingSlug = contentSlug;

const ROUTE_FOR_COLLECTION: Record<string, string> = {
  project: 'projects',
};

export function contentUrl(collection: string, entryId: string, locale = 'zh-CN'): string {
  const route = ROUTE_FOR_COLLECTION[collection] ?? collection;
  const prefix = locale === 'en' ? `/en/${route}` : `/${route}`;
  return `${prefix}/${contentSlug(entryId)}/`;
}

export function writingUrl(entryId: string, locale = 'zh-CN'): string {
  return contentUrl('writing', entryId, locale);
}

export function projectUrl(entryId: string, locale = 'zh-CN'): string {
  return contentUrl('project', entryId, locale);
}

export function researchUrl(entryId: string, locale = 'zh-CN'): string {
  return contentUrl('research', entryId, locale);
}

// One URL helper for the writing/gallery collections that can share a column.
// Columns mix essays and galleries, so callers must not assume which
// collection a column member belongs to. Gallery entries carry a `slug`; writing
// entries are addressed by their dated id.
export type ColumnMember =
  | { collection: 'gallery'; id: string; data: { slug: string } }
  | { collection: 'writing'; id: string; data: Record<string, unknown> };

export function entryUrl(entry: ColumnMember, locale = 'zh-CN'): string {
  return entry.collection === 'gallery'
    ? galleryUrl(entry.data.slug, locale)
    : writingUrl(entry.id, locale);
}

export function tagUrl(slug: string, locale = 'zh-CN'): string {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/tags/${slug}/`;
}

export function columnUrl(slug: string, locale = 'zh-CN'): string {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/columns/${slug}/`;
}

export function galleryUrl(slug: string, locale = 'zh-CN'): string {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/photos/${slug}/`;
}

export function searchUrl(locale = 'zh-CN'): string {
  return locale === 'en' ? '/en/search/' : '/search/';
}
