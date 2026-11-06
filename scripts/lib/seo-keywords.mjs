// Pure helpers for keyword tracking: query normalization, GSC row parsing,
// per-keyword aggregation, state flags, and keyword-to-article scoring.
// Zero dependencies, no file or network access, so everything is unit-testable.

// A small traditional-to-simplified table for characters that show up in
// technical queries. It is intentionally not a full OpenCC replacement.
const T2S = Object.fromEntries(
  '麼么,這这,個个,點点,據据,網网,關关,點点,際际,開开,發发,說说,問问,題题,業业,許许,務务,響响,點点,體体,優优,術术,維维,構构,經经,產产,導导,據据,應应,資资,庫库,時时,實实,現现,錄录,環环,認认,證证,評评,論论,語语,請请,讀读,寫写,護护,選选,過过,運运,進进,達达,連连,頁页,類类,檢检,測测,試试,見见,學学,對对,會会,長长,間间,頭头,從从,來来,後后,與与,數数,將将,為为,無无,場场,動动,務务,針针,點点'
    .split(',')
    .map((pair) => [pair[0], pair[1]]),
);

const INTENT_PATTERNS = [
  ['definition', /(是什么|是什麼|什么是|什麼是|定义|概念|\bwhat is\b|\bwhat are\b|\bdefinition\b|\bmeaning\b)/giu],
  ['howto', /(怎么|怎樣|如何|教程|步骤|\bhow to\b|\bhow do\b|\bguide\b|\btutorial\b)/giu],
  ['troubleshoot', /(报错|失败|错误|不生效|无法|\berror\b|\bfix\b|\bfailed\b|\bnot working\b|\b429\b)/giu],
  ['compare', /(区别|对比|比较|哪个好|\bvs\b|\bversus\b|\bcompare\b|\bdifference\b)/giu],
  ['data', /(数据|指数|统计|\bdataset\b|\bdata\b|\bstatistics\b)/giu],
  ['service', /(咨询|辅导|服务|\bconsulting\b|\bcoaching\b|\bhire\b)/giu],
];

/** Fold case, width, and common traditional characters; collapse whitespace. */
export function normalizeQuery(query) {
  return Array.from(String(query).normalize('NFKC').toLowerCase())
    .map((char) => T2S[char] ?? char)
    .join('')
    .replace(/\s+/gu, ' ')
    .trim();
}

/** Split a normalized query into its topic core and a coarse search intent. */
export function queryCore(query) {
  const normalized = normalizeQuery(query);
  let core = normalized;
  let intent = 'navigational';
  for (const [name, pattern] of INTENT_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(core)) {
      if (intent === 'navigational') intent = name;
      pattern.lastIndex = 0;
      core = core.replace(pattern, ' ');
    }
  }
  core = core.replace(/[?？!！,，.。:：]/gu, ' ').replace(/\s+/gu, ' ').trim();
  return { core: core || normalized, intent, normalized };
}

/** Character bigrams for CJK, words for Latin text. Used as a cheap similarity proxy. */
export function tokens(text) {
  const normalized = normalizeQuery(text);
  const result = [];
  for (const word of normalized.match(/[a-z0-9][a-z0-9.+_-]*/gu) ?? []) result.push(word);
  for (const run of normalized.match(/[㐀-鿿]+/gu) ?? []) {
    if (run.length === 1) result.push(run);
    for (let i = 0; i < run.length - 1; i += 1) result.push(run.slice(i, i + 2));
  }
  return result;
}

export function diceSimilarity(a, b) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.length || !right.length) return 0;
  const counts = new Map();
  for (const token of left) counts.set(token, (counts.get(token) ?? 0) + 1);
  let overlap = 0;
  for (const token of right) {
    const remaining = counts.get(token) ?? 0;
    if (remaining > 0) {
      overlap += 1;
      counts.set(token, remaining - 1);
    }
  }
  return (2 * overlap) / (left.length + right.length);
}

