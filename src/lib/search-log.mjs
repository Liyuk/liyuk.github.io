// Anonymous site-search telemetry: what readers look for and whether the site
// had an answer. Stores only a normalized query, locale, result count, and the
// clicked rank. No IP, user agent, cookie, or session id is read or written.
const MAX_QUERY_CHARS = 64;
const MIN_QUERY_CHARS = 2;

export function sanitizeSearchQuery(raw) {
  if (typeof raw !== 'string') return undefined;
  const query = raw.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
  if (Array.from(query).length < MIN_QUERY_CHARS) return undefined;
  const clipped = Array.from(query).slice(0, MAX_QUERY_CHARS).join('');
  // Queries can carry personal data; refuse anything that looks like it.
  if (/@/u.test(clipped) || /\d{6,}/u.test(clipped) || /https?:\/\//u.test(clipped)) return undefined;
  return clipped;
}

export function parseSearchLog(body) {
  if (!body || typeof body !== 'object') return undefined;
  const query = sanitizeSearchQuery(body.q);
  if (!query) return undefined;
  const locale = body.locale === 'en' ? 'en' : 'zh-CN';
  const kind = body.kind === 'click' ? 'click' : 'search';
  const results = Number.isInteger(body.results) && body.results >= 0 ? Math.min(body.results, 1000) : 0;
  const rank = Number.isInteger(body.rank) && body.rank >= 1 ? Math.min(body.rank, 100) : 0;
  return { query, locale, kind, results, rank };
}

export async function handleSearchLog(request, env) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });
  const text = await request.text();
  if (text.length > 1024) return new Response(null, { status: 413 });
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const entry = parseSearchLog(body);
  if (!entry) return new Response(null, { status: 204 });
  // Analytics Engine keeps data for 90 days. Without the binding this is a no-op.
  env.SEARCH_LOG?.writeDataPoint({
    indexes: [new Date().toISOString().slice(0, 10)],
    blobs: [entry.query, entry.locale, entry.kind],
    doubles: [entry.results, entry.rank],
  });
  return new Response(null, { status: 204 });
}
