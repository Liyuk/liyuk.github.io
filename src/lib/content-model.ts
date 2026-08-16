// Content collection model: the site's four collections, and the shared
// predicate used to select what is publicly renderable.
export interface PublishedEntry {
  data: {
    draft: boolean;
    locale: string;
  };
}

// Published (non-draft) entries regardless of locale. Used by getStaticPaths to
// enumerate every public slug so both the default (zh-CN) and /en/ routes
// generate the same path set.
export const notDraft = ({ data }: PublishedEntry): boolean => !data.draft;

// Published entries for one specific locale. Used by list, archive, tag,
// column, and RSS pages to render only the current locale's content.
export const publishedIn = (locale: string) => ({ data }: PublishedEntry): boolean =>
  !data.draft && data.locale === locale;