/** Share of the core's tokens that appear in the text. */
export function coverage(core, text) {
  const wanted = [...new Set(tokens(core))];
  if (!wanted.length) return 0;
  const have = new Set(tokens(text));
  return wanted.filter((token) => have.has(token)).length / wanted.length;
}

// ---------------------------------------------------------------- CSV / GSC

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^﻿/u, '');
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

const HEADER_ALIASES = {
  query: ['query', 'queries', 'top queries', '热门查询', '查询', '查询词'],
  page: ['page', 'pages', 'top pages', '网页', '页面', '热门网页'],
  clicks: ['clicks', '点击次数', '点击'],
  impressions: ['impressions', '展示', '展示次数', '曝光'],
  position: ['position', 'average position', '排名', '平均排名'],
  date: ['date', '日期'],
  country: ['country', '国家/地区', '国家'],
};

function parseNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[,%\s]/gu, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Parse a GSC Performance export (English or Chinese headers) into row objects. */
export function parseGscCsv(text, defaults = {}) {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const index = {};
  header.forEach((name, i) => {
    const key = name.trim().toLowerCase();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key)) index[field] = i;
    }
  });
  if (index.query === undefined) throw new Error('CSV has no query column; export the Queries tab.');
  return body.map((cells) => ({
    date: cells[index.date] || defaults.date,
    page: cells[index.page] || defaults.page || '',
    query: cells[index.query],
    country: cells[index.country] || defaults.country || '',
    clicks: parseNumber(cells[index.clicks]),
    impressions: parseNumber(cells[index.impressions]),
    position: parseNumber(cells[index.position]),
  })).filter((row) => row.query);
}

/** Rows from the Search Analytics API response, dimensions [date, page, query]. */
export function rowsFromApi(response) {
  return (response.rows ?? []).map((row) => ({
    date: row.keys[0],
    page: row.keys[1],
    query: row.keys[2],
    clicks: row.clicks,
    impressions: row.impressions,
    position: row.position,
  }));
}

// ----------------------------------------------------------- aggregation

