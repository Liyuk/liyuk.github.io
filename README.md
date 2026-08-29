# liyuk.github.io

Personal site for writing, research, projects & photography — bilingual, built with Astro.

## Architecture at a glance

The repository is a static Astro site with five content collections. The source of truth is the schema and shared helpers in `src/content.config.ts` and `src/lib/`; pages should consume those helpers instead of duplicating routing or filtering rules.

| Collection   | Source directory                          | Public route                 | Content shape                     |
| ------------ | ------------------------------------------ | ----------------------------- | ---------------------------------- |
| `writing`    | `src/content/writing/YYYY/MM/<slug>/`      | `/writing/<dated-slug>/`     | essays, notes, case studies        |
| `research`   | `src/content/research/YYYY/MM/<slug>/`     | `/research/<dated-slug>/`    | papers and research notes          |
| `project`    | `src/content/projects/YYYY/MM/<slug>/`     | `/projects/<dated-slug>/`    | projects and works                 |
| `consulting` | `src/content/consulting/YYYY/MM/<slug>/`   | `/consulting/<dated-slug>/`  | edited career-consulting sessions  |
| `gallery`    | `src/content/galleries/<slug>.md`          | `/photos/<slug>/`            | image galleries                    |

Engineering invariants live in `AGENTS.md` and `CONTRIBUTING.md`; editorial voice, per-collection writing structure, translation standard, and design decisions live in [`agent/`](./agent/README.md), operationalized by the Claude Code skills in `.claude/skills/`. Read `agent/README.md` before drafting or reviewing any `src/content/` entry.

`project` is the collection name but its public route is `/projects/`; use `src/lib/content-paths.ts` for every content URL. Locale-free source paths use `zh.md` and `en.md`; English routes add the `/en/` prefix, while the default Chinese routes do not. `src/lib/taxonomy.ts` owns registered tags and columns, and `src/i18n/index.mjs` owns shared UI copy.

At build time, content flows through schema validation, collection filters, Astro rendering, sitemap generation, and Pagefind indexing. Draft content is never part of the production build, search index, RSS, or sitemap. In development, only direct detail routes for real drafts are previewable; they are `noindex`, while lists and archives remain published-only.

Content is created interactively, gated by a pre-push check, then deployed automatically.

```sh
npm run new:post        # create a writing / research / consulting / project entry (draft by default)
npm run new:gallery     # create a photography gallery (drops images into the terminal)
npm run publish <slug> -- --confirm-editorial-review   # publish the sibling pair; the flag is the editorial hard stop
```

All new content is `draft: true`. Publishing goes through `npm run publish <slug> -- --confirm-editorial-review`, which refuses to flip a draft public without that flag; the flag asserts that the matching writing skill, `content-review`, and owner approval are all done. Pushing to `master`
runs the full publish gate (format + content/image/column audits + tests + build + SEO/GEO/link audits) via a pre-push hook. Pull requests run the same verification; a successful push to `master` deploys through `.github/workflows/deploy.yml`.

```sh
git commit -m "publish: ..."
git push                # publish:check runs automatically; push is blocked on failure
```

Skip the gate in an emergency with `git push --no-verify`. Personal workflow notes may live under local `docs/`, but they are ignored by Git and are not repository contracts.

The site is bilingual. Chinese is the source of truth. Published Chinese files use `translationStatus: original`, published English files use `translationStatus: reviewed`, and only unpublished English files may use `translationStatus: draft`. Writing, projects, galleries, and current research entries require an English sibling before publication; English archives and RSS remain English-only. `npm run audit:content` enforces these rules. The English UI shell lives in `src/i18n/index.mjs`. API secrets never belong in this repository.

## Subscriber notifications (Buttondown)

