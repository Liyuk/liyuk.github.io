export function contentSlug(entryId: string): string {
  const segments = entryId.split('/');
  return segments.at(-1) === 'zh' || segments.at(-1) === 'en'
    ? segments.slice(0, -1).join('/')
    : entryId;
}

export const writingSlug = contentSlug;

// 集合名 → 路由目录前缀。绝大多数同名；project 是例外：集合名单数，但路由
// 目录是复数 /projects/。此处集中映射，避免调用方各自拼错成 /project/ 死链。
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
