export function contentSlug(entryId) {
  const segments = entryId.split('/');
  return segments.at(-1) === 'zh' || segments.at(-1) === 'en'
    ? segments.slice(0, -1).join('/')
    : entryId;
}

export const writingSlug = contentSlug;

export function contentUrl(collection, entryId, locale = 'zh-CN') {
  const prefix = locale === 'en' ? `/en/${collection}` : `/${collection}`;
  return `${prefix}/${contentSlug(entryId)}/`;
}

export function writingUrl(entryId, locale = 'zh-CN') {
  return contentUrl('writing', entryId, locale);
}

export function tagUrl(slug, locale = 'zh-CN') {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/tags/${slug}/`;
}

export function columnUrl(slug, locale = 'zh-CN') {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/columns/${slug}/`;
}

export function galleryUrl(slug, locale = 'zh-CN') {
  const prefix = locale === 'en' ? '/en' : '';
  return `${prefix}/photos/${slug}/`;
}

export function searchUrl(locale = 'zh-CN') {
  return locale === 'en' ? '/en/search/' : '/search/';
}
