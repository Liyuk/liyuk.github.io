// Shared content-loading helpers. These live in their own module (rather than
// content-model.ts) because they import `astro:content`, which is only
// resolvable at build time — keeping the pure model predicates importable by
// the Node test suite.
import { getCollection } from 'astro:content';
import { publishedIn } from './content-model.ts';

// Load every published entry across all four collections in parallel, for one
// locale. Shared by the tag index, tag detail, and cross-collection queries.
export async function getAllPublished(locale = 'zh-CN') {
  const [writing, research, projects, galleries] = await Promise.all([
    getCollection('writing', publishedIn(locale)),
    getCollection('research', publishedIn(locale)),
    getCollection('project', publishedIn(locale)),
    getCollection('gallery', publishedIn(locale)),
  ]);
  return { writing, research, projects, galleries };
}

// Columns can mix writing and gallery entries (see taxonomy.ts). Projects and
// research never carry a `column`, so they are deliberately excluded here.
export async function getColumnCollections(locale = 'zh-CN') {
  const [writing, galleries] = await Promise.all([
    getCollection('writing', publishedIn(locale)),
    getCollection('gallery', publishedIn(locale)),
  ]);
  return { writing, galleries };
}

// Group entries of one collection by their locale-free slug, keeping every
// locale variant. A detail page's getStaticPaths cannot see Astro.currentLocale
// (verified empirically), so it emits one path per slug and passes all variants
// through props; the page then picks the variant for the current route.
export function groupByLocaleVariant<T extends { data: { locale: string } }>(
  entries: T[],
  slugOf: (entry: T) => string,
): { slug: string; variants: Record<string, T> }[] {
  const bySlug = new Map<string, Record<string, T>>();
  for (const entry of entries) {
    const slug = slugOf(entry);
    const variants = bySlug.get(slug) ?? {};
    variants[entry.data.locale] = entry;
    bySlug.set(slug, variants);
  }
  return [...bySlug.entries()].map(([slug, variants]) => ({ slug, variants }));
}

// Pick the requested language variant. Only research detail pages may opt into
// the documented Chinese fallback while an English translation is pending;
// callers must not silently publish Chinese under an English writing/project/gallery URL.
export function pickLocaleVariant<T>(
  variants: Record<string, T>,
  locale: string,
  allowChineseFallback = false,
): T | undefined {
  return variants[locale] ?? (allowChineseFallback ? variants['zh-CN'] : undefined);
}
