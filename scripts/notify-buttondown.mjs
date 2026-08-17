// Send new-published blog posts to Buttondown as email drafts (or send outright).
//
// Goal: when you publish a post (flip draft: true → false and push), a GitHub
// Actions workflow runs this script so your Buttondown subscribers get a short
// "new post" email (title + summary + link) — the free way to auto-notify
// readers without Buttondown's paid RSS-to-email feature.
//
// Design:
//   * Change detection  — `git diff` against a base ref (or the last push) picks
//     up exactly the posts that became published in this change, so we never
//     spam the whole archive on every push.
//   * Idempotency        — emails are matched by subject (the clean article
//     title, no prefix); we look up existing emails by that subject before
//     sending, so running the workflow again (manual dispatch, retry) never
//     double-sends.
//   * Dry-run by default — nothing hits the network unless you pass `--apply`.
//
// Run locally:      npm run notify:buttondown -- --apply
// Dry-run:          npm run notify:buttondown
// CI invocation:    BUTTONDOWN_API_KEY=... node scripts/notify-buttondown.mjs \
//                     --baseRef <sha> --apply
//
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const API_BASE = 'https://api.buttondown.com/v1';

// Root of all content collections.
const CONTENT_ROOT = path.join(process.cwd(), 'src/content');

// ---------------------------------------------------------------------------
// Arg parsing / config
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    apply: false,           // false = dry-run, true = actually create emails
    baseRef: null,          // git ref to diff against (e.g. github.event.before)
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--baseRef') args.baseRef = argv[++i] ?? null;
  }
  return args;
}

// ---------------------------------------------------------------------------
// Small markdown/HTML helpers (pure Node, no dependencies)
// ---------------------------------------------------------------------------

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripInlineMarkdown(text = '') {
  return text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')   // [label](url) -> label
    .replace(/`([^`]*)`/g, '$1')          // `code`
    .replace(/\*\*([^*]*)\*\*/g, '$1')    // **bold**
    .replace(/\*([^*]*)\*/g, '$1')        // *italic*
    .replace(/^>+\s?/gm, '')              // blockquotes
    .replace(/#{1,6}\s+/g, '')            // headings
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a minimal, self-contained HTML email body (works for Buttondown's
// auto-detected "fancy" rich body). Keep it plain and dependency-free.
// `blocks` is an array of language sections, each with title/summary/url,
// so one article can carry both its Chinese and English versions in a single
// email. Blocks are ordered as passed (zh first by convention).
//
// The email header and footer are intentionally NOT rendered here: they are
// configured in the Buttondown dashboard (Settings → Header/Footer) and get
// wrapped around every email by Buttondown. The unsubscribe footer is also
// added automatically by Buttondown, so this function only produces the
// article content itself.
export function buildEmailHtml({ blocks }) {
  const sections = blocks.map(({ lang, title, summary, url, meta }) => {
    const safeTitle = esc(title);
    const langLabel = lang === 'zh' ? '中文 · Chinese' : 'English';
    const metaLine = meta
      ? `<p style="margin:0 0 14px;font-size:13px;color:#999;">${esc(meta)}</p>`
      : '';
    return [
      `<p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#999;">${langLabel}</p>`,
      `<h1 style="margin:0 0 16px;font-size:23px;line-height:1.35;color:#222;">${safeTitle}</h1>`,
      metaLine,
      `<p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#444;">${esc(summary)}</p>`,
      `<p style="margin:0 0 28px;"><a href="${esc(url)}" style="display:inline-block;padding:10px 20px;border-radius:8px;background:#1456F0;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;">阅读全文 · Read more →</a></p>`,
    ].join('');
  });

  return [
    `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">`,
    `<div style="max-width:600px;margin:0 auto;padding:32px 20px;">`,
    sections.join(`<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">`),
    `</div></body></html>`,
  ].join('');
}

// ---------------------------------------------------------------------------
// Git change detection
// ---------------------------------------------------------------------------

function git(args, opts = {}) {
  return execSync(`git ${args}`, { encoding: 'utf8', ...opts }).trim();
}

// Resolve the ref to diff against. Prefer --baseRef; fall back to the merge base
// of HEAD vs. a single previous commit when run on a local checkout.
function resolveBaseRef(baseRef) {
  if (baseRef) return baseRef;
  try {
    // local: diff HEAD~1..HEAD (last commit)
    git('rev-parse --verify HEAD~1');
    return 'HEAD~1';
  } catch {
    return 'HEAD'; // only one commit; diff against empty tree
  }
}

