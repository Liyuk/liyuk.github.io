---
name: write-writing
description: Use when drafting a new writing-collection entry (essay, note, or case-study under src/content/writing/) from scratch, or when asked to plan its structure. Start from the author's 2024–2026 native-human voice and add publication structure only when the material earns it; use humanize-writing for reviewing an existing draft.
---

# Draft a `writing` entry

This skill is for starting a new piece, not reviewing an existing one — use `.claude/skills/humanize-writing` for calibrating a draft that already exists.

## Before drafting

1. Read `agent/writing-style.md` in full if it hasn't been read this session — don't rely on a summary of it. Default to the document's **2024–2026 native-human voice** section; the published-site style is an optional later editing mode, not the starting voice.
2. Read `agent/category-guides/writing.md` for the structure and comparative-grounding rules specific to this collection.
3. Decide `type` (`essay` / `note` / `case-study`) and whether this belongs to a `column` (`src/lib/taxonomy.ts`) — this changes how self-contained the piece needs to be.

## Drafting

1. Start from a real observation, scene, question, disagreement, or failed attempt. Do not manufacture a misconception just to obtain a strong opening.
2. Let the material reveal its frame. Use numbered or named sections only when the piece actually needs them; do not turn an in-progress thought into a finished taxonomy before it has earned one.
3. Make abstract claims concrete through examples, criteria, or consequences, but do not mechanically convert every paragraph into a list.
4. Use a negation-reframe opening, named method, reader exercise, FAQ, Mermaid diagram, or aphoristic ending only when it belongs to the material and the author would plausibly have reached for it.
5. Populate `citationUrls` for any claim that isn't the author's own firsthand experience.
6. Let the ending match the piece: a compressed conclusion is one option; a remaining question, image, or honest limitation may be better.
7. Register any new `tags` or `column` slug in `src/lib/taxonomy.ts` before the draft is considered complete.

## Register discipline while drafting

Keep the author's native rhythm, including occasional spoken phrasing, self-correction, short sentences, unfinished edges, and concrete personal detail. Edit for clarity, not uniform polish. Build qualification into claims when needed, but preserve genuine uncertainty and first-person hesitation. Default to prose; reach for a list only where the content is genuinely enumerable. Do not add diagrams, named frameworks, rhetorical symmetry, or emotional distance merely because they appear in the site's polished archive.

## Handoff

A finished Chinese draft from this skill still needs, in order: `.claude/skills/humanize-writing` (source-voice calibration) → English translation via `agent/translation-spec.md` and `.claude/skills/xinda-ya-translation` → `.claude/skills/content-review` before `draft: false`. This skill does not itself certify publish-readiness.
