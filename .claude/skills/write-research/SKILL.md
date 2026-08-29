---
name: write-research
description: Use when drafting a new research-collection entry (paper or research note under src/content/research/) from scratch, or when asked to plan one before writing. Applies agent/category-guides/research.md's evidentiary standard and required prior-art pass from the first draft — this is the site's strictest content bar, higher than writing/consulting/projects.
---

# Draft a `research` entry

Research is where a reader is evaluating a claim, not just reading a perspective — the bar here is stricter than any other collection. Read `agent/category-guides/research.md` in full before drafting; this skill is the operational sequence for applying it.

## Before drafting

1. Read `agent/category-guides/research.md`.
2. Confirm the schema requirements this entry must satisfy: `version`, `status` (`preprint` / `published` / `in-progress`), and at least one of `repositoryUrl` / `paperUrl` (`src/content.config.ts`).
3. Run the evidence pass **before** writing the main argument. For a market, product, approach, or industry question, follow the seven-step sequence in `agent/editorial-rules.md` (§ Analytical evidence sequence) — read it there rather than from a summary. For a narrower research question, omit the stages that don't apply but preserve the principle: evidence and competing views must shape the claim before prose is fixed, and the dialectical challenge must happen before the conclusion is treated as final.

## Drafting

1. For every claim, keep straight in your own working notes (even if not literally labeled in the prose) whether it is: something directly observed/measured, something reasoned from that observation, or a hypothesis offered for future testing. The reader should be able to tell which is which from the writing itself.
2. State method concretely enough that a skeptical reader could see how it could fail — not just the conclusion. A method description that couldn't be second-guessed isn't a method description.
3. Populate `citationUrls` for every external source; for the author's own data, describe how it was gathered.
4. State uncertainty once, plainly, where it's real — then let the rest of the piece proceed with the confidence the evidence actually supports. Don't hedge every sentence, and don't let one honest caveat justify vagueness elsewhere.
5. If the evidence only supports a narrower or more conditional claim than the one that would make a more compelling headline, write the narrower claim. A null or negative result is a legitimate outcome to report as such.
6. Reference the prior-art pass from step 3 explicitly, even briefly — a sentence naming the closest existing view and this piece's actual point of departure from it.

## What NOT to do

Don't pad with a literature-review section for its own sake. Don't force `agent/writing-style.md`'s negation-reframe essay skeleton onto material that's fundamentally a method-then-findings structure — formal register and explicit scope/limitations carry more weight here than that rhetorical move.

## Handoff

Same downstream sequence as any collection: `.claude/skills/humanize-writing` → translation via `agent/translation-spec.md` / `.claude/skills/xinda-ya-translation` (or a deliberate, acknowledged use of the research Chinese-fallback exception in `agent/adr/0002-bilingual-fallback-policy.md`) → `.claude/skills/content-review` before `draft: false`.
