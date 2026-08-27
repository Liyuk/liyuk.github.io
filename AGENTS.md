# Repository contract for people and coding agents

This is a bilingual Astro static site for writing, research, projects, and photography. Make focused, reviewable changes; use the registries and helpers below as the source of truth; never publish, deploy, or notify without the required human confirmation.

## Architecture map

| Area                                                | Owns                                                                                           | Do not duplicate it in                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/content.config.ts`                             | Collection schemas and required frontmatter                                                    | Pages, scripts, or ad hoc validators                                                |
| `src/lib/content-model.ts`                          | Published/draft selection semantics                                                            | Individual `getCollection` predicates when a shared rule fits                       |
| `src/lib/content-paths.ts`                          | Locale-aware content URLs and collection-to-route mapping                                      | Templates, notification scripts, or components                                      |
| `src/lib/content-query.ts`                          | Locale grouping, fallback, and cross-collection queries                                        | Detail pages                                                                        |
| `src/lib/taxonomy.ts`                               | Tags, columns, start-page groups, related-content rules                                        | Content files or page-local lookup tables                                           |
| `src/lib/timeline.ts` and `src/lib/format-dates.ts` | Public ordering and date formatting                                                            | `Date` formatting in page components                                                |
| `src/i18n/index.mjs`                                | Shared Chinese/English UI copy                                                                 | Page-local duplicated labels                                                        |
| `src/pages/`                                        | Static route composition                                                                       | Components or content helpers                                                       |
| `src/components/`                                   | Reusable presentation                                                                          | Route-specific data selection                                                       |
| `scripts/`                                          | Creation, auditing, publish, notification, and browser runners                                 | Shell one-offs that bypass their contracts                                          |
| `tests/`                                            | Executable behavior contracts                                                                  | Documentation-only claims                                                           |
| `.github/workflows/deploy.yml`                      | CI verification, deployment, and notification ordering                                         | Local notes or assumed GitHub behavior                                              |
| `agent/`                                            | Architecture rationale, editorial rules, translation spec, per-collection writing guides, ADRs | Anything that also needs to be true without this directory — cite it, don't fork it |
| `.claude/skills/`                                   | Claude Code skills that operationalize the standards in `agent/`                               | A skill that invents a rule `agent/` doesn't already state                          |
| `docs/`                                             | Personal local notes and workflows — never tracked, no exception                               | Git, CI, review requirements, or repository contracts                               |

Editorial and writing-quality standards — voice, per-collection structure, the AI-detection threshold, and translation quality — live in `agent/` and are operationalized by the skills in `.claude/skills/`; this file covers engineering invariants only. Read `agent/README.md` before drafting or reviewing any `src/content/` entry.

## Content, paths, and locale rules

### Collections and routes

- `writing`, `research`, and `project` entries use dated directories: `YYYY/MM/<slug>/zh.md` and `en.md`.
- `gallery` entries use `src/content/galleries/<slug>.md` and `<slug>.en.md`; their public route is `/photos/<slug>/`.
- The `project` collection is singular, while its source directory and public route are plural: `src/content/projects/` and `/projects/`.
- Use `contentUrl`, `writingUrl`, `galleryUrl`, `entryUrl`, `tagUrl`, and `columnUrl` from `src/lib/content-paths.ts`. Never concatenate a content URL in a page, script, test, email, or notification.
- Default Chinese routes have no locale prefix; English routes use `/en/`. `trailingSlash: 'always'` is part of the public URL contract.

### Metadata and translations

- `title`, `description`, dates, tags, locale, translation status, and collection-specific fields must satisfy `src/content.config.ts`; do not relax schemas to accept malformed content.
- Chinese is the source locale. Chinese source files use `translationStatus: original`; published English files use `translationStatus: reviewed`; only unpublished English files may use `translationStatus: draft`. `translationStatus: draft` is never a production publication state. `draft: true` is the only publication switch.
- `writing`, `project`, and `gallery` require a matching English sibling before published Chinese content is accepted. `research` can use the documented detail-page Chinese fallback while translation is pending; this does **not** make Chinese entries appear in English archives, RSS, tags, or lists.
- Shared bilingual metadata must stay consistent where `audit:content` requires it. Do not solve a failed translation audit by weakening the audit.

### Draft behavior

- `draft: true` is the publication switch. Production builds, RSS, Pagefind, sitemap, lists, archives, tags, and columns include only published entries.
- In `npm run dev`, direct detail routes may preview real draft entries via `previewable`; draft detail pages are `noindex`.
- Templates such as `_template.md` are never preview routes. Do not change `previewable` without preserving production exclusion and template exclusion.
- Do not change a user-authored `draft: true` to `false` without explicit owner approval.

### Taxonomy, chronology, and assets

- Register every published tag and column in `src/lib/taxonomy.ts` before use. Creator-script warnings are not a substitute for `audit:content`.
- Columns only contain writing and gallery entries. Their source-locale `order` is positive and unique; taxonomy columns must be represented exactly once in `startGroups`.
- Public chronology and archives use `publishedAt` (falling back to `createdAt`); `updatedAt` is for last-updated ordering and display. Do not change date fields merely to reorder cards.
- Markdown and frontmatter image references must resolve. Gallery images need stable lowercase ids, absolute `/images/...` paths, meaningful alt text, positive dimensions, and a `cover` that names an existing image id.
- `npm run new:gallery` depends on macOS `sips` and `cwebp`; it writes optimized WebP assets into `public/images/galleries/` and leaves source files untouched.

## Rendering, SEO, and accessibility invariants

- Detail pages are locale variants grouped by a locale-free slug. Preserve `groupByLocaleVariant` and `pickLocaleVariant` behavior when changing dynamic routes.
- Use `BaseLayout` for page metadata. It owns canonical URLs, locale alternates, Open Graph/Twitter metadata, article JSON-LD, and `noindex` behavior.
- Search and favorites are `noindex` and excluded from the sitemap. Do not add a noindex route to sitemap filters or page indexes.
- A route, locale, layout, or metadata change requires a production build followed by `audit:seo` and `audit:links`; external URL availability is intentionally outside the link audit.
- Preserve one `main`, one page `h1`, meaningful image alt text, accessible link/control names, and axe-clean tested routes. Do not trade accessibility for visual-only changes.

## Change boundaries

- Prefer the smallest coherent change. Do not reformat authored content or unrelated UI files while changing automation, data, or routes.
- Generated and local-only paths are never committed: `node_modules/`, `.astro/`, `dist/`, `artifacts/`, `output/`, `viz/`, `.playwright-cli/`, `.DS_Store`, and `.agent-teams/`.
- The entire `docs/` directory is personal local material. Do not add, stage, reference as a required review artifact, or include it in checks. Shared rules belong in root `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, code, or tests.
- Never put API keys, tokens, subscriber data, private paths, unpublished personal data, or unreviewed local URLs into tracked files, logs, fixtures, or public content. Reader-facing localhost examples require explicit review.
- Do not bypass schemas, audits, tests, or the publish gate. If an exception is genuinely necessary, make the rationale reviewable in the implementation change and obtain approval.

