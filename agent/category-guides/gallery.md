# Category guide: `gallery`

The `gallery` collection is photo albums, not prose essays — `src/content/galleries/<slug>.md`, schema in `src/content.config.ts`. It has no `.strict()` schema and no `type` field; the writing surface is small (`title`, `description`, per-image `alt`/`caption`), but it carries its own privacy risk and its own voice question, so it still needs a guide even though it will never be a five-section essay.

## What this collection is

A curated set of photos under one `slug`, with a `cover` and one or more `images`. `column` membership is allowed (`writing`, `consulting`, and `gallery` are the only collections that use columns — see `agent/architecture.md`), so a gallery can also be a chapter in a reading path, not only a standalone album.

## Curation, not archiving

Don't publish every frame from a shoot. Include only images that earn a place: a genuine moment, a distinct angle, a detail the set would be incomplete without. A gallery of near-duplicates reads as an unfiltered photo dump, not a curated set — the same "don't include everything, include what moves the piece forward" discipline `agent/category-guides/consulting.md` applies to dialogue applies here to frames.

`cover` should be the single image that best represents the set, not just the first one taken.

## Writing `title` and `description`

- `title` names the subject plainly — a person, place, pet, or theme — not a manufactured hook.
- `description` is one sentence that tells a reader what they're about to look at, in the native-human voice default (`agent/writing-style.md`): plain, specific, not promotional. "家里的猫毛毛，坐在椅子上抬头，好奇地打量四周" is the calibration — concrete subject, concrete action, no adjective doing work the photo should do.

## Writing `alt`

`alt` is an accessibility requirement, not a caption draft — a screen-reader user relies on it to know what's actually in the frame:

- Describe what is literally visible: subject, pose/action, and only as much setting as helps someone picture it. "毛毛坐在椅子上，抬头看向镜头" is the right level of detail; do not pad it with mood words the image doesn't establish ("温柔地"、"惬意地") unless that quality is visually evident, not assumed.
- Do not reuse the `caption` text verbatim as `alt` — they answer different questions (what's in the image vs. what it means to the author).
- Keep `alt` factual even when `caption` is more personal or reflective.

## Writing `caption` (optional)

`caption` is where the native-human voice actually shows up — a short first-person read of the moment, not ad copy. "坐在椅子上抬头，像是在问你怎么才回来" is the right register: specific, a little personal, one beat, no forced punchline. Skip `caption` entirely rather than filling it with a generic line just because the field exists.

## De-identification and consent (real people in frame)

The same principle in `agent/category-guides/consulting.md`'s de-identification section applies here with higher stakes, because a photo identifies someone far more directly than a paraphrased dialogue does:

- A photo of the author, the author's own pets, or the author's own possessions needs no special review.
- A photo where another identifiable person is the subject or clearly recognizable (face, name-bearing object, identifiable location tied to them) needs that person's explicit consent to publish — consent to be photographed is not consent to be published on a public site.
- When consent exists but full context isn't appropriate to disclose, keep `alt`/`caption`/`description` limited to what's necessary to understand the image; don't let a caption name a person, employer, or location that the photo itself doesn't already make obvious and that isn't needed for the image to make sense.
- If a set mixes frames that are fine to publish with frames that need consent not yet obtained, hold the whole gallery in `draft: true` rather than partially publishing.

## Pre-publish checklist

- Every `images[]` entry has an `alt` that describes what's actually visible, not a restated `caption` or a placeholder.
- Declared `width`/`height` match the actual exported file, not a placeholder guess — a mismatch makes the browser reserve the wrong layout space before the image loads.
- `cover` references an image `id` present in `images` and is genuinely the set's best representative frame (schema also enforces the reference).
- `title`/`description` are plain and specific, not promotional.
- Any identifiable person other than the author has given consent to publish, and disclosure in `caption`/`description` is minimized accordingly.
- `slug`, `tags`, and any `column` are registered per `src/lib/taxonomy.ts` conventions.
- English sibling (`<slug>.en.md`) exists and is 信达雅-checked before `draft: false` — gallery has no bilingual fallback exception (`agent/adr/0002-bilingual-fallback-policy.md`).
- Passed `.claude/skills/content-review` before it enters the finalize/publish flow.
