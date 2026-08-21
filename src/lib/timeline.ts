// Timeline helpers: all public ordering/grouping is keyed on publishedAt
// (the date the piece first appeared on the site). createdAt is archived
// metadata for internal use only. updatedAt, when present, overrides
// publishedAt for "last updated" sorting.
import type { DatedEntry } from './types.ts';

export function publishedDate(entry: DatedEntry): Date {
  return entry.data.publishedAt ?? entry.data.createdAt;
}

export function lastUpdatedDate(entry: DatedEntry): Date {
  return entry.data.updatedAt ?? publishedDate(entry);
}

export function sortByCreatedAt<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => publishedDate(b).valueOf() - publishedDate(a).valueOf(),
  );
}

export function getChronologicalNeighbors<T extends DatedEntry & { id: string }>(
  entries: T[],
  currentEntry: T,
): { previous?: T; next?: T } {
  const chronological = sortByCreatedAt(entries);
  const index = chronological.findIndex((entry) => entry.id === currentEntry.id);
  return {
    previous: index > 0 ? chronological[index - 1] : undefined,
    next: index >= 0 ? chronological[index + 1] : undefined,
  };
}

export function sortByLastUpdatedAt<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => lastUpdatedDate(b).valueOf() - lastUpdatedDate(a).valueOf(),
  );
}

export interface YearGroup<T extends DatedEntry> {
  year: number;
  entries: T[];
}

export function groupByYear<T extends DatedEntry>(entries: T[]): YearGroup<T>[] {
  const groups = new Map<number, T[]>();
  for (const entry of entries) {
    const year = publishedDate(entry).getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups]
    .map(([year, groupEntries]) => ({ year, entries: sortByCreatedAt(groupEntries) }))
    .sort((a, b) => b.year - a.year);
}

export interface MonthGroup<T extends DatedEntry> {
  year: number;
  month: number;
  entries: T[];
}

export function groupByYearMonth<T extends DatedEntry>(entries: T[]): MonthGroup<T>[] {
  const groups = new Map<string, MonthGroup<T>>();
  for (const entry of entries) {
    const date = publishedDate(entry);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    groups.set(key, { year, month, entries: [...(groups.get(key)?.entries ?? []), entry] });
  }
  return [...groups.values()]
    .map((group) => ({ ...group, entries: sortByCreatedAt(group.entries) }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
}
