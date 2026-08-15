// Timeline helpers: all public ordering/grouping is keyed on publishedAt
// (the date the piece first appeared on the site). createdAt is archived
// metadata for internal use only. updatedAt, when present, overrides
// publishedAt for "last updated" sorting.

export function publishedDate(entry) {
  return entry.data.publishedAt ?? entry.data.createdAt;
}

export function lastUpdatedDate(entry) {
  return entry.data.updatedAt ?? publishedDate(entry);
}

export function sortByCreatedAt(entries) {
  return [...entries].sort((a, b) => publishedDate(b).valueOf() - publishedDate(a).valueOf());
}

export function sortByLastUpdatedAt(entries) {
  return [...entries].sort((a, b) => lastUpdatedDate(b).valueOf() - lastUpdatedDate(a).valueOf());
}

export function shouldNotify(entry, event) {
  return entry.notification === event;
}

export function groupByYear(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const year = publishedDate(entry).getFullYear();
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups]
    .map(([year, groupEntries]) => ({ year, entries: sortByCreatedAt(groupEntries) }))
    .sort((a, b) => b.year - a.year);
}

export function groupByYearMonth(entries) {
  const groups = new Map();
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
