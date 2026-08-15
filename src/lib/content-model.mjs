// Content collection model: the site's four collections, and the shared
// predicate used to select what is publicly renderable.
export const contentTypes = ['writing', 'projects', 'research', 'photos'];

// The source locale is the only one with content today; English pages reuse
// the same entries and localize only the UI shell (see lib/locale-url.mjs).
export const publishedFilter = ({ data }) => !data.draft && data.locale === 'zh-CN';