// Diff against an empty tree, uniform with the rest of the script.
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

// Recursively list .md files under a directory (pure sync Node, no glob races).
function listMdRecursive(dir) {
  const found = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return found; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) found.push(...listMdRecursive(p));
    else if (e.isFile() && e.name.endsWith('.md')) found.push(p);
  }
  return found;
}

// Return the list of touched md paths under src/content for a diff range.
// `--diff-filter=ACMRT` keeps adds/copies/moves/renames (re-created drafts that
// were already known to Buttondown are still deduped by subject lookup).
function changedContentPaths(baseRef) {
  const out = [];
  const base = baseRef === 'HEAD' ? EMPTY_TREE : `${baseRef}...HEAD`;
  try {
    const diff = git(`diff --name-only --diff-filter=ACMRT ${base} -- src/content`);
    for (const line of diff.split('\n')) {
      if (line.trim() && line.endsWith('.md')) out.push(path.join(process.cwd(), line.trim()));
    }
  } catch {
    // If diffing fails, fall back to scanning the whole content tree and letting
    // idempotency skip anything already sent (safer than sending nothing).
    for (const c of ['writing', 'research', 'projects']) {
      out.push(...listMdRecursive(path.join(CONTENT_ROOT, c)));
    }
    out.push(...listMdRecursive(path.join(CONTENT_ROOT, 'galleries')));
  }
  return out;
}

// Extract the body (everything after the frontmatter block) of a content file.
function extractBody(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return m ? m[1] : raw;
}

// Reading-time estimate. Mirrors src/lib/reading-time.ts, kept dependency-free:
// count Han characters for zh-CN, word tokens otherwise, at 400/min, min 1.
export function readingMinutes(body, locale) {
  if (!body) return 1;
  const isChinese = locale === 'zh-CN';
  const count = isChinese
    ? (body.match(/\p{Script=Han}/gu) ?? []).length
    : (body.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil(count / 400));
}

// Format a `YYYY-MM-DD` date for each language (friendly short form).
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDate(dateStr, locale) {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(dateStr);
  const [, y, mo, d] = m;
  if (locale === 'zh-CN') return `${y}年${parseInt(mo, 10)}月${parseInt(d, 10)}日`;
  return `${EN_MONTHS[parseInt(mo, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

// Build the meta line (reading time + publish date) for one language.
export function buildMeta(fm, body, locale) {
  const minutes = readingMinutes(body, locale);
  const date = formatDate(fm.publishedAt, locale);
  const parts = [];
  parts.push(locale === 'zh-CN' ? `约 ${minutes} 分钟阅读` : `${minutes} min read`);
  if (date) parts.push(date);
  return parts.join(' · ');
}

// Parse frontmatter of a content file. Returns data or null if unparseable.
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  // Capture the whole value of each `key: value` line (values may contain
  // spaces, e.g. a title), then strip one level of surrounding quotes.
  const re = /^(\w+):\s*(.*)$/gm;
  let m;
  while ((m = re.exec(match[1])) !== null) {
    const key = m[1];
    let value = m[2].trim();
    if (!value) continue;
    // Remove surrounding double/single quotes if the whole value is quoted.
    if (value.length >= 2 && ((value[0] === '"' && value[value.length - 1] === '"') || (value[0] === "'" && value[value.length - 1] === "'"))) {
      value = value.slice(1, -1);
    }
    fm[key] = value;
  }
  return fm;
}

// Resolve which locale a content file represents. Conventions:
//   writing/research/projects : <dir>/zh.md  (zh, default)  or <dir>/en.md (en)
//   galleries                 : <slug>.md    (zh, default)  or <slug>.en.md (en)
export function entryLocale(filePath) {
  const basename = path.basename(filePath);
  const rel = path.relative(CONTENT_ROOT, filePath).split(path.sep);
  if (rel[0] === 'galleries') return basename.endsWith('.en.md') ? 'en' : 'zh';
  return basename === 'en.md' ? 'en' : 'zh';
}

// Return a locale-independent identifier for one article, shared by its zh.md
// and en.md so they merge into one email. For dated collections that is
// `collection/yyyy/mm/slug`; for galleries it is `galleries/<slug>`.
export function entryKey(filePath) {
  const rel = path.relative(CONTENT_ROOT, filePath).split(path.sep);
  const collection = rel[0];
  if (collection === 'galleries') {
    const slug = rel[1].replace(/\.en\.md$/, '').replace(/\.md$/, '');
    if (slug && !slug.startsWith('_')) return `galleries/${slug}`;
    return null; // ignore template files
  }
  const [year, month, slug] = rel.slice(1, 4);
  if (!slug || slug.startsWith('_')) return null; // ignore templates
  return `${collection}/${year}/${month}/${slug}`;
}

// Derive the public URL for a content file given its collection + year/month/slug.
function entryUrl(filePath) {
  const rel = path.relative(CONTENT_ROOT, filePath).split(path.sep);
  // rel: [writing|research|projects, yyyy, mm, slug, zh|en.md]  or
  //      [galleries, <slug>.md | <slug>.en.md]
  const collection = rel[0];
  const isEn = entryLocale(filePath) === 'en';
  if (collection === 'galleries') {
    const slug = rel[1].replace(/\.en\.md$/, '').replace(/\.md$/, '');
    return isEn ? `/en/galleries/${slug}/` : `/galleries/${slug}/`;
  }
  const [year, month, slug] = rel.slice(1, 4);
  const base = isEn
    ? `/en/${collection}/${year}/${month}/${slug}/`
    : `/${collection}/${year}/${month}/${slug}/`;
  return base; // trailingSlash always → keep trailing slash
}

// ---------------------------------------------------------------------------
// Buttondown API
// ---------------------------------------------------------------------------

// Generic Buttondown API helper. `extraHeaders` lets callers add headers that
// the endpoint requires on certain mutations, e.g. sending an email needs
// `X-Buttondown-Live-Dangerously` (confirmed once per API key).
async function buttondownApi(pathname, { token, method = 'GET', body, extraHeaders } = {}) {
  const headers = { Authorization: `Token ${token}`, ...extraHeaders };
  if (body) headers['Content-Type'] = 'application/json';
  const resp = await fetch(`${API_BASE}${pathname}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await resp.text();
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON error body */ }
  return { status: resp.status, ok: resp.ok, json };
}