After GitHub Pages deploys successfully, the `notify` job in `.github/workflows/deploy.yml` diffs the pushed content and sends a short "new post" email (title + summary + link) through `scripts/notify-buttondown.mjs`. It only notifies newly added published entries or `draft: true → false` transitions; ordinary edits to already published entries do not trigger a new-post email. This sequencing prevents a subscriber email from preceding a failed deployment. Verification runs may be cancelled for newer pushes, but deploy and notify jobs are queued independently so a completed deployment's notification is not cancelled by a later verify run. A notification failure remains visible and can be retried without rolling back the deployed site; existing emails are matched by subject and canonical URL; legacy subject-only records remain compatible.

Set the API key as a repository secret so it never lands in git:

```sh
# Repository settings → Secrets and variables → Actions → New repository secret
#   Name:  BUTTONDOWN_API_KEY
#   Value: your Buttondown API key (https://app.buttondown.com/settings#api-key)
```

Test locally without sending (dry-run prints what would be emailed):

```sh
npm run notify:buttondown          # preview (no network)
# npm run notify:buttondown -- --apply   # actually send (requires the key)
```

## Verification commands

Use Node `24.18.0` from `.node-version` and `npm ci` so local dependencies and the GitHub Actions graph match. The main checks are:

```sh
npm test                 # pure Node contracts and audit tests
npm run check            # Astro schema and type diagnostics
npm run build            # production HTML, sitemap, and Pagefind output
npm run publish:check    # engineering gate; content-review GO + owner approval remain required
npm run test:e2e:ci      # browser smoke against the existing dist/ build
npm run test:e2e:fresh   # build, then browser smoke
npm run test:a11y        # axe scan against the existing dist/ build
npm run test:a11y:fresh  # build, then axe scan
npm run test:draft:dev   # isolated Astro dev server and draft-route smoke
```

`publish:check` does not start a browser or install Chromium; CI builds once in `publish:check`, then runs `test:draft:dev` and `test:browser:ci` against the intended development and existing `dist/` contracts. Use the `:fresh` browser commands when running those checks outside the publish gate. `npm run test:e2e` is the interactive variant and expects an already running server at `E2E_BASE` (default `http://localhost:4321`). Build-dependent audits such as `audit:seo` and `audit:links` must run after a fresh `npm run build`.

Markdown entries support the following out of the box. A copy-paste demo lives in
`src/content/writing/_template.md`.

| Capability  | Syntax                    | Notes                                       |
| ----------- | ------------------------- | ------------------------------------------- |
| Code blocks | ` ```ts ` … ` ``` `       | Shiki syntax highlighting, light/dark aware |
| Mermaid     | ` ```mermaid ` … ` ``` `  | Rendered to inline SVG at build time        |
| Images      | `![alt](./images/x.webp)` | Auto-optimized (WebP, resized)              |
| LaTeX math  | `$E=mc^2$` / `$$…$$`      | Rendered by KaTeX at build time             |

Only `mermaid` is excluded from syntax highlighting; every other fenced block gets
Shiki highlighting. Frontmatter `hero` / `cover` images and Mermaid/KaTeX are all
rendered statically — no client-side JavaScript is shipped for them.

## Draft preview in development

Run the Astro development server and open a draft's locale-free detail URL directly:

```sh
npm run dev -- --host 127.0.0.1
# http://127.0.0.1:4321/writing/2026/08/dsh-plugin-architecture-stability/
```

Development-only draft detail pages are not listed in public archives, are marked `noindex`, and are never emitted by `npm run build`. Template files are excluded from this preview path. If a page returns `Tsconfig not found astro/tsconfigs/strict`, reinstall dependencies with `npm ci` before debugging the content; the error means Astro is not resolvable locally and is not a draft-content error.

## Local notes

The `docs/` directory is intentionally ignored. It contains personal workflow notes, editorial plans, and source material that are not part of the repository or its automated checks.

## Legacy site

The static site replaced by this build is preserved by the Git tag `legacy-static-site-2026-08-14`.
Pre-migration source documents and image sources (unique files not rebuildable from the
tag) are archived outside the repo; see the local (git-ignored) `docs/` notes for where.
