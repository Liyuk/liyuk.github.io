# Contributing

This repository is a bilingual Astro site. Contributions should improve the site without creating hidden publication, privacy, accessibility, or automation risk.

## Setup

```sh
# Node must match .node-version (24.18.0)
npm ci
```

Use `npm ci`, not `npm install`, for ordinary development so local and CI dependency graphs match. It also runs `prepare` and installs the repository's `.githooks/pre-push` hook. An intentional dependency change must update both `package.json` and `package-lock.json`.

`docs/` is local-only: do not add material there to a pull request, cite it as a required contract, or add it to automated checks. Shared rules belong in root documentation, code, and tests.

## Development and draft preview

```sh
npm run dev -- --host 127.0.0.1
```

Open a draft's direct detail URL to preview it, for example:

```text
/writing/2026/08/dsh-plugin-architecture-stability/
/research/2026/08/model-harness-task-scheduling-context-routing/
```

Draft preview is deliberately limited to real detail entries in development. Drafts remain excluded from lists, archives, tags, columns, RSS, Pagefind, sitemap, and production builds; preview pages are `noindex`. If Astro reports `Tsconfig not found astro/tsconfigs/strict`, restore local dependencies with `npm ci` before changing content or routes.

## Content workflow

Use `npm run new:post` for writing, research, consulting, or projects and `npm run new:gallery` for galleries. New entries start as `draft: true`. Before drafting, read the relevant `agent/category-guides/*.md` and, if using Claude Code, the matching `write-*` skill in `.claude/skills/`; both encode structure and evidentiary/comparative expectations specific to that collection that this file doesn't repeat.

| Kind                                      | Source convention                                            | Public route                                            |
| ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| Writing / research / project / consulting | `src/content/<collection>/YYYY/MM/<slug>/zh.md` plus `en.md` | `/writing/`, `/research/`, `/projects/`, `/consulting/` |
| Gallery                                   | `src/content/galleries/<slug>.md` plus `<slug>.en.md`        | `/photos/<slug>/`                                       |

Use `src/lib/content-paths.ts` rather than assembling content URLs. The `project` collection is singular but the directory and public route are plural. Gallery creation requires macOS `sips` and `cwebp`; its generated WebP files belong under `public/images/galleries/`.

Before an editor changes `draft: true` to `false`, confirm:

- title, description, dates, tags, column metadata, images, and links are accurate;
- tag and column slugs are registered in `src/lib/taxonomy.ts`;
- a column's source-locale order is positive and unique;
- column entries have a registered slug and unique positive order; article type and reading time help readers choose what to read next;
- image paths resolve and every meaningful image has appropriate alt text;
- locale filenames, frontmatter, `translationKey`, and translation status pass `npm run audit:content`; Chinese source files are `original`, published English files are `reviewed`, and `translationStatus: draft` is reserved for unpublished English work;
- published writing, projects, and galleries have their required English sibling; research fallback is only for English detail pages, not English archives or RSS;
- public wording contains no secret, private contact detail, unreviewed local URL, or unpublished material;
- `.claude/skills/content-review` (or an equivalent manual pass) has been run and its public-risk and category-fit findings addressed;
- the matching writing skill has been run, followed by content-review's separate AI-signal pass, author's-voice pass, dimensional-wall pass (no unnecessary exposure of the writing/AI/review process), reader-value pass (what a reader can learn, judge, or do), and distinctiveness pass (what non-generic, specifically owned contribution the piece makes); the final report is an explicit `GO`;
- the site owner explicitly approved publication.

`npm run publish <slug> -- --confirm-editorial-review` publishes the sibling pair and normalizes Chinese `original` / English `reviewed` translation status only after the matching writing skill, content-review (including the dimensional-wall check), and owner approval are complete. The confirmation flag is an intentional hard stop for the human editorial gate; without it, the command refuses to flip a draft public. Do not use `git push --no-verify` as a routine publishing workflow.

## Verification

| Change type                                         | Required commands                                                                                                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content, translation, taxonomy, or image references | `npm run audit:content`, `npm run audit:images`, `npm run audit:columns`, `npm test`                                                                                    |
| Routes, locale, layout, metadata, or URLs           | `npm test`, `npm run check`, `npm run build`, `npm run audit:seo`, `npm run audit:links`, `npm run test:e2e:fresh`, `npm run test:a11y:fresh`, `npm run test:draft:dev` |
| Scripts, audits, notification, or workflow          | Focused tests, `npm test`, `npm run format:check`, `npm run publish:check`                                                                                              |
| Styles or interactive components                    | `npm run check`, `npm run test:e2e:fresh`, `npm run test:a11y:fresh`, plus browser use of the changed path                                                              |
| Before a publish-oriented handoff                   | `npm run publish:check`; CI adds browser E2E and axe checks                                                                                                             |

`npm run publish:check` runs scoped formatting, content/image/column audits, Node tests, Astro check, production build, SEO audit, and internal-link audit. It stops at the first failure. It does not launch a browser.

This table is the canonical verification matrix (`agent/architecture.md` points here). `AGENTS.md` mirrors it for agents reading only that file — change both together or they drift.

`npm run test:e2e:ci` and `npm run test:a11y` use the existing `dist/` build; use `npm run test:e2e:fresh` and `npm run test:a11y:fresh` when a command must build first. `npm run test:draft:dev` starts and cleans up its own isolated Astro development server. The interactive `npm run test:e2e` expects an already running server at `E2E_BASE` (default `http://localhost:4321`). External link availability is intentionally outside the release gate.

`npm run format` and `npm run format:check` cover project automation, workflows, `AGENTS.md`, `CONTRIBUTING.md`, and selected tests. They deliberately do not reformat authored content or README; do not broaden that scope incidentally.

## Review, deployment, and notifications

1. Create a focused branch and state the user-visible effect in the PR.
2. Keep content, UI, infrastructure, and broad formatting changes separate unless they cannot be independently verified.
3. Add or update tests for behavior changes. Keep any durable policy rationale reviewable in the changed code or root documentation.
4. Run the narrowest applicable checks, then the required matrix above.
5. Request review with changed paths, commands run, warnings, and intentional exceptions.

Pull requests run verification only, and a superseded pull-request run is cancelled. Master runs queue instead: a cancelled master run would lose its subscriber notification permanently, not just delay it.

A successful `master` verification deploys GitHub Pages. Two jobs then hang off a successful deployment, independently of each other: `purge` clears the Cloudflare cache so list pages pick up the deploy immediately, and `notify` prepares/sends Buttondown updates. Repository secrets: `BUTTONDOWN_API_KEY`, plus `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID`. Each job explains itself and skips rather than failing when its credentials are absent. Local `npm run notify:buttondown` is dry-run by default; `--apply` requires explicit owner authorization.

## Safety boundaries

Do not commit API keys, credentials, subscriber data, local personal material, generated output (`dist/`, `.astro/`, `artifacts/`, `output/`, `viz/`), or screenshots containing sensitive information. Do not force-push, deploy, change GitHub secrets, or send subscriber communication without owner confirmation.
