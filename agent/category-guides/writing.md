# Category guide: `writing`

The `writing` collection is the main essay/note/case-study stream. The voice standard is `agent/writing-style.md` — read that first; this file only adds what's specific to drafting a *new* piece in this collection rather than reviewing an existing one.

## Frontmatter shape that matters for drafting

`type` classifies the piece (`essay` / `note` / `case-study`) and should match the actual form, not just default to `essay`. A `column` assignment (see `src/lib/taxonomy.ts`) is worth considering at draft time, not bolted on afterward — a piece written to stand alone reads differently from one written as chapter *n* of a reading path.

## Structure

Default to the native-human voice described in `agent/writing-style.md` ("Default target: 2024–2026 native-human voice"): let the piece start from a real situation and let its frame arrive once the material needs one. The negation-reframe opening, named sections, method names, and a compressed closing thesis belong to that document's "Optional publication style" layer — use them only when the user asks for a publish-ready pass, not as the default skeleton.

One native-mode structure worth reaching for when the piece centers on a real case: **case → surface appearance → underlying mechanism → boundary of transfer**. Open with what actually happened and what it looked like at the time, only then surface the mechanism that was misread or discovered, and close by naming where that mechanism does and doesn't generalize. This keeps the engineering/managerial judgment and the personal material in the same paragraph instead of separating "story" from "method," and it's a stronger default for case-driven pieces than opening with a named misconception.

## Comparative and reference grounding (when the topic calls for it)

Essays that make a claim about "the better way to do X" (a framework, a tool choice, a decision process) are stronger when the piece is honest about the alternative it's implicitly arguing against — not a formal competitor table, but naming the common approach before reframing it is itself the negation-reframe move this voice already uses. Where the piece leans on external claims or data, prefer a real source over an assertion; the `citationUrls` frontmatter field exists for exactly this and should be populated rather than left empty when a claim isn't the author's own firsthand experience.

This does not apply to personal-narrative or reflective pieces (travel, personal habits, career reflection) — don't force comparative framing onto content that isn't making a comparative claim.

## Reader value for analytical pieces

For an analytical essay or case study, identify the reader situation before the publication pass: who is likely to recognize this problem, what they currently assume or do, what real contradiction, failure, or unexplained result puts that assumption under pressure, and what they can understand, judge, or do differently after reading. Use those questions to test whether the piece makes its value legible to a reader, not to force a problem-solution structure onto the draft.

The tension must come from the material. Do not manufacture a misconception, conflict, or cost merely to make the opening sound important, and do not replace the author's experience with an abstract audience model. Personal notes and reflective pieces may create value through observation, memory, voice, or an unresolved question rather than by changing a reader's position.

## Drafting order

1. Chinese first, all the way to a structurally complete draft, before any English work starts (see `CONTRIBUTING.md` for the publish-gate mechanics this feeds into).
2. Self-check structure, facts, tone, and voice fit against `agent/writing-style.md`.
3. Run `.claude/skills/humanize-writing` before considering the Chinese draft final.
4. Only after the Chinese side is confirmed final does the English translation start, via `agent/translation-spec.md` and `.claude/skills/xinda-ya-translation`.
5. Run `.claude/skills/content-review` before flipping `draft` to `false`.

## Pre-publish checklist

- Title and opening reframe a real misconception, not a manufactured one.
- In an analytical essay or case study, the intended reader can tell why the question matters and what understanding, judgment, or action the piece may change.
- Every abstract claim is cashed out into criteria, a list, or a worked example.
- No three consecutive sentences share near-identical length and clause structure.
- `column` and `tags` are registered in `src/lib/taxonomy.ts` if used.
- `citationUrls` is populated for claims that aren't the author's own firsthand account.
- English sibling exists and is 信达雅-checked before `draft: false` (writing has no fallback exception — see `agent/adr/0002-bilingual-fallback-policy.md`).