## Verification matrix

| Change                                         | Minimum verification                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content, translation, tag, or column           | `npm run audit:content`, `npm run audit:images`, `npm run audit:columns`, `npm test`                                                                                    |
| Content URLs, routes, locale, layout, metadata | `npm test`, `npm run check`, `npm run build`, `npm run audit:seo`, `npm run audit:links`, `npm run test:e2e:fresh`, `npm run test:a11y:fresh`, `npm run test:draft:dev` |
| Scripts, audits, notification, or CI           | Focused tests, `npm test`, `npm run format:check`, `npm run publish:check`                                                                                              |
| Styles or interactive components               | `npm run check`, `npm run test:e2e:fresh`, `npm run test:a11y:fresh`; use the changed UI in a browser before reporting success                                          |
| Before a publish-oriented change is handed off | `npm run publish:check`; CI additionally runs E2E and axe checks                                                                                                        |

- Use Node `24.18.0` from `.node-version` and `npm ci` for a clean install. `npm ci` also installs the repository's pre-push hook via `prepare`.
- `publish:check` stops at the first failed step. It runs formatting, content/image/column audits, tests, Astro check, build, SEO audit, and link audit; it does not run browser tests.
- `test:e2e:ci` and `test:a11y` run against the existing `dist/`; use their `:fresh` wrappers outside a gate that already built. `test:draft:dev` owns an isolated Astro dev server. Plain `test:e2e` expects an already running server at `E2E_BASE`.
- `npm run format:check` intentionally covers project automation, workflows, AGENTS, CONTRIBUTING, and selected tests. It does not currently format authored content or README.

## Human confirmation points

An agent may prepare drafts, code, tests, dry-run reports, and local verification. It must not independently:

1. publish content or flip a user-authored draft to public;
2. push, merge, deploy, change GitHub settings/secrets, or force a branch operation;
3. invoke `notify:buttondown -- --apply`, send subscriber communication, or expose a Buttondown API key;
4. add, stage, or otherwise turn local `docs/` material into a repository deliverable;
5. discard unfamiliar worktree changes, generated diagnostics needed for debugging, or user-owned local files.

CI behavior is intentional: pull requests verify; only successful `master` verification deploys; Buttondown notification runs only after successful deployment and is visibly retryable if it fails. Before requesting review, report the files changed, checks run, remaining warnings, and any intentional policy exception.
