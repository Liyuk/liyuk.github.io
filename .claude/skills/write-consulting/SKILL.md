---
name: write-consulting
description: Use when drafting a new consulting-collection entry (an edited career-consulting session record under src/content/consulting/) from scratch. Applies agent/category-guides/consulting.md's problem-scene → dialogue → judgment → next-step → boundary structure and its de-identification rules from the first draft.
---

# Draft a `consulting` entry

Read `agent/category-guides/consulting.md` in full before drafting — it is the structural spec this skill operationalizes, migrated from what used to be a local-only note. This collection carries the highest privacy risk on the site (real people, real sessions), so the de-identification step is not optional and not deferrable to a later review pass.

## Before drafting

1. Read `agent/category-guides/consulting.md` and `agent/writing-style.md`'s "Default target: 2024–2026 native-human voice" section.
2. Confirm what can actually be disclosed: consent to write about a session is not consent to publish the combination of company, business context, timeline, team, and relationships that could re-identify the client. Decide the minimization up front, before drafting dialogue, not as a redaction pass afterward.

## Drafting

1. Open with the problem scene the reader might recognize — not the client's résumé. A short "you might recognize this" beat with 3–5 concrete symptoms helps.
2. Select only dialogue that changed the problem's definition; follow every exchange with a short analysis that names what it revealed, not a restatement of what was said.
3. State the counselor's judgment as three explicit answers: the surface ask, the actual blocker, and why it can't be answered directly yet. Ground it in facts already in the piece — avoid "I could tell immediately" framing.
4. Turn the method into a concrete next step: who to talk to, what information that surfaces, in what order, when to return with what facts, what the next check-in looks at.
5. Close with 3–4 concrete things the session actually produced. Never promise one session resolved everything — incrementally clarifying the problem and finding the next step *is* the outcome.
6. Add the applicability boundary and a CTA into the consulting page, stating what a prospective client needs to bring and what a first session determines.
7. Where the piece pushes back on a common but weaker pattern of advice, name that pattern briefly before giving the sharper alternative (see the comparative-grounding note in `agent/category-guides/consulting.md`) — only where it actually sharpens the point.

## De-identification pass (mandatory, before this leaves draft)

- Minimize disclosure beyond what's necessary to understand the judgment, regardless of what consent was given.
- State explicitly that the piece is an edited record, not a transcript; note where facts were abstracted or merged if they were.
- Confirm the `guest` field is a role/description, never a real name.
- Never present a staged action plan as something that already happened, or the counselor's advice as something the client already did.

## Handoff

Same downstream sequence as any collection: `.claude/skills/humanize-writing` → translation via `agent/translation-spec.md` / `.claude/skills/xinda-ya-translation` → `.claude/skills/content-review` before `draft: false`. `content-review`'s privacy checklist re-verifies de-identification independently — passing this skill's pass does not skip that step.
