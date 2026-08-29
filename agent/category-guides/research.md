# Category guide: `research`

`research` entries are papers and research notes — the collection's schema (`src/content.config.ts`) requires a `version`, a `status` (`preprint` / `published` / `in-progress`), and at least one of `repositoryUrl` / `paperUrl`. This is the site's highest evidentiary bar: readers arriving here are evaluating claims, not just reading a perspective, so the standard is stricter than `writing`.

## Evidentiary standard

- **Distinguish observed fact from inference from speculation, explicitly, sentence by sentence where it matters.** A reader must always be able to tell whether a claim is something the author directly measured or observed, something reasoned from that observation, or a hypothesis offered for future testing.
- **Every non-obvious claim needs a source or a method.** Use `citationUrls` for external sources; for the author's own data or experiment, state the method concretely enough that a skeptical reader could see how it could fail, not just the conclusion.
- **State uncertainty once, plainly, and let the confident parts stay confident.** Don't hedge every sentence — see `agent/editorial-rules.md`'s AI-detection section on hedges built into the sentence rather than bolted onto it.
- **Don't retrofit a conclusion.** If the evidence only supports a narrower or more conditional claim than the one that would make a better headline, publish the narrower claim.
- **Negative or null results are reportable.** A research note that ruled something out is not a failed piece.

## Competitive and prior-art grounding (required, not optional, for this collection)

Before a research piece is considered draft-complete, it needs an explicit pass identifying what already exists on the same question: prior work, competing frameworks, or the "obvious" alternative explanation a knowledgeable reader would raise. State briefly how this piece's claim differs from, extends, or contradicts that prior art. A research note that reads as if it's the first thing anyone has ever thought about the topic — when it demonstrably isn't — undermines its own credibility more than a competitor comparison would.

This does not mean padding the piece with a literature-review section for its own sake; a few sentences naming the closest existing view and the actual point of departure is usually enough.

For market, product, approach, or industry questions, follow the seven-step sequence in `agent/editorial-rules.md` (§ Analytical evidence sequence). Research is the collection where its later steps are least optional: the dialectical challenge in step 6 and the bounded judgment in step 7 are what separate a research note from an opinion piece, and unlike in `writing`, the scope and limitations that come out of them usually do belong in the visible prose.

## Structure

Research pieces don't follow the essay skeleton in `agent/writing-style.md` as tightly — formal register, method before conclusion, and explicit scope/limitations are more load-bearing here than the negation-reframe move. Still: cash claims out into concrete criteria where possible, and keep prose as the default (tables only for content that's genuinely tabular data).

## Drafting order

Same Chinese-first sequencing as `writing.md`, with one difference: `research` may publish without an English sibling yet (the documented fallback in `agent/adr/0002-bilingual-fallback-policy.md`) — but that's a visible, tracked exception, not a default to lean on. Run `.claude/skills/humanize-writing` and then `.claude/skills/content-review` before `draft: false`, same as any other collection.

## Pre-publish checklist

- Every claim is tagged, at least implicitly by its phrasing, as observed / inferred / speculative.
- `citationUrls` covers claims not sourced from the author's own data.
- The prior-art / competing-view pass is present, even briefly.
- Method is concrete enough to be second-guessed, not just a conclusion asserted.
- `status` and `version` reflect the actual state of the work, not aspirational status.
- If publishing without an English sibling, that's a deliberate, acknowledged use of the research fallback — not an oversight `audit:content` happened not to catch yet.
