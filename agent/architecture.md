# Architecture, feature status, and known exceptions

This is the deeper reference behind `AGENTS.md`'s architecture map — read `AGENTS.md` first for the file-ownership table and change boundaries. This file explains *why* things are shaped the way they are, documents the current feature surface, and lists known edge cases so an agent doesn't have to rediscover them. Design decisions with real trade-offs are recorded as ADRs in `agent/adr/`; this file gives the current-state summary and links out to the relevant ADR instead of repeating its reasoning.

## Content model

Five collections, defined in `src/content.config.ts`:

| Collection | Source dir | Public URL | Bilingual requirement | Notes |
| --- | --- | --- | --- | --- |
| `writing` | `src/content/writing/<year>/<month>/<slug>/` | `/writing/<slug>/` | Required | Main essay/note/case-study stream; `.strict()` schema |
| `consulting` | `src/content/consulting/<year>/<month>/<slug>/` | `/consulting/<slug>/` | Required | Edited career-consulting session records; `.strict()` schema; see `agent/category-guides/consulting.md` |
| `project` | `src/content/projects/<year>/<month>/<slug>/` | `/projects/<slug>/` | Required | Collection name is singular, directory and route are plural; includes the "work" subtype (serialized novels) |
| `research` | `src/content/research/<year>/<month>/<slug>/` | `/research/<slug>/` | Fallback allowed (`agent/adr/0002`) | Papers and research notes; requires `repositoryUrl` or `paperUrl` |
| `gallery` | `src/content/galleries/<slug>.md` | `/photos/<slug>/` | Required | Flat, keyed by `slug`, not a dated path |

Content files are `zh.md` (source) or `en.md` (translation) in the same directory; `contentSlug()` in `src/lib/content-paths.ts` strips the language suffix from the public URL.

Two predicates in `src/lib/content-model.ts` gate what's visible where:

```js
export const notDraft = (entry) => !isTemplateEntry(entry) && !entry.data.draft;
export const publishedIn = (locale) => (entry) =>
  !isTemplateEntry(entry) && !entry.data.draft && entry.data.locale === locale;
export const previewable = (entry) => !isTemplateEntry(entry) && (import.meta.env.DEV || !entry.data.draft);
```

`previewable` is what lets `npm run dev` open a real draft's direct detail URL while keeping it out of every list, archive, RSS, sitemap, and the production build. All three predicates exclude templates, so `src/content/writing/_template.md` stays out of production because it is a template — not because someone remembered to leave `draft: true` in it. Only the writing template ships; galleries are scaffolded entirely by `npm run new:gallery`.

### Dates

Frontmatter dates are date-only strings (`YYYY-MM-DD`), parsed by `parseContentDate()` into a local-midnight `Date` — never shifted to UTC. Display always goes through `src/lib/format-dates.ts` (`formatFullDate`, `formatYearMonth`, `isoDate`); never call `toLocaleDateString`/`toISOString` directly in a page or component.

`createdAt` / `publishedAt` / `updatedAt` mean slightly different things per collection: for `writing` and `consulting`, `createdAt` is when the piece was conceived and `publishedAt` drives RSS ordering; for `research`, `createdAt` is the version date; for `project`, `createdAt` is the start (or "collected", for the work subtype) date.

### Columns and tags

A column is a hand-curated reading path. Entries opt in with `column: { slug, order }`; the registry (label, description per locale) lives in `src/lib/taxonomy.ts`. The `order` is the only path metadata: order 1 is the natural starting point, and later entries are read in sequence. Article `type` describes form, while the shared reading-time estimate helps readers judge the time needed. `project` entries do not use columns. `getColumnEntries()` returns a column's entries in declared order; a column only renders once it has at least one entry, and its `order` values must be positive and unique.

Tags are a flat global registry in `src/lib/taxonomy.ts` (slug → `['中文', 'English']`). Every collection references tags by slug; `audit:content` fails on an unregistered tag. Index pages only surface tags used by 3 or more entries.

