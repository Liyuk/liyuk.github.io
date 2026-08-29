---
name: write-writing
description: Use when drafting a new writing-collection entry (essay, note, or case-study under src/content/writing/) from scratch, or when asked to plan its structure. Start from the author's 2024–2026 native-human voice and add publication structure only when the material earns it; use humanize-writing for reviewing an existing draft.
---

# Draft a `writing` entry

This skill is for starting a new piece, not reviewing an existing one — use `.claude/skills/humanize-writing` for calibrating a draft that already exists.

The writer remains the source of the experience, judgment, and final responsibility. The skill is a collaborative editorial workflow, not a request to generate a complete article in one pass. When the material is thin or the author's position is unclear, extract more raw material or mark the gap instead of filling it with generic prose.

## Choose the working mode

Use the lightest mode that fits the material:

- **Raw-material / interview mode** — when the topic is only an idea, question, conversation, or a few notes. Ask one focused question at a time and collect concrete events, observations, disagreements, examples, and the author's provisional judgment before proposing a polished outline.
- **Outline mode** — when the material exists but the argument or order is unclear. Produce a compact outline with the reader situation, the change in understanding the piece should create, the central claim, supporting material, unresolved questions, and claims that need evidence.
- **Section-by-section draft mode** — when the outline and source material are sufficient. Draft one section at a time, show the intended argument and the voice/material being used, and let the author correct direction before expanding the next section. Full-article generation is allowed only when the user explicitly asks for it and the source material is already adequate.
- **Development mode** — when a draft has a substantial body but its thesis, order, or reader value is uncertain. Diagnose the argument and structure before rewriting sentences. For an existing draft, route the actual voice calibration to `.claude/skills/humanize-writing` rather than silently applying a publication edit here.

At any point it is valid to move backward: draft → outline, outline → interview, or development review → new material. Do not treat the workflow as a one-way conveyor belt.

The complete editorial path is:

`source material / interview → outline → section draft → developmental review → voice calibration → line edit → evidence and risk review → translation → content review`

Not every piece needs every stage, but skipping a stage should be a material decision. A technical case study may begin from repository evidence instead of an interview; a personal essay may need more interview and voice work than external research. The article's type and evidence burden decide the path.

## Interview mode in detail

When the author has an idea but not yet a usable body of material, ask one question at a time and wait for the answer. Do not turn the interaction into a questionnaire or lead the author toward a thesis you invented. Adapt the follow-ups to where the author's energy and uncertainty are.

Use these as a questioning map, not a rigid script:

1. **Personal connection** — What concrete event, conversation, failure, observation, or discomfort triggered this topic?
2. **Core claim** — What does the author actually believe? Push past a balanced but unfalsifiable answer.
3. **Mechanism** — How does the claimed pattern work in the real situation? Ask what leads to what, and through which constraint.
4. **Evidence** — What comes from experience, code, data, reading, or historical comparison? What would convince a skeptic?
5. **Strongest counterargument** — What is the best opposing view, not a strawman? Under what conditions might it be right?
6. **Reader consequence** — What should a reader understand, judge, or change after reading?
7. **Non-obvious angle** — What would a generic article on this topic miss?
8. **Follow-ups** — Stay with the most specific, surprising, or emotionally charged thread until the material is sufficient.

When the interview is ready, summarize the personal hook, provisional thesis, key points, strongest evidence, counterargument, reader consequence, non-obvious angle, and unresolved gaps. Do not treat this summary as a final argument; it is raw material for the outline.

## Outline mode in detail

Before drafting prose, produce a structural plan that includes:

- two or three possible concrete openings;
- the reader situation and the tension or question;
- the mechanism or through-line that makes the sections depend on one another;
- evidence, examples, historical parallels, and research gaps;
- implications for the reader;
- an ending that can return to the opening, leave an earned question, or state a concrete implication;
- the teach test: one sentence stating what the reader will learn.

Vary section shape and size. Do not make every section follow `setup → point → example → conclusion`, and do not write the article itself while pretending to write an outline. The outline is a proposal: surface it for correction before it becomes a commitment.

## Section drafting discipline

Before offering prose for a section:

