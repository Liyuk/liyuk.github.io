# liyuk.github.io

Personal site for writing, research, projects & photography — bilingual, built with Astro.

## Publishing

Content is created interactively, gated by a pre-push check, then deployed automatically.

```sh
npm run new:post        # create a writing / research / project entry (draft by default)
npm run new:gallery     # create a photography gallery (drops images into the terminal)
npm run publish <slug>  # flip a drafted entry to published (draft: false)
```

All new content is `draft: true` — flip it to `false` (or run `npm run publish <slug>`) to publish. Pushing to `master`
runs the full publish gate (image audit + tests + build) via a pre-push hook, then
deploys through `.github/workflows/deploy.yml`.

```sh
git commit -m "publish: ..."
git push                # publish:check runs automatically; push is blocked on failure
```

Skip the gate in an emergency with `git push --no-verify`. Full workflow, including
field-by-field details for each content type, lives in `docs/publishing-workflow.md`.

The site is bilingual. Chinese is the source of truth; every published article has an
English `en.md` sibling served under the same URL with the `/en/` prefix. English
translations are machine-generated and marked `translationStatus: draft` until
human-reviewed. Translation conventions live in `docs/translation-spec.md`; the
English UI shell lives in `src/i18n/index.mjs`. API secrets never belong in this
repository.

## Content capabilities

Markdown entries support the following out of the box. A copy-paste demo lives in
`src/content/writing/_template.md`.

| Capability | Syntax | Notes |
| ---------- | ------ | ----- |
| Code blocks | ```` ```ts ```` … ```` ``` ```` | Shiki syntax highlighting, light/dark aware |
| Mermaid | ```` ```mermaid ```` … ```` ``` ```` | Rendered to inline SVG at build time |
| Images | `![alt](./images/x.webp)` | Auto-optimized (WebP, resized) |
| LaTeX math | `$E=mc^2$` / `$$…$$` | Rendered by KaTeX at build time |

Only `mermaid` is excluded from syntax highlighting; every other fenced block gets
Shiki highlighting. Frontmatter `hero` / `cover` images and Mermaid/KaTeX are all
rendered statically — no client-side JavaScript is shipped for them.

## Local development

```sh
npm install
npm run dev
```

## Legacy site

The static site replaced by this build is preserved by the Git tag `legacy-static-site-2026-08-14`.
Pre-migration source documents and image sources (unique files not rebuildable from the
tag) are archived outside the repo; see the local (git-ignored) `docs/` notes for where.
