---
name: humanize-writing
description: Use when drafting or reviewing Chinese content in src/content/ for whether it sounds like this author's 2024–2026 human source voice. Preserve concrete experience, spoken thinking, self-correction, personal associations, and productive irregularity before applying optional publication-level structure. This is not a generic "sound more human" pass and must not imitate the site's already-polished house style by default.
---

# Humanize writing

This is a source-voice calibration pass, not a word-swap pass and not a final copy-edit. Read `agent/writing-style.md` first. The default target is the author's 2024–2026 human-source voice: the way a person with real experience thinks aloud, notices a contradiction, changes direction, remembers a detail, and only gradually arrives at a usable frame.

Keep three layers separate:

1. **Human source** — notes, memories, conversations, examples, jokes, detours, and half-formed distinctions.
2. **Native human draft** — the source after the author has thought it through, but before it has been compressed into a site-ready essay.
3. **Published site version** — a later editorial layer with cleaner openings, named sections, explicit criteria, method names, and compressed conclusions.

The target of this skill is layer 2, not layer 3. If the user explicitly requests a publish-ready or site-style pass, layer 3 is an additional mode; never apply it silently.

## What humanizes this author's prose

The strongest evidence of human authorship here is not casual vocabulary. It is the relationship between experience and judgment:

- **Concrete before abstract** — begin with what happened, what was said, what felt off, or what failed; let the concept emerge from the material.
- **Visible thinking** — preserve "我当时以为"、"后来才发现"、"这里我其实没想清楚" and similar changes of mind when they are true to the source.
- **Personal anchors** — keep specific people, work situations, private analogies, small jokes, and emotionally charged details when they explain where a judgment came from.
- **Uneven but intentional rhythm** — a spoken sentence, a compact distinction, a long explanatory sentence, and an abrupt stopping point may sit together. Do not normalize every paragraph into the same polished cadence.
- **Productive detours** — retain a side path when it reveals the author's values, assumptions, relationship to the problem, or reason for changing the frame. Cut only detours that add neither information nor voice.
- **Frameworks that arrive late** — a useful dimension model may appear after examples have created the need for it. Do not announce a named method merely to make a draft look organized.
- **Open edges** — not every piece needs a maxim, a complete taxonomy, a numbered conclusion, or a reader exercise. A precise unresolved question can be a human ending.

AI-like drift in this context is often the opposite of messiness: a draft that is too evenly organized, too certain, too symmetric, too frictionless, or too eager to turn every observation into a reusable system.

## Process

1. Read the draft in full once before touching anything — don't pattern-match line by line without knowing the whole argument.
2. Read `agent/writing-style.md`. If this is a `consulting`-collection piece, also read `agent/category-guides/consulting.md`.
3. Identify the source layer and intended mode:
   - **Native-human mode (default):** preserve the thinking process and personal anchors; make only clarity, factual, safety, and local rhythm edits.
   - **Publication mode (explicit request only):** add structure where the material needs it, while preserving native-human passages as the texture beneath the structure.
4. Pass over the draft and flag, per paragraph:
   - Polished abstractions that have lost the concrete event or person that generated them
   - Suspiciously symmetric sentences, section openings, or conclusions
   - Generic connective phrases doing the work an argument should be doing
   - Invented first-person intimacy, jokes, uncertainty, or anecdotes not present in the source
   - Premature checklists, named frameworks, negation-reframes, FAQs, or Mermaid diagrams added only to resemble the site
   - Personal detours that were flattened even though they explain the author's judgment
5. Rewrite flagged passages. Recover the author's own material where possible; do not manufacture "human touches." Preserve facts, argument, uncertainty, and conclusions. When source material is missing, mark the gap or ask for it rather than inventing autobiographical detail. If an invented illustrative example is used instead (with the user's sign-off), see `agent/writing-style.md`'s "Constructed examples must read as prose" rule — the fact that it's constructed stays out of the reader-facing sentence.
6. Check length against `agent/writing-style.md`'s "Minimum length by form" table. A title/description that promises a full judgment sitting on top of a body that doesn't clear its form's floor is a "题大文小" failure — flag it and either narrow the title or add material, don't leave the mismatch.
7. Report the trade-off: what was preserved as native voice, what was clarified, and what publication structure was deliberately not added. Do not claim an AI-detector percentage you did not measure. If the repository's publish gate requires a detector check, report that separately from voice calibration.

## What this skill does not do

It does not add colloquialisms, jokes, first-person asides, or "human touches" that are not in the author's material. It does not force every draft into the current site's post-rewrite template. It does not equate human writing with casual writing: the target can be analytical and technically precise while still showing memory, hesitation, preference, and an uneven path to the conclusion. Check against the source-voice section of `agent/writing-style.md`, not against a generic humanization checklist.