### Related-entries scoring

`getRelatedEntries()` scores candidates by same-column membership (+50) and shared-tag count (+10 each), caps same-column results at one recommendation, and excludes the entries already shown as column neighbors. This replaced an earlier IDF-weighted, token-overlap, temporal-proximity scheme deliberately: the heavier version was never validated against actual click behavior, added tuning surface with no observed benefit, and was harder to explain when two posts unexpectedly showed up as related. If recommendations need to improve, the next step is observing what readers actually click, not adding more scoring terms. The constants live at the top of `src/lib/taxonomy.ts`.

### The "work" subtype

A `project` entry with both `workUrl` and a `work` object (pen name, platform, serialization status, optional cover) renders as a work card — used for the two serialized novels, which link to external platforms (起点/Qidian) instead of a repository. These entries skip the repo/GitHub UI and show a "作品" badge.

### The `en/` wrapper pattern

Every `src/pages/en/**` route is a thin wrapper around its Chinese counterpart:

```astro
---
import Page from '../../research/[...slug].astro';
export { getStaticPaths } from '../../research/[...slug].astro';
---
<Page {...Astro.props} />
```

`getStaticPaths` cannot read `Astro.currentLocale` (verified empirically, not assumed), so the shared page enumerates every locale variant with `notDraft` and passes all of them through props; the page itself picks the variant matching the current route. This is why one `getStaticPaths` implementation serves both locales without duplicating query logic — don't "fix" this by trying to filter inside `getStaticPaths`.

## CI/automation contract

`npm run publish:check` is the single local gate (format check → content/image/column audits → unit tests → `astro check` → production build → SEO audit → link audit), and it stops at the first failure. GitHub Actions runs the same gate plus browser checks, as one `verify → deploy → notify` workflow (`.github/workflows/deploy.yml`, formalized in `agent/adr/0003`):

```text
pull_request                 → verify
master push                  → verify → deploy → notify
manual dispatch               → verify (deploy/notify only fire off a master ref)
```

A browser-check failure uploads `artifacts/browser-checks/` (screenshots, Playwright traces) so a failure is debuggable without reproducing it locally. If `BUTTONDOWN_API_KEY` isn't configured, deploy still completes and the `notify` job records why it skipped, rather than failing the pipeline. See `CONTRIBUTING.md`'s verification matrix for which npm scripts a given change needs — that table is the canonical list; this section only adds the CI-graph and failure-artifact behavior that table doesn't cover.

## Image asset conventions

Every published image ships in Git with its content — no temporary local paths, chat-attachment URLs, or unconfirmed external links. `npm run audit:images` catches a Markdown/frontmatter reference to a local image that doesn't exist, and a file sitting in a publish directory that nothing references.

| Content | Location | How it's referenced |
| --- | --- | --- |
| Writing/research inline images | that entry's own `images/` subdirectory | Markdown relative path, e.g. `![caption](./images/system-map.svg)` |
| Project hero images | `public/images/projects/<project-slug>/` | frontmatter `hero.src: /images/projects/...` |
| Gallery images | `public/images/galleries/<gallery-slug>/` | frontmatter `images` list (`agent/category-guides/gallery.md`) |
| Raw sources, unpublished versions | `backups/image-sources/<content-slug>/` | never referenced from published content |

Don't leave images loose at the root of a content directory, and don't name them by timestamp, `image.png`, or `final-final`. Use a kebab-case name that says what the image is (`facial-observation-chart.png`).

Content requirements: every published image needs `alt` text that describes what's actually in the frame (empty `alt` is reserved for purely decorative images); a caption adds source/context/reading information, it doesn't restate `alt`; diagrams default to SVG, photos and gradient-heavy images default to WebP/AVIF, and PNG is for cases that genuinely need lossless or transparency; an AI-generated image's caption states that plainly ("concept illustration" or equivalent) rather than passing as a real product screenshot, user result, or research evidence.