1. Read the entire current draft or source material, not only the last paragraph.
2. Reconfirm the thesis in one sentence and say whether it is still holding.
3. Read `agent/writing-style.md` and identify two concrete voice patterns from the relevant source-voice material. If `agent/writing-style.md` has no usable examples, use the repository's stated principles and existing published writing instead. State the patterns internally or to the author when the workflow calls for visible calibration; do not invent a persona.
4. State the section's job, the material it will use, and what it must not repeat.
5. Offer two or three alternatives when the author asks for prose or an opening. The author chooses the direction; do not silently choose a voice or argument for them.

After an approved section, reread the piece from the beginning. Check continuity, register shifts, repeated claims, missing references, and whether the new section is fighting the outline. Track progress using the repository's actual files and frontmatter; do not introduce a generic `word-count` field if the collection schema does not support it.

## Before drafting

1. Read `agent/writing-style.md` in full if it hasn't been read this session — don't rely on a summary of it. Default to the document's **2024–2026 native-human voice** section; the published-site style is an optional later editing mode, not the starting voice.
2. Read `agent/category-guides/writing.md` for the structure and comparative-grounding rules specific to this collection.
3. Decide `type` (`essay` / `note` / `case-study`) and whether this belongs to a `column` (`src/lib/taxonomy.ts`) — this changes how self-contained the piece needs to be.
4. Make a short writing brief before fixing the title or structure. Record, in working notes or in the conversation:
   - the reader situation and what the reader should understand, judge, or do differently afterward;
   - the author's actual source material, firsthand experience, and current judgment;
   - the main claim or question, its scope, and what the piece deliberately does not claim;
   - required examples, evidence, sources, and any sensitive or identifying details to avoid;
   - a provisional definition of done for this article type.
5. If the author has not supplied enough personal material for a personal or reflective piece, ask for it or keep the piece explicitly analytical. Never invent autobiographical detail, a conversation, a failure, or a change of mind.

## Drafting

1. Start from a real observation, scene, question, disagreement, or failed attempt. Do not manufacture a misconception just to obtain a strong opening.
2. Let the material reveal its frame. Use numbered or named sections only when the piece actually needs them; do not turn an in-progress thought into a finished taxonomy before it has earned one.
3. Make abstract claims concrete through examples, criteria, or consequences, but do not mechanically convert every paragraph into a list.
4. For an analytical essay or case study, make a reader-value pass after the material has revealed its frame: identify the reader situation, the existing assumption placed under pressure by a real contradiction or failure, and what the reader may understand, judge, or do differently afterward. Use this to revise the title, description, opening, and argument priority, not as a mandatory problem-solution template. Do not manufacture tension or replace the author's experience with an abstract audience model.
5. For an analytical topic that involves a market, product, approach, or industry claim, run the seven-step evidence sequence in `agent/editorial-rules.md` (§ Analytical evidence sequence) before settling the argument — read it there rather than working from a summary, and follow its constraints on step 6 and on how much of the sequence surfaces in the prose. `agent/category-guides/writing.md` adds what this collection does with the result.
6. Use a negation-reframe opening, named method, reader exercise, FAQ, Mermaid diagram, or aphoristic ending only when it belongs to the material and the author would plausibly have reached for it. When the piece explains how a system, platform, or reusable method is organized and a structure map would carry part of the argument, build it with `.claude/skills/house-diagram`.
7. Populate `citationUrls` for any claim that isn't the author's own firsthand experience.
8. Let the ending match the piece: a compressed conclusion is one option; a remaining question, image, or honest limitation may be better.
9. Register any new `tags` or `column` slug in `src/lib/taxonomy.ts` before the draft is considered complete.

## Evidence and claim control

For analytical writing, keep a lightweight claim ledger while researching and drafting. It may stay in working notes rather than the published article, but every material claim should be classifiable as:

- firsthand observation or experience;
- repository/code/data evidence;
- an external fact supported by a source;
- an interpretation derived from evidence;
- a hypothesis, forecast, or unresolved possibility.

For each external or consequential claim, record its source, date/scope, certainty, and the sentence strength the evidence can support. Narrow the sentence when the source is indirect, stale, incomplete, or only supports correlation. `citationUrls` is required for external claims, but a URL alone is not a substitute for checking that the source actually supports the wording.

When the topic involves a product, market, industry, or technical approach, use the evidence sequence in the drafting section before treating the argument as settled. The comparison and challenge are for reasoning; do not automatically expose the ledger, a competitor matrix, or literal `Pros` / `Cons` headings in the final prose.

## Review passes before handoff

Keep these judgments separate and run them in this order:

