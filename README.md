# liyuk.github.io

Chinese-first personal publication for writing, projects, research, and photography.

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

English is intentionally not generated during deploys. A future explicit translation
workflow will create a reviewable English Markdown draft from a published Chinese
article; API secrets never belong in this repository.

## Local development

```sh
npm install
npm run dev
```

## Legacy site

The static site replaced by this build is preserved by the Git tag `legacy-static-site-2026-08-14`.
Pre-migration source documents and image sources (unique files not rebuildable from the
tag) are archived outside the repo; see the local (git-ignored) `docs/` notes for where.
