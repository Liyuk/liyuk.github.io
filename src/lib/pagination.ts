// Manual list pagination. Astro's built-in paginate() requires a [page] /
// [...page] route segment, but writing/research/projects already occupy those
// positions with [...slug], [year], and [year]/[month]. So we slice explicitly
// and hand-roll the prev/next URLs under a dedicated `page/` subpath
// (e.g. /writing/page/2/), which cannot collide with the archive routes.
//
// Page 1 is always the collection's index (/writing/), so the "first page"
// URL has no `/page/1/` suffix.

export const PAGE_SIZE = 20;

export interface PageSlice<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  prevUrl?: string;
  nextUrl?: string;
}

// `baseUrl` is locale-aware and trailing-slashed, e.g. '/writing/' or '/en/writing/'.
export function paginateList<T>(
  items: T[],
  page: number,
  pageSize: number,
  baseUrl: string,
): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageUrl = (p: number) => (p === 1 ? baseUrl : `${baseUrl}page/${p}/`);
  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    prevUrl: currentPage > 1 ? pageUrl(currentPage - 1) : undefined,
    nextUrl: currentPage < totalPages ? pageUrl(currentPage + 1) : undefined,
  };
}
