// Locale-aware URL helpers for the site-level Chinese/English switch.
// English UI lives under `/en/...`; Chinese content stays at root paths.
// The article bodies are Chinese regardless of locale — only the UI shell localizes.

export const locales = ['zh-CN', 'en'];

export function localeFromPath(pathname) {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh-CN';
}

// Prefix `path` with `/en` when locale is English, strip it when Chinese.
// Handles the root path specially so `/` becomes `/en/` (never `/en//`).
export function localizePath(path, locale) {
  // Normalize to the root path form first (strip any existing /en prefix).
  const root = path.replace(/^\/en(?=\/|$)/, '');
  const normalized = root.replace(/^\/+|\/+$/g, '');
  const isEn = locale === 'en';
  if (!normalized) return isEn ? '/en/' : '/';
  return isEn ? `/en/${normalized}/` : `/${normalized}/`;
}

// Return the same page in the other language, for the language switcher.
export function toggleLocalePath(pathname) {
  return localizePath(pathname, localeFromPath(pathname) === 'en' ? 'zh-CN' : 'en');
}
