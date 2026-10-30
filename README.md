# liyuk.github.io

Personal site for writing, research, consulting, projects, and photography — bilingual, built with Astro and deployed to Cloudflare Pages. The site assistant answers questions from published articles and links to its sources.

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
runs the full publish gate (format + content/image/column audits + tests + build + SEO/GEO/link audits) via a pre-push hook. Pull requests run the same verification; a successful push to `master` is verified, deployed to Cloudflare Pages, then checked for Buttondown notifications by `.github/workflows/deploy.yml`.

```sh
git commit -m "publish: ..."
git push                # publish:check runs automatically; push is blocked on failure
```

Skip the gate in an emergency with `git push --no-verify`. Personal workflow notes may live under local `docs/`, but they are ignored by Git and are not repository contracts.

The site is bilingual. Chinese is the source of truth. Published Chinese files use `translationStatus: original`, published English files use `translationStatus: reviewed`, and only unpublished English files may use `translationStatus: draft`. Writing, projects, galleries, and current research entries require an English sibling before publication; English archives and RSS remain English-only. `npm run audit:content` enforces these rules. The English UI shell lives in `src/i18n/index.mjs`. API secrets never belong in this repository.

The main blog is hosted on Cloudflare Pages, and GitHub Pages deployment is disabled for this repository. Independent project demos continue to use their own repositories' GitHub Pages settings and URLs such as `https://liyuk.github.io/<repository>/`.

## Subscriber notifications (Buttondown)

After Cloudflare Pages deploys successfully, the `notify` job in `.github/workflows/deploy.yml` diffs the pushed content and sends a short "new post" email (title + summary + link) through `scripts/notify-buttondown.mjs`. It only notifies newly added published entries or `draft: true → false` transitions; ordinary edits to already published entries do not trigger a new-post email. This sequencing prevents a subscriber email from preceding a failed deployment. Pull-request verification can be superseded; deploy and notify jobs serialize completed deployments independently. A notification failure remains visible and can be retried without rolling back the deployed site; existing emails are matched by subject and canonical URL; legacy subject-only records remain compatible.

Set these values under repository Settings → Secrets and variables → Actions. The Cloudflare Pages project must have automatic production deployments disabled so the verified GitHub Actions build is the one that gets deployed. Keep the Git integration connected if you want Cloudflare preview deployments.

| Kind   | Name                     | Value                                                                 |
| ------ | ------------------------ | --------------------------------------------------------------------- |
| Secret | `BUTTONDOWN_API_KEY`     | Buttondown API key                                                    |
| Secret | `CLOUDFLARE_API_TOKEN`   | Current-account token with Cloudflare Pages Edit, Workers Scripts Edit, Vectorize Edit, and Workers AI Read permissions |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID                                                  |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | Exact name of the Cloudflare Pages project                           |

The Buttondown key configured in Cloudflare is not visible to GitHub Actions. `CLOUDFLARE_ZONE_ID` is no longer needed because the workflow deploys directly to Pages rather than purging the zone cache.

The vector sync and Pages deployment use the same Actions token. A Pages-only token cannot sync Vectorize. If sync fails with HTTP 401/403, check the token's validity, account resource scope, and the three permissions above ([Cloudflare permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/), [Workers AI inference permissions](https://developers.cloudflare.com/api/resources/ai/methods/run/)). Editing an existing token's permissions does not require replacing its secret value. Local Wrangler OAuth login and Pages runtime bindings do not grant permissions to the Actions token. After correcting permissions, rerun the failed workflow jobs; the verified build is retained for one day. A sync failure deliberately blocks production deployment and subscriber notification. Successful preview deployments do not prove that production was updated: check the production deployment's commit and the public article URL.

The site assistant runs as a Cloudflare Pages Function at `POST /api/chat`; it does not need a separate Worker. Set the `GEMINI_API_KEY` runtime secret in the Cloudflare Pages project for both Production and Preview environments. It retrieves passages with the static keyword index and Cloudflare Vectorize, fuses both rankings, and streams the grounded Gemini answer to the browser. The `VECTOR_INDEX` binding and `AI` embedding binding are defined in `wrangler.jsonc`. After a verified production build, `scripts/sync-chat-vectors.mjs` embeds only new or changed passages, removes vectors for passages no longer published, and waits for Vectorize to process the write before deployment. The deploy job caches a local content-hash manifest; on the first run or after changing indexes, it reconciles against Vectorize directly. Configure `CLOUDFLARE_API_TOKEN` with Pages deploy, Workers AI, and Vectorize write permissions. The index name in `wrangler.jsonc` is also used by the sync script. The static chat index contains only published writing, research, consulting, and project entries.

Article comments and likes use separate Pages Function interfaces backed by D1: `GET`/`POST /api/comments/{article-path}/` handles comment reads and submissions; a reply submission carries `replyToId`, the target comment's ID. `GET`/`PUT`/`DELETE /api/likes/{article-path}/` handles like counts and per-browser votes. The likes payload selects `targetType: "article"` or `targetType: "comment"` (with `targetId` for a comment). Production builds keep the existing Giscus discussions by default; set `PUBLIC_ENGAGEMENT_ENABLED=true` only for a preview build to render the native D1 interface. The `preview` Wrangler environment binds a separate test database, so preview deployments cannot write to production data. Set the `RATE_LIMIT_SALT` secret in the Pages Preview environment before deploying. Comments use an optional nickname (blank names receive a random anonymous alias) and are held for manual approval. Replies may target any approved comment, but all replies stay flat under the original top-level comment; `reply_to_id` records the exact target and the UI displays it as `@nickname`. Readers can like articles, comments, and replies once per browser token and target. Comments are limited to five submissions per source IP per fixed hourly window; likes are limited to five changes per IP per fixed minute window. Fixed windows can allow a brief burst across a window boundary. Expired rate-limit counters are pruned during later requests. Existing GitHub discussions are retained and are not imported into D1. Enabling this system in production later requires a separate production D1 database, migration, secret, and explicit rollout decision. Readers can optionally select email reply notifications; addresses are stored only for opted-in comments and are never returned by the public comments API. A D1 trigger queues a notice only when a reply is approved, then the email Worker sends it from `hello@liyuk.com` on its one-minute schedule. Each message includes a confirmation step to unsubscribe, which removes that comment’s stored address.

The Pages Functions send owner notifications for new comments and newly added article, comment, or reply likes through a private service binding to `workers/email-notifier/`. Notification delivery runs after the D1 operation and cannot fail the reader's request. The notifier sends through Alibaba Mail SMTP over TLS on port 465 from `hello@liyuk.com` to `likun.liyuk@gmail.com`. Set the Alibaba Mail third-party client security password as the `SMTP_PASSWORD` secret on the `liyuk-email-notifier` Worker; never commit it or place it in chat. The deploy workflow publishes the notifier before deploying Pages, and its API token needs Workers Scripts Edit.

To review comments, query `SELECT id, article_key, parent_id, reply_to_id, nickname, body, created_at FROM comments WHERE status = 'pending' ORDER BY created_at DESC;`, then approve with `UPDATE comments SET status = 'approved' WHERE id = '<id>' AND status = 'pending';`. To remove a top-level comment and its replies, delete both levels with `DELETE FROM comments WHERE id = '<id>' OR parent_id = '<id>';`; to remove a single reply, delete by its own ID. Replies that targeted a deleted reply remain in the thread and lose only their `@nickname` reference.

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