export function isoWeek(dateString) {
  const date = new Date(`${dateString.slice(0, 10)}T00:00:00Z`);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Weighted mean position: weight by impressions. */
function weightedPosition(items) {
  const impressions = items.reduce((sum, item) => sum + item.impressions, 0);
  if (!impressions) return 0;
  return items.reduce((sum, item) => sum + item.position * item.impressions, 0) / impressions;
}

export function localeOf(query) {
  return /[㐀-鿿]/u.test(query) ? 'zh-CN' : 'en';
}

/** Collapse raw rows into one record per normalized query with weekly history. */
export function aggregateKeywords(rows) {
  const map = new Map();
  for (const row of rows) {
    const { normalized, core, intent } = queryCore(row.query);
    if (!normalized) continue;
    const key = core;
    const record = map.get(key) ?? {
      id: key,
      query: row.query,
      normalized,
      core,
      intent,
      locale: localeOf(row.query),
      variants: new Set(),
      pages: new Map(),
      weeks: new Map(),
    };
    record.variants.add(row.query);
    const pageStat = record.pages.get(row.page) ?? { impressions: 0, clicks: 0, weighted: 0 };
    pageStat.impressions += row.impressions;
    pageStat.clicks += row.clicks;
    pageStat.weighted += row.position * row.impressions;
    record.pages.set(row.page, pageStat);
    const week = row.date ? isoWeek(row.date) : 'undated';
    const bucket = record.weeks.get(week) ?? [];
    bucket.push(row);
    record.weeks.set(week, bucket);
    map.set(key, record);
  }
  return [...map.values()].map((record) => ({
    id: record.id,
    query: record.query,
    normalized: record.normalized,
    core: record.core,
    intent: record.intent,
    locale: record.locale,
    variants: [...record.variants],
    pages: [...record.pages.entries()]
      .map(([page, stat]) => ({
        page,
        impressions: stat.impressions,
        clicks: stat.clicks,
        position: stat.impressions ? stat.weighted / stat.impressions : 0,
      }))
      .sort((a, b) => b.impressions - a.impressions),
    weekly: [...record.weeks.entries()]
      .map(([week, items]) => ({
        week,
        impressions: items.reduce((sum, item) => sum + item.impressions, 0),
        clicks: items.reduce((sum, item) => sum + item.clicks, 0),
        position: weightedPosition(items),
      }))
      .sort((a, b) => a.week.localeCompare(b.week)),
  }));
}

export function totals(keyword) {
  const impressions = keyword.weekly.reduce((sum, week) => sum + week.impressions, 0);
  const clicks = keyword.weekly.reduce((sum, week) => sum + week.clicks, 0);
  return { impressions, clicks, ctr: impressions ? clicks / impressions : 0, position: weightedPosition(keyword.weekly) };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const POSITION_BUCKETS = [[1, 3], [4, 7], [8, 12], [13, 20], [21, 50], [51, 1000]];

function bucketOf(position) {
  return POSITION_BUCKETS.findIndex(([low, high]) => position >= low && position <= high);
}

/** Median CTR per rank bucket from this site's own data. */
export function ctrBaseline(keywords) {
  const buckets = POSITION_BUCKETS.map(() => []);
  for (const keyword of keywords) {
    const { impressions, ctr, position } = totals(keyword);
    const bucket = bucketOf(position);
    if (impressions >= 5 && bucket >= 0) buckets[bucket].push(ctr);
  }
  return buckets.map(median);
}

/** Flag keywords that deserve attention this week. */
export function classifyKeywords(keywords, { weeksBack = 4 } = {}) {
  const baseline = ctrBaseline(keywords);
  return keywords.map((keyword) => {
    const { impressions, clicks, ctr, position } = totals(keyword);
    const flags = [];
    if (position >= 8 && position <= 20 && impressions >= 10) flags.push('sprint');
    const bucket = bucketOf(position);
    if (bucket >= 0 && impressions >= 10 && baseline[bucket] > 0 && ctr < baseline[bucket] / 2) flags.push('low-ctr');
    const weeks = keyword.weekly.filter((week) => week.week !== 'undated');
    if (weeks.length >= 2) {
      const recent = weeks.slice(-weeksBack);
      const earlier = weeks.slice(-weeksBack * 2, -weeksBack);
      const recentImpressions = recent.reduce((sum, week) => sum + week.impressions, 0);
      const earlierImpressions = earlier.reduce((sum, week) => sum + week.impressions, 0);
      if (!earlier.length && recentImpressions >= 5) flags.push('new');
      if (earlier.length && earlierImpressions >= 10 && recentImpressions < earlierImpressions * 0.7) flags.push('declining');
    }
    const ranked = keyword.pages.filter((page) => page.impressions >= 3);
    if (ranked.length >= 2) flags.push('cannibalization');
    return { ...keyword, impressions, clicks, ctr, position, flags };
  });
}

// ------------------------------------------------------------- matching

const WEIGHTS = { evidence: 0.4, relevance: 0.3, lexical: 0.2, opportunity: 0.1 };

function opportunityScore(position) {
  if (!position) return 0.2;
  if (position >= 8 && position <= 20) return 1;
  if (position >= 4 && position < 8) return 0.6;
  if (position > 20 && position <= 50) return 0.5;
  return 0.2;
}

function bestExcerpt(core, doc) {
  let best = { text: '', score: 0 };
  for (const excerpt of doc.excerpts ?? []) {
    for (const paragraph of excerpt.split(/\n{2,}/u)) {
      const score = coverage(core, paragraph.slice(0, 400));
      if (score > best.score) best = { text: paragraph.slice(0, 120), score };
    }
  }
  return best;
}

function lexicalScore(core, doc) {
  const headings = (doc.excerpts ?? []).flatMap((excerpt) => excerpt.split('\n').filter((line) => /^#{1,3}\s/u.test(line)));
  const lead = (doc.excerpts?.[0] ?? '').slice(0, 200);
  const body = (doc.excerpts ?? []).join('\n');
  const fields = [
    [1, doc.title],
    [0.8, headings.join(' ')],
    [0.6, `${doc.description ?? ''} ${lead}`],
    [0.7, (doc.keywords ?? []).join(' ')],
    [0.3, body],
  ];
  return Math.max(...fields.map(([weight, text]) => weight * coverage(core, text)));
}

/**
 * Score keywords against published documents. Hard gates (same locale,
 * answerable) run before ranking; a high-evidence keyword that no page can
 * answer is reported as a content gap instead of a weak match.
 */
export function matchKeywords(keywords, documents) {
  const maxImpressions = Math.max(1, ...keywords.map((keyword) => keyword.impressions ?? 0));
  const results = [];
  for (const keyword of keywords) {
    const candidates = [];
    for (const doc of documents) {
      if (doc.locale !== keyword.locale) continue;
      if (keyword.intent === 'service' && !/\/(consulting|about)\//u.test(doc.url)) continue;
      const fullUrl = (page) => page.replace(/^https?:\/\/[^/]+/u, '');
      const observed = keyword.pages.find((page) => fullUrl(page.page) === doc.url);
      const evidence = observed ? Math.log1p(observed.impressions) / Math.log1p(maxImpressions) : 0;
      const excerpt = bestExcerpt(keyword.core, doc);
      const lexical = lexicalScore(keyword.core, doc);
      const titleHit = coverage(keyword.core, doc.title) >= 0.8;
      const keywordHit = coverage(keyword.core, (doc.keywords ?? []).join(' ')) >= 0.8;
      const headings = (doc.excerpts ?? []).flatMap((excerpt) => excerpt.split('\n').filter((line) => /^#{1,3}\s/u.test(line))).join(' ');
      const headingHit = coverage(keyword.core, headings) >= 0.8;
      // Metadata is an editorial target, not proof that the rendered page
      // answers the query. This matters because Google ignores meta keywords
      // for indexing and ranking. Require GSC page evidence or visible content
      // in the title, a heading, or a relevant passage.
      const answerable = evidence > 0 || titleHit || headingHit || (!doc.isStaticPage && excerpt.score >= 0.8);
      if (!answerable) continue;
      const relevance = Math.max(titleHit ? 1 : 0, headingHit ? 0.85 : 0, excerpt.score);
      const score = WEIGHTS.evidence * evidence + WEIGHTS.relevance * relevance + WEIGHTS.lexical * lexical + WEIGHTS.opportunity * opportunityScore(keyword.position);
      candidates.push({ url: doc.url, title: doc.title, score, evidence, relevance, lexical, passage: excerpt.text, titleHit, keywordHit });
    }
    candidates.sort((a, b) => b.score - a.score);
    const [primary, second] = candidates;
    results.push({
      keyword: keyword.query,
      core: keyword.core,
      intent: keyword.intent,
      locale: keyword.locale,
      impressions: keyword.impressions,
      ctr: keyword.ctr,
      position: keyword.position,
      flags: keyword.flags,
      primary,
      cannibalRisk: Boolean(primary && second && primary.score - second.score < 0.1),
      alternates: candidates.slice(1, 3),
      gap: !primary && (keyword.impressions ?? 0) >= 5,
    });
  }
  return results;
}

/** Documents whose body mentions a keyword core but that do not link to the primary URL. */
export function linkOpportunities(match, documents, links = {}) {
  if (!match.primary) return [];
  return documents
    .filter((doc) => doc.locale === match.locale && doc.url !== match.primary.url)
    .filter((doc) => coverage(match.core, (doc.excerpts ?? []).join('\n')) >= 1)
    .filter((doc) => !(doc.links ?? links[doc.url] ?? []).includes(match.primary.url))
    .map((doc) => doc.url);
}
