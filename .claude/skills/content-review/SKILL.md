---
name: content-review
description: Use as the final pre-publish gate for any src/content/ entry, right before flipping draft to false or running npm run publish. Orchestrates voice/AI-detection, translation quality, category-fit, and public-risk checks into one go/no-go report — this is the human-facing counterpart to npm run publish:check, covering the judgment calls that script deliberately leaves to a person.
---

# Content review (pre-publish gate)

`npm run publish:check` verifies what a script can verify: schema, bilingual metadata consistency, image references, column order, tests, build, SEO, and internal links. It also runs `audit:content`'s pattern-based checks (secret-shaped strings, `localhost` examples, tag registry, translation-status combinations). This skill covers everything that check deliberately leaves to human judgment — it does not replace `publish:check`, it runs alongside it, and both must be clean before publish.

## Sequence

Run these in order; a failure at an earlier step usually invalidates work done on a later one.

### 1. AI-signal and author's-voice pass

Run the matching writing skill for the collection if the piece was drafted with one (`.claude/skills/write-writing`, `write-research`, `write-projects`, `write-consulting`, or `write-gallery`), then run `.claude/skills/humanize-writing` for an existing Chinese draft. Read the whole piece, not only the passages that changed. Do not proceed on a draft that either skill flagged and left unfixed. If no matching writing skill was used, say so explicitly in the final report and perform the same material, reader-value, and distinctiveness checks manually.

Keep these two judgments separate and report both: (a) does the prose still have recognizable AI-like signals such as smooth generic connective tissue, forced symmetry, abstract claims, uniform rhythm, or over-packaged structure; and (b) does it still sound like the author's voice described in `agent/writing-style.md` — concrete experience, visible thinking, personal anchors, chosen phrasing, productive irregularity, and honest boundaries? Passing an AI-signal check is not evidence that the author's voice survived. Do not claim an AI-detector percentage that was not measured.

### 2. Dimensional-wall pass

Check whether the article stays inside its reader-facing scene and register. Flag as **no-go** any unnecessary exposure of the writing or review process, such as mentioning prompts, AI generation, “this article,” the author's drafting instructions, an invented-example disclaimer, editorial notes, or explaining to the reader how the argument was constructed. Also flag narrator-as-editor interruptions that ask the reader to inspect the text as a text rather than engage with the subject. A first-person aside is not automatically a violation: keep it when it belongs to the author's actual experience and does not break the reading scene. Repair the passage by returning to the subject matter, or deliberately label a genuine editorial note outside the article body.

### 3. Reader-value pass

Read the article as its intended reader, temporarily setting aside the author's intent. Write down the concrete answer to all three questions:

- What can a reader understand more clearly after reading this?
- What can a reader judge, decide, or do differently afterward — what is the practical takeaway, if any?
- Which example, criterion, procedure, or boundary makes that takeaway usable rather than merely agreeable?

If the answers are vague, interchangeable with a generic article on the same topic, or amount only to “认同一个观点,” the gate is **no-go**. Revise the material, scope, examples, or ending before publication. A literary or exploratory piece may have an open question instead of an instruction, but it still needs a specific reader consequence.

### 4. Distinctiveness pass

Review the article on its own terms, not only for AI-like language. Identify the article's non-obvious contribution: a firsthand observation, unusual comparison, specific mechanism, earned distinction, counterexample, constraint, or judgment that a competent generic article would likely miss. Test it against the obvious existing explanation or alternative. If removing the author's concrete material leaves a generic summary, or if the central claim could be swapped into another article without changing the body, the gate is **no-go** until the article has a more clearly owned angle. Do not manufacture novelty or add personal details that are not true.

This pass is separate from the AI-signal and author's-voice pass: a piece can sound like the author and still be derivative, or be distinctive while retaining AI-like prose. Report all three findings independently.

### 5. Category fit

Check the entry against its collection's guide (`agent/category-guides/writing.md`, `research.md`, `projects.md`, `consulting.md`, or `gallery.md`) and, if it was drafted with the matching `write-*` skill, confirm nothing drifted since. Specifically:

- Does it have the comparative/prior-art grounding that collection expects (required for `research`, expected for `project`, situational for `writing`, situational for `consulting`)?
- Does every diagram answer a question the prose does not, and do `zh.md` and `en.md` share the same nodes and relationships (`agent/editorial-rules.md`)?
- Are collection-specific frontmatter requirements satisfied (`research`'s `version`/`status`/URL requirement, `project`'s subtype-appropriate fields, `consulting`'s de-identified `guest`, `gallery`'s `alt` describing what's actually visible rather than restating `caption`)?

### 6. Translation quality (if an `en.md` exists or is being published alongside)

Run `.claude/skills/xinda-ya-translation` in review mode. A translation stuck at `translationStatus: draft` is fine for an unpublished entry but blocks a collection with no fallback exception (`writing`, `consulting`, `project`, `gallery` — see `agent/adr/0002-bilingual-fallback-policy.md`) from being marked published without becoming `reviewed`.

### 7. Public-risk checklist (human judgment `audit:content` cannot make)

`audit:content` catches secret-shaped strings and known patterns mechanically. This step is for what requires judgment about a specific person's situation:

- Is any real person, company, or client identifiable from the combination of details present, even if no single detail is identifying on its own?
- Has a first-hand personal account been written in a way that could be mistaken for a research conclusion, or vice versa?
- Is every external citation (`citationUrls`, inline links) something that's actually reachable and says what the piece claims it says?
- For `consulting`: does the de-identification pass in `agent/category-guides/consulting.md` hold up — not just "no real name," but no re-identifying combination of company/timeline/team/relationship details?
- For `gallery`: is every identifiable person other than the author confirmed as consenting to publication (not just to being photographed), per `agent/category-guides/gallery.md`?
- Is a `localhost`/`127.0.0.1` example (if `audit:content` flagged one) confirmed as an intentional reader-facing example, not a leaked private address (see the `neo-matrix` precedent in `agent/architecture.md`)?
- Does the translation status accurately reflect review state — no published entry sitting at `translationStatus: draft`?

### 8. Final report

State explicitly, as a go/no-go:

1. Whether `npm run publish:check` has been run and passed (this skill doesn't replace running it).
2. AI-signal status and author's-voice status from step 1, including which skill was run, what AI-like patterns were found, what voice evidence was preserved or lost, and what specifically changed if anything was flagged. Do not claim an AI-detector percentage that was not measured.
3. Dimensional-wall findings from step 2: whether the article stays in its reader-facing scene and whether any process/meta disclosure was repaired.
4. Reader-value findings from step 3: the concrete learning, action/judgment consequence, and supporting material.
5. Distinctiveness findings from step 4: the article's owned/non-obvious angle and the generic version it successfully avoids.
6. Category-fit findings from step 5.
7. Translation status from step 6, if applicable.
8. Any public-risk finding from step 7, even a minor one — surface it rather than silently deciding it's fine.
9. An explicit **GO / NO-GO** recommendation. Any unresolved AI-signal, voice, dimensional-wall, reader-value, distinctiveness, category, translation, or public-risk issue is **NO-GO**; only a GO permits the separate owner approval and publish command.

## What this skill does not do

It does not flip `draft` to `false`, run `npm run publish`, commit, or push — those stay human confirmation points per `AGENTS.md`. A `GO` here is one of the preconditions that `npm run publish <slug> -- --confirm-editorial-review` asserts; passing that flag is the owner's action, never this skill's. It does not replace running `publish:check`; it reports on the parts that check can't evaluate.