// Look up whether an email with the given subject already exists (any status).
async function findEmailBySubject(subject, token) {
  let page = 1;
  let seen = 0;
  for (; ; ) {
    const { ok, json } = await buttondownApi(`/emails?subject=${encodeURIComponent(subject)}&ordering=-creation_date&page=${page}`, { token });
    if (!ok || !Array.isArray(json?.results)) return false;
    for (const em of json.results) {
      seen++;
      if (typeof em.subject === 'string' && em.subject === subject) return true;
    }
    if (!json.next || json.results.length === 0 || seen > 2000) break;
    page++;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.BUTTONDOWN_API_KEY?.trim();

  if (args.apply && !token) {
    console.error('✘ 需要 BUTTONDOWN_API_KEY 环境变量（只有 --apply 时才需要）。');
    process.exit(2);
  }

  console.log(args.apply ? '● 真实模式（将调用 Buttondown API）' : '○ 预览模式（dry-run，加 --apply 触发真实发送）');

  // 1. Which content md files changed in this push?
  const baseRef = resolveBaseRef(args.baseRef);
  const changedFiles = changedContentPaths(baseRef);
  console.log(`  变更基准 ref: ${baseRef}，检测到 ${changedFiles.length} 个 content md 变更。`);

  // 2. Parse only the ones that became / are published. Group files by article
  //    so zh.md and en.md of the same post are merged into one email.
  const byArticle = new Map(); // key -> { zhUrl?, enUrl?, url, zh?: {fm}, en?: {fm} }
  for (const file of changedFiles) {
    const raw = await readFile(file, 'utf8').catch(() => null);
    if (!raw) continue;
    const fm = parseFrontmatter(raw);
    if (!fm) continue;
    if (fm.draft === 'true') continue; // still a draft, skip
    const key = entryKey(file);
    if (!key) { console.warn(`  ⚠ 无法归类，跳过: ${path.relative(process.cwd(), file)}`); continue; }
    const localeId = entryLocale(file);
    const bucket = byArticle.get(key) ?? { zhUrl: null, enUrl: null, url: entryUrl(file), zh: null, en: null };
    bucket[localeId] = { fm, body: extractBody(raw) };
    if (localeId === 'en') bucket.enUrl = entryUrl(file);
    else bucket.zhUrl = entryUrl(file);
    byArticle.set(key, bucket);
  }

  const candidates = [];
  for (const [key, bucket] of byArticle) {
    const zh = bucket.zh?.fm ?? null;
    const en = bucket.en?.fm ?? null;
    const zhBody = bucket.zh?.body ?? '';
    const enBody = bucket.en?.body ?? '';
    const zhUrl = bucket.zhUrl ?? bucket.url;
    const enUrl = bucket.enUrl ?? bucket.url.replace(/^\//, '/en/');
    if (zh && en) {
      // Both languages edited as published → one bilingual email, zh block first.
      // Subject is the clean English title (no prefix; brand comes from the
      // Buttondown From name, not the subject line).
      candidates.push({
        label: `[中/EN] ${en.title}`,
        subject: en.title,
        url: zhUrl,
        blocks: [
          { lang: 'zh', title: zh.title, summary: stripInlineMarkdown(zh.description || '').slice(0, 220), url: zhUrl, meta: buildMeta(zh, zhBody, 'zh-CN') },
          { lang: 'en', title: en.title, summary: stripInlineMarkdown(en.description || '').slice(0, 220), url: enUrl, meta: buildMeta(en, enBody, 'en') },
        ],
      });
    } else {
      // Only one language was touched → still single-block mail.
      const fm = zh || en;
      const body = zh ? zhBody : enBody;
      const isEn = !zh && !!en;
      const url = isEn ? enUrl : zhUrl;
      candidates.push({
        label: `${isEn ? '[EN]' : '[中文]'} ${fm.title}`,
        subject: fm.title,
        url,
        blocks: [{ lang: isEn ? 'en' : 'zh', title: fm.title, summary: stripInlineMarkdown(fm.description || '').slice(0, 220), url, meta: buildMeta(fm, body, isEn ? 'en' : 'zh-CN') }],
      });
    }
  }

  console.log(`  待处理已发布文章: ${candidates.length} 篇（合并中/英）`);
  if (candidates.length === 0) {
    console.log('✔ 本次没有新发布的文章，无需发信。');
    return 0;
  }

  // 3. Build and send / preview each.
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const cand of candidates) {
    const { label, subject, url, blocks } = cand;
    const primary = blocks[0]?.title ?? label;
    if (!primary) { console.warn(`  ⚠ 跳过（无标题）: ${label}`); continue; }

    // 4. Idempotency: skip if we already created this post's email.
    let exists = false;
    if (args.apply && token) exists = await findEmailBySubject(subject, token);
    if (exists) {
      console.log(`  → 已存在，跳过: ${label}`);
      skipped++;
      continue;
    }

    if (args.apply) {
      const builtHtml = buildEmailHtml({ blocks });
      const body = { subject, status: 'about_to_send', canonical_url: `https://liyuk.com${url}`, body: builtHtml };
      // Buttondown requires the confirmation header before it will create an
      // email with status 'about_to_send'. It technically only needs to be
      // supplied once per API key, but it is harmless to always include it.
      const { status, ok, json } = await buttondownApi('/emails', { token, method: 'POST', body, extraHeaders: { 'X-Buttondown-Live-Dangerously': 'true' } });
      if (ok) {
        console.log(`  ✔ 已发送: ${label}`);
        sent++;
      } else if (status === 409) {
        console.log(`  → 幂等 409，跳过: ${label}`);
        skipped++;
      } else {
        console.error(`  ✘ 发送失败 (HTTP ${status}): ${label}`);
        if (typeof json === 'object') console.error(`    ${JSON.stringify(json).slice(0, 300)}`);
        failed++;
      }
    } else {
      // Dry-run preview
      console.log(`\n  · 将发送: ${label}`);
      for (const b of blocks) {
        console.log(`    [${b.title}]`);
        console.log(`      URL   : https://liyuk.com${b.url}`);
        console.log(`      摘要  : ${b.summary}`);
      }
      skipped++; // dry-run counts as "not sent"; keep final tally simple
    }
  }

  if (!args.apply) {
    console.log(`\n○ 预览完成：本次将发送 ${candidates.length} 封（内容如上）。`);
    console.log('  运行 `BUTTONDOWN_API_KEY=... npm run notify:buttondown -- --apply` 真实发送。');
  } else {
    console.log(`\n● 完成：发送 ${sent}，幂等跳过 ${skipped}，失败 ${failed}`);
  }
  return failed ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1); });
}
