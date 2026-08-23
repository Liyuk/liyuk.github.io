# Writing style

This document distinguishes the author's native human writing from the later editorial style visible in the current site. It is a calibration guide, not a template. The default target for new writing is the author's 2024–2026 human-source voice; the polished site style is an optional publication pass.

## Provenance and confidence

The current site is a mixed corpus. Several older pieces were substantially rewritten during the 2026 migration, so their published form is evidence of the author's later editing ability, not necessarily of the original writing voice. The strongest anchors for minimally altered writing are the 2012 `network-bug` and 2018 `interview-questions-archive` entries, both of which carry an explicit note that only paragraphs and punctuation were整理. The 2020–2022 source notes and the pre-publication materials for later pieces are better evidence for the human drafting voice than the finished pages.

Do not infer a continuous improvement curve from the archive. A more accurate model is:

```text
early personal / literary / note-like writing
        ↓
2020–2022 spoken, exploratory source material
        ↓ 2022 onward: structural rewriting becomes repeatable
2024–2026 native-human thinking with stronger frameworks
        ↓ optional editorial compression
current site's polished essays
```

The distinction matters. A current page may contain a clean misconception-reframe, four-part structure, named method, Mermaid diagram, and compressed conclusion because those were added or strengthened during rewriting. They are not automatically the author's natural sentence-level voice.

## Default target: 2024–2026 native-human voice

The target is a person with strong technical and organizational judgment thinking on the page before the material has been fully packaged for teaching or publication.

### Experience generates the concept

Start from a real situation: something that happened at work, a disagreement, a repeated failure, a conversation, a decision that felt wrong, or a detail that stayed in memory. Let the abstraction arrive because the material creates a need for it. Do not open with a method name merely because the eventual essay has one.

### Thinking remains visible

The prose may show how the judgment changed:

- “我当时以为……”
- “后来才发现……”
- “这里我其实还没想清楚……”
- “我原来把两件事混在了一起……”

These are not filler or weakness when they are true. They show the origin and limits of the conclusion. Preserve them instead of replacing them with impersonal certainty.

### Specificity carries the personality

Keep the people, work situations, private analogies, small jokes, family disagreements, game references, and awkward details that explain why the author sees a problem in a particular way. Personal material should not be added as decoration; it should remain when removing it would make the judgment feel ownerless.

### Unevenness is allowed

Native prose can move between spoken phrasing, a long winding sentence, a compact distinction, a technical explanation, and a short stop. It may contain a controlled detour or an unfinished edge. Edit away confusion, repetition, and accidental vagueness; do not normalize every paragraph into the same cadence.

### Frameworks are earned

The author does have a strong tendency toward dimensions, trade-offs, mechanisms, and reusable distinctions. Preserve that analytical ability, but let the frame emerge after examples or questions have made it necessary. A framework should clarify lived material, not replace it.

### Endings need not be slogans

An ending may compress the judgment, return to a concrete image, admit a boundary, or leave a precise question open. “结语” and aphoristic closure are available tools, not requirements.

## Optional publication style: the current site's later layer

Use this layer only when the user asks for a site-ready essay, a teaching piece, or a polished public version. Recurring features include:

- opening by naming and reframing a misconception;
- numbered or named sections that isolate dimensions;
- abstract claims translated into criteria, examples, or exercises;
- explicit methods such as Top K, MECE, STAR, 2×2 matrices, or the author's named frameworks;
- Mermaid diagrams carrying part of the argument;
- a compressed closing thesis and, for practical pieces, anticipated questions.

These features are useful editorial tools, but they are not proof of human voice. Applying all of them by default produces a smooth, symmetrical, instructional text that can preserve the author's conclusions while losing the author's presence.

## What to preserve, what to resist

| Preserve | Resist unless earned by the material |
| --- | --- |
| first-person reasoning and changed minds | forced “不是……而是……” openings |
| concrete scenes and specific friction | automatic numbered sections |
| private analogies and restrained humor | turning every thought into 3–5 items |
| real uncertainty and boundaries | naming a method before the problem needs it |
| dense but varied sentence rhythm | uniform clause-packed prose everywhere |
| useful detours with explanatory value | deleting every tangent for efficiency |
| analytical distinctions | generic “可复用方法论” packaging |
| an ending appropriate to the piece | mandatory金句、结语、FAQ or diagram |

## Constructed examples must read as prose, not as disclosed constructions

When a real anecdote isn't available and an illustrative example is used instead, the example itself may be invented — but the disclosure that it's invented must never appear in the reader-facing text. "举例来说""打个比方" is enough of a signal on its own; adding "这是为了说明道理而构造的场景，不是某一次真实发生过的事情" or "这是一个虚构但常见的情形" breaks the fourth wall, reads as a legal disclaimer bolted onto an essay, and is itself a strong AI-writing tell. The distinction between invented and lived material belongs in the author's own head (and, if needed, in an editorial note to whoever is reviewing the draft) — never in the paragraph the reader sees. If a piece truly needs to flag that a scenario is composite or anonymized, do it the way `agent/category-guides/consulting.md` handles de-identification: fold it into natural narration ("这类情况我见过不止一次" or similar), not a standalone meta-sentence about the writing process itself.

## Minimum length by form

A piece's `type` (see `agent/category-guides/writing.md`) sets a floor, not a target — hitting the number by padding is worse than staying short, but a title that promises a full judgment and a body that doesn't clear the floor is the "题大文小" failure mode and should be fixed by either narrowing the title/description or adding real material, not by leaving the mismatch in place:

| Form | Floor | Note |
| --- | ---: | --- |
| `note` — a single observation, a raw one-on-one record, a quick recap | ~500字 | Can be shorter if it's genuinely a fragment; don't force it into essay shape. |
| Ordinary experience essay | ~1,500字 | The default floor for `type: essay`. |
| Case-driven piece with a real example, contrast, or failure | ~2,500字 | Needs the scene, the mechanism, and the boundary of transfer — that rarely fits in less. |
| Deep technical/management analysis | ~3,500字 | Framework or claims alone aren't enough at this floor; real material or evidence must carry the weight. |
| `research` | ~5,000字 | See `agent/category-guides/research.md` for the evidentiary bar that goes with this length. |

Archive-preservation pieces, travel/personal notes, project README-style pages, and tool templates are exempt — judge those by whether they're clear and honest, not by a word count.

## Mode selection

Before drafting or revising, identify the requested mode:

1. **Native-human mode (default):** recover and preserve the 2024–2026 human-source voice. Clarify locally; do not add publication machinery.
2. **Publication mode:** organize the native material for a public page. Add structure only where it improves comprehension, and leave some native texture visible.
3. **Archive-preservation mode:** for minimally edited historical pieces, change only what the user explicitly authorizes.

“Humanize” means returning to the first mode, not making a draft resemble the third layer of the diagram above.