1. **Material pass** — Is the piece grounded in the author's actual experience, source material, or clearly labeled evidence? Are missing facts marked rather than invented?
2. **Developmental pass** — Is the reader situation legible? Does the contradiction, mechanism, example, or evidence actually earn the claim? Is the order doing useful work? Fix the thesis, scope, or structure before polishing sentences.
3. **Voice pass** — Preserve the author's native rhythm, visible thinking, personal anchors, uncertainty, and productive irregularity. Use `.claude/skills/humanize-writing` for this pass on an existing draft.
4. **Line pass** — Only after the argument survives, improve clarity, verbs, transitions, paragraph rhythm, terminology, and unnecessary repetition. Do not make every sentence equally polished or symmetrical.
5. **Fact and risk pass** — Recheck citations, dates, numbers, code/project status, privacy/de-identification, and claims that could be mistaken for firsthand fact. The final human judgment remains with `.claude/skills/content-review`.

For the evidence pass, extract claims before trying to polish them. For each factual claim, statistic, attributed statement, historical claim, or causal assertion, record its location, exact wording, source, and verdict: `verified`, `unverified`, `unsupported`, or `overstated`. Check the article and repository evidence first, then the strongest original external source available. Flag vague attributions such as “studies show” and “experts say”; name the source or weaken/cut the claim. Check source diversity, recency, cherry-picking, and whether the source supports the exact strength of the sentence. `citationUrls` should contain usable direct sources, not merely search-result pages.

For the final mechanical pass, inspect the whole piece rather than hunting isolated forbidden words. Look for vague pronoun openers, formulaic transitions, consultant language, false drama fragments, artificial triads, forced symmetry, repeated thesis statements, hidden lists, question-and-answer hooks, paragraph-closing definitions, catalog/system-tour prose, one controlling metaphor used too often, and sentences that have been split only to appear punchy. Treat these as flags for judgment, not proof of AI authorship. Do not remove a natural phrase merely because it matches a watchlist.

## Editorial memory and session feedback

After a substantial review, recommend (do not silently add) one or two paragraphs that are strong examples of the author's reusable voice. Explain the move each paragraph demonstrates and ask for approval before adding it to any voice-note file. A polished sentence is not automatically a useful voice example; prefer concrete, self-contained passages whose structure or turn of thought can guide future work.

Also surface process feedback from the session when it reveals a repeatable failure. Classify each lesson before proposing an edit:

- a recurring wording pattern belongs in the AI-tells or style checklist;
- a writing judgment belongs in the writing principles or category guide;
- a voice calibration miss belongs in voice notes;
- a workflow failure belongs in the relevant skill;
- a one-off observation should remain a proposed lesson, not become a universal rule.

Cap proposed lessons at the few with the highest leverage, quote the concrete friction that caused each one, and obtain approval before editing reference files. Never invent feedback or claim an AI-detection score that was not measured.

## Definition of done

Before calling a Chinese draft complete, verify the appropriate conditions rather than using length or polish as a proxy:

- **essay** — a real observation or question, a clear but appropriately bounded judgment, concrete support, and an ending that matches the material;
- **note** — a useful focused observation or unresolved question, with its uncertainty and scope visible;
- **case-study** — a clearly separated account of what is observed/implemented, what is proposed, the relevant alternatives and trade-offs, and the remaining risks or decisions;
- **all types** — valid frontmatter, registered tags/column, citations for external claims, no invented personal material, and no publication-state changes made by this skill.

If an English sibling is needed, do not translate a Chinese draft that is still changing. Handoff follows the repository sequence: `humanize-writing` → `agent/translation-spec.md` / `.claude/skills/xinda-ya-translation` → `.claude/skills/content-review`. This skill does not certify publication readiness and never flips `draft: true` to `false`.

## Register discipline while drafting

Keep the author's native rhythm, including occasional spoken phrasing, self-correction, short sentences, unfinished edges, and concrete personal detail. Edit for clarity, not uniform polish. Build qualification into claims when needed, but preserve genuine uncertainty and first-person hesitation. Default to prose; reach for a list only where the content is genuinely enumerable. Do not add diagrams, named frameworks, rhetorical symmetry, or emotional distance merely because they appear in the site's polished archive.

## Handoff

A finished Chinese draft from this skill still needs, in order: `.claude/skills/humanize-writing` (source-voice calibration) → English translation via `agent/translation-spec.md` and `.claude/skills/xinda-ya-translation` → `.claude/skills/content-review` before `draft: false`. This skill does not itself certify publish-readiness.
