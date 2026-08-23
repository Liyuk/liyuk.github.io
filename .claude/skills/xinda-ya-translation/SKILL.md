---
name: xinda-ya-translation
description: Use when creating or reviewing an en.md translation for any content collection (writing, consulting, research, projects, galleries), or whenever asked whether an English version is ready to move from translationStatus draft to reviewed. Applies the mechanical rules in agent/translation-spec.md and checks the result against Yan Fu's 信达雅 standard from agent/editorial-rules.md — faithful, fluent, then elegant, in that priority order.
---

# 信达雅 translation review

This skill covers both producing a new `en.md` and reviewing one that already exists. It is referenced by `agent/editorial-rules.md` and `agent/translation-spec.md` — read both before using this skill; this file is the operational checklist that ties them together, not a restatement of either.

## Producing a new `en.md`

1. Confirm the `zh.md` is actually final (see the relevant `agent/category-guides/*.md` for that collection's drafting order) — never translate a Chinese draft that's still in flux.
2. Follow `agent/translation-spec.md` exactly for frontmatter: which fields translate, which copy verbatim, which need YAML quoting, and the `.strict()` key allowlist for `writing` and `consulting`.
3. Translate the body per `agent/translation-spec.md`'s body rules (code fences and math verbatim, links/images keep their target and translate only visible text, Mermaid keeps English labels already).
4. Set `translationStatus: draft` — a first-pass translation, however good, is not `reviewed` until it passes step 2 below.

## Reviewing a translation (draft → reviewed)

Read the `zh.md` and `en.md` side by side, section by section, and check in this priority order — a failure at a higher level is disqualifying even if everything below it is clean:

1. **信 (faithful)** — does the English carry the same claims, the same argument structure, and the same certainty level as the Chinese? Flag: anything added that isn't in the source; anything dropped; a hedge softened or hardened; a claim's scope quietly narrowed or widened.
2. **达 (fluent)** — does this read as English written by someone thinking in English? Flag: clause-for-clause structure copied from Chinese syntax even where an English writer would restructure; a sentence that's individually correct but unnatural in sequence; connective tissue that's a literal translation of a Chinese transition word rather than what an English piece would actually use there. Sentence-level restructuring (clause order, sentence splits/merges, connectives) is expected and encouraged here — see `agent/translation-spec.md`'s "Sentence-level freedom vs. structural fixity" section. What must NOT move: heading count/level/order, section order, or which claims appear.
3. **雅 (elegant)** — does the register match `agent/writing-style.md`: claims cashed out into concrete criteria, non-absolute hedges built into the sentence, the negation-reframe move preserved where the Chinese used it? A translation that flattens these into generic "translated technical writing" English has a 雅 gap even if 信 and 达 are both fine.
4. **Term glossing** — where the Chinese relies on institutional shorthand or a proper noun (job-level labels, company-size shorthand, platform names) that an English-only reader has no context for, is there a short descriptive gloss per `agent/translation-spec.md`'s "Term glossing" section? Flag both directions: a load-bearing term left opaque, and a gloss that oversteps into adding an opinion or claim the Chinese didn't make.

When 达 and 雅 trade off, prefer 达 — a translation nobody can follow is useless regardless of how elegant its individual sentences are underneath.

## What disqualifies `reviewed` status outright

- Any 信 failure (see above) — fix it before considering fluency or register at all.
- A skipped frontmatter transform from `agent/translation-spec.md` (wrong quoting, a translated field that should have been copied verbatim, or vice versa).
- A missing or wrong `translationKey`.
- An extra key in a `.strict()` collection's (`writing`, `consulting`) frontmatter that isn't in the current `src/content.config.ts` schema.

## Output

State explicitly: (1) whether the translation is ready for `translationStatus: reviewed`, (2) if not, the specific 信/达/雅 failures found with the passage they're in, and (3) any frontmatter mechanical error found. Do not flip `translationStatus` to `reviewed` yourself without the site owner's confirmation that the review is accepted — this is a human confirmation point per `AGENTS.md`.
