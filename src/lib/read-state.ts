// Reading state for the thread-and-node motif: which articles this browser has
// read. Stored only in localStorage (no network, no cookies). Server HTML always
// renders every node unread; the client fills nodes after load, so this never
// changes indexed markup. Every storage access fails silently.

export const READ_STORAGE_KEY = 'liyuk-read';
const MAX_ENTRIES = 1000;

// One key per article regardless of locale: reading the Chinese source or its
// English translation counts as reading the piece. Query and hash are dropped,
// so `?context=column` links resolve to the same key.
export function readKey(path: string): string {
  let pathname = path;
  try {
    pathname = new URL(path, 'https://liyuk.invalid').pathname;
  } catch {
    // keep the raw value
  }
  pathname = pathname.replace(/index\.html$/, '').replace(/^\/en(?=\/|$)/, '') || '/';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function parseReadList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function addReadKey(list: string[], key: string): string[] {
  if (list.includes(key)) return list;
  return [...list, key].slice(-MAX_ENTRIES);
}

export function loadReadSet(): Set<string> {
  try {
    return new Set(parseReadList(window.localStorage.getItem(READ_STORAGE_KEY)));
  } catch {
    return new Set();
  }
}

export function markRead(path: string): void {
  try {
    const list = parseReadList(window.localStorage.getItem(READ_STORAGE_KEY));
    const next = addReadKey(list, readKey(path));
    if (next !== list) window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode, quota, disabled): reading still works
  }
}

// Fill every node that names a read article. Elements opt in with
// `data-read-path`; a container may carry `data-read-label` so a visually
// hidden "read" note is appended for screen readers where the node itself is
// the only signal.
export function paintReadNodes(root: ParentNode = document): void {
  const read = loadReadSet();
  if (read.size === 0) return;
  root.querySelectorAll<HTMLElement>('[data-read-path]').forEach((element) => {
    if (!read.has(readKey(element.dataset.readPath ?? ''))) return;
    element.classList.add('is-read');
    const label = element.closest<HTMLElement>('[data-read-label]')?.dataset.readLabel;
    const target = element.querySelector<HTMLElement>('[data-read-note]');
    if (label && target && !target.querySelector('.read-note')) {
      const note = document.createElement('span');
      note.className = 'visually-hidden read-note';
      note.textContent = label;
      target.append(note);
    }
  });
}
