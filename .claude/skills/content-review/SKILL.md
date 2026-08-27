---
name: content-review
description: Use as the final pre-publish gate for any src/content/ entry, right before flipping draft to false or running npm run publish. Orchestrates voice/AI-detection, translation quality, category-fit, and public-risk checks into one go/no-go report — this is the human-facing counterpart to npm run publish:check, covering the judgment calls that script deliberately leaves to a person.
---

# Content review (pre-publish gate)

`npm run publish:check` verifies what a script can verify: schema, bilingual metadata consistency, image references, column order, tests, build, SEO, and internal links. It also runs `audit:content`'s pattern-based checks (secret-shaped strings, `localhost` examples, tag registry, translation-status combinations). This skill covers everything that check deliberately leaves to human judgment — it does not replace `publish:check`, it runs alongside it, and both must be clean before publish.

## Sequence

Run these in order; a failure at an earlier step usually invalidates work done on a later one.

### 1. Voice and AI-detection

Run `.claude/skills/humanize-writing` if it hasn't already been applied to the current draft. Do not proceed on a draft that skill flagged and left unfixed.

### 2. Category fit

Check the entry against its collection's guide (`agent/category-guides/writing.md`, `research.md`, `projects.md`, `consulting.md`, or `gallery.md`) and, if it was drafted with the matching `write-*` skill, confirm nothing drifted since. Specifically:

- Does it have the comparative/prior-art grounding that collection expects (required for `research`, expected for `project`, situational for `writing`, situational for `consulting`)?
- Are collection-specific frontmatter requirements satisfied (`research`'s `version`/`status`/URL requirement, `project`'s subtype-appropriate fields, `consulting`'s de-identified `guest`, `gallery`'s `alt` describing what's actually visible rather than restating `caption`)?

### 3. Translation quality (if an `en.md` exists or is being published alongside)

Run `.claude/skills/xinda-ya-translation` in review mode. A translation stuck at `translationStatus: draft` is fine for an unpublished entry but blocks a collection with no fallback exception (`writing`, `consulting`, `project`, `gallery` — see `agent/adr/0002-bilingual-fallback-policy.md`) from being marked published without becoming `reviewed`.

### 4. Public-risk checklist (human judgment `audit:content` cannot make)

`audit:content` catches secret-shaped strings and known patterns mechanically. This step is for what requires judgment about a specific person's situation:

- Is any real person, company, or client identifiable from the combination of details present, even if no single detail is identifying on its own?
- Has a first-hand personal account been written in a way that could be mistaken for a research conclusion, or vice versa?
- Is every external citation (`citationUrls`, inline links) something that's actually reachable and says what the piece claims it says?
- For `consulting`: does the de-identification pass in `agent/category-guides/consulting.md` hold up — not just "no real name," but no re-identifying combination of company/timeline/team/relationship details?
- For `gallery`: is every identifiable person other than the author confirmed as consenting to publication (not just to being photographed), per `agent/category-guides/gallery.md`?
- Is a `localhost`/`127.0.0.1` example (if `audit:content` flagged one) confirmed as an intentional reader-facing example, not a leaked private address (see the `neo-matrix` precedent in `agent/architecture.md`)?
- Does the translation status accurately reflect review state — no published entry sitting at `translationStatus: draft`?

### 5. Final report

State explicitly, as a go/no-go:

1. Whether `npm run publish:check` has been run and passed (this skill doesn't replace running it).
2. Voice/AI-detection status from step 1, with what specifically changed if anything was flagged.
3. Category-fit findings from step 2.
4. Translation status from step 3, if applicable.
5. Any public-risk finding from step 4, even a minor one — surface it rather than silently deciding it's fine.
6. An explicit recommendation: ready for the site owner to approve publish, or specific items to fix first.

## What this skill does not do

It does not flip `draft` to `false`, run `npm run publish`, commit, or push — those stay human confirmation points per `AGENTS.md`. It does not replace running `publish:check`; it reports on the parts that check can't evaluate.