## Outbound link tracking (UTM)

`src/components/ShareRow.astro` appends `utm_source=<channel>&utm_medium=social` to every share-button URL so Cloudflare Web Analytics (the site's analytics tool) can attribute traffic that would otherwise lose its `Referer` header — WeChat's in-app browser, some apps, and `rel="noopener noreferrer"` links all strip it, which otherwise shows up as "direct" traffic. Channel values: `x`, `weibo`, `telegram`, `whatsapp`, `linkedin`, `facebook`, `wechat` (QR code), `copy`, `native` (mobile share sheet). `copy` and `native` intentionally bucket "reader manually reshared this" separately from "reader clicked a specific platform button," since the eventual destination platform for those two is unknown.

When posting a link manually outside the site (Weibo, Zhihu, 即刻, X, a newsletter), append the same convention by hand: `?utm_source=<channel>&utm_medium=social` (or `&utm_source=...` if the URL already has a `?`). This is a marketing-attribution convention, not a build-time contract enforced by any script — get it right by following the pattern above, not by relying on a check to catch a mistake.

## Known exceptions and edge cases

These are documented so they don't get "fixed" by someone who doesn't know they're intentional, and so a recurring failure mode isn't re-diagnosed from scratch:

- **Research's Chinese fallback is a tracked exception, not a bug.** An English `/en/research/...` route with no `en.md` yet renders the Chinese variant via `pickLocaleVariant()`. This is deliberate (`agent/adr/0002`) — `audit:content` surfaces it as a warning, not a failure. Don't silence the warning; close the gap or leave it visible.
- **`Tsconfig not found astro/tsconfigs/strict` is a dependency problem, not a content problem.** If a dev-server draft route 500s with this error, the fix is `npm ci`, not editing the Markdown or frontmatter that happened to be open at the time. This was misdiagnosed once (2026-08-20) before the root cause — an incomplete local `node_modules` — was confirmed.
- **The `neo-matrix` project's `localhost` command example is an intentional, reader-facing exception.** `audit:content`'s localhost/127.0.0.1 pattern check will flag it; that's correct behavior (the check should always surface a localhost string for confirmation), and the confirmation each time is that this one is a legitimate local-dev-command example, not a leaked private address.
- **Buttondown idempotency matches on `subject + canonical_url`, with a fallback to subject-only for pre-existing legacy records.** A brand-new notification-matching change must keep both paths working — do not assume every historical record has a canonical URL.
- **`translationStatus: draft` is never a valid state for published content.** Only unpublished (`draft: true`) English files may sit at `translationStatus: draft`; `audit:content` should fail, not warn, if a published entry is caught at that status. If you find this invariant is only a warning somewhere, that's a gap, not the intended design.
- **A markdown-pipeline change needs `npx astro build --force` locally, not `npm run build`.** Astro caches rendered collection entries, so editing a remark/rehype plugin or `astro.config.mjs`'s markdown options re-renders only the content files that themselves changed. Everything else keeps its previously rendered HTML, and a local `dist/` ends up mixing old and new output — which reads exactly like "my plugin change didn't work." CI is unaffected (a fresh checkout has no cache and rebuilds everything), so the danger is the reverse: a local `publish:check` can pass against a `dist/` that differs from what deploys. After touching the pipeline, rebuild with `--force` before trusting any `dist/`-based audit or browser check. Found 2026-08-29, when a `rehype-scroll-wrap` fix appeared to have no effect and half the site's `katex-display` elements were missing an attribute the plugin had been adding for weeks.

- **`docs/` is not a fallback place to look for a missing standard.** If an agent needs a project rule and can't find it in `AGENTS.md`, `CONTRIBUTING.md`, `agent/`, or `.claude/skills/`, the rule doesn't exist as a tracked standard yet — it is not hiding in `docs/`, which is explicitly excluded from being a contract (`agent/adr/0005`). Propose the rule and add it to `agent/` rather than inferring it from local notes that won't exist on another machine.
