---
name: write-gallery
description: Use when drafting a new gallery-collection entry (a photo album under src/content/galleries/) from scratch, including choosing which images to include and writing their alt/caption text. Applies agent/category-guides/gallery.md's curation, alt-text, and consent rules from the first draft.
---

# Draft a `gallery` entry

Read `agent/category-guides/gallery.md` in full before drafting. This collection carries a different risk shape than prose collections: the writing surface is small (`title`, `description`, per-image `alt`/`caption`), but publishing a photo of an identifiable person is a harder-to-reverse disclosure than a paraphrased detail in an essay, so the consent check is not optional and not deferrable.

## Before drafting

1. Run `npm run new:gallery` to scaffold the entry (requires macOS `sips` and `cwebp`; it writes optimized WebP assets into `public/images/galleries/` and leaves source files untouched — see `AGENTS.md`).
2. Decide which images actually earn a place in the set. More images is not better — see the curation section in `agent/category-guides/gallery.md`.
3. For every image, confirm: is anyone other than the author identifiable in the frame, and if so, has that person consented to being published, not just photographed?

## Drafting

1. Pick `cover`: the single image that best represents the set, not simply the first one taken.
2. Write `title` and `description` in the native-human voice default (`agent/writing-style.md`) — plain and specific, not promotional copy.
3. For each image, write `alt` as a factual description of what's literally visible (subject, pose/action, only as much setting as helps a screen-reader user picture it). Do not reuse `caption` as `alt`.
4. Where it adds something, write `caption` as a short, personal read of the moment — one beat, no forced punchline. Leave it empty rather than filling it with a generic line.
5. If any image needs consent not yet obtained, keep the whole gallery at `draft: true` rather than dropping only that image and publishing the rest.

## De-identification pass (mandatory, before this leaves draft)

- No identifiable person other than the author appears without explicit consent to publish.
- `alt`/`caption`/`description` disclose no more than necessary to understand the image — no incidental naming of a person, employer, or location the photo doesn't already make obvious.
- `cover` and every `images[]` entry resolve to real files under `public/images/galleries/<slug>/`.

## Handoff

Same downstream sequence as any collection: translation via `agent/translation-spec.md` / `.claude/skills/xinda-ya-translation` (gallery's `alt`/`caption`/`description` are all translated, not copied verbatim) → `.claude/skills/content-review` before `draft: false`. `content-review`'s public-risk checklist re-verifies the consent pass independently — passing this skill's pass does not skip that step.
