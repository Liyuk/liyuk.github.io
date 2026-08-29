// Content collection model: the site's four collections, and the shared
// predicate used to select what is publicly renderable.
export interface PublishedEntry {
  id?: string;
  data: {
    draft: boolean;
    locale: string;
    translationStatus?: 'original' | 'draft' | 'reviewed';
  };
}

export type TranslationStatus = 'original' | 'draft' | 'reviewed';

// `draft` is the publication switch. Translation status describes whether an
// English sibling has received editorial review; it must never be used as a
// second, implicit publication predicate.
export const isPublished = ({ data }: PublishedEntry): boolean => !data.draft;

export const translationStatusForLocale = (locale: string): TranslationStatus =>
  locale === 'zh-CN' ? 'original' : 'reviewed';

export const hasValidPublishedTranslationStatus = ({ data }: PublishedEntry): boolean =>
  !isPublished({ data }) || data.translationStatus === translationStatusForLocale(data.locale);

const isTemplateEntry = (entry: PublishedEntry): boolean => entry.id?.split('/').at(-1) === '_template';

// Published (non-draft) entries regardless of locale. Used by getStaticPaths to
// enumerate every public slug so both the default (zh-CN) and /en/ routes
// generate the same path set.
//
// Templates are excluded here, not only in `isPreviewable`: a `_template.md`
// stays out of production because it is a template, not because someone
// remembered to leave `draft: true` in it.
export const notDraft = (entry: PublishedEntry): boolean =>
  !isTemplateEntry(entry) && isPublished(entry);

export const isPreviewable = (entry: PublishedEntry, isDev: boolean): boolean =>
  !isTemplateEntry(entry) && (isDev || !entry.data.draft);

export const previewable = (entry: PublishedEntry): boolean =>
  isPreviewable(entry, Boolean(import.meta.env?.DEV));

// Published entries for one specific locale. Used by list, archive, tag,
// column, and RSS pages to render only the current locale's content.
export const publishedIn = (locale: string) => (entry: PublishedEntry): boolean =>
  !isTemplateEntry(entry) && !entry.data.draft && entry.data.locale === locale;
