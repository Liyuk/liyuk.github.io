# Category guide: `consulting`

Migrated and superseding the old `docs/consulting-writing-workflow.md` (that file was never git-tracked; this is the canonical version). Read `agent/writing-style.md`'s "Default target: 2024–2026 native-human voice" section first for the voice; this file is the structural and de-identification spec specific to this collection. The `.claude/skills/write-consulting` skill operationalizes both together.

## What this collection is

A `consulting` entry is not a verbatim transcript and not a formal consulting report. It's an edited record of a real consulting session: the real problem, the pivotal dialogue, and the counselor's judgment — arranged so a reader can see what they could take away for themselves.

Default shape:

> problem scene → selected dialogue → counselor's judgment → an actionable next step → applicability boundary

The piece's job is not to prove the client succeeded. It's to show how a vague workplace problem gets decomposed into a sharper problem and a next step.

## Structure

### 1. Open with the problem scene, not the client's résumé

Start with one or two paragraphs describing a situation the reader might recognize: what happened, why it's anxiety-inducing, what the surface-level problem looks like. A short "you might recognize this" beat with 3–5 concrete symptoms helps readers self-identify.

### 2. Keep only the pivotal dialogue

More dialogue is not better. Keep exchanges that changed how the problem was defined:

- how the client first described the difficulty;
- what the counselor probed for;
- which answer exposed a deeper layer;
- the point where the counselor's approach shifted.

Follow every dialogue block with a short analysis. Don't make the reader infer the conclusion from a wall of Q&A.

### 3. State the counselor's judgment explicitly

Answer three questions, in this order:

1. What's the surface-level ask?
2. What's the actual blocker?
3. Why can't this be answered directly, right now?

Ground the judgment in facts already in the piece. Avoid over-certain framing ("I could tell immediately that…", "this is simply because…").

### 4. Turn the method into a next step, not a slogan

Never leave advice at the abstraction level of "communicate more" or "build influence." Spell out:

- who to talk to;
- what information that conversation is meant to surface;
- what order to have these conversations in;
- when to bring which facts back to a manager or key stakeholder;
- what the next check-in should look at.

### 5. State what one session actually produces

Close with 3–4 concrete outcomes a session delivered, for example:

- turning "I have no direction" into a question about direction, information, authorization, or organizational support;
- identifying who to talk to and what each conversation is for;
- a reportable set of facts, hypotheses, and a next step;
- what *not* to rush into right now.

Never promise a single session resolves everything. For a real case, incrementally clarifying the problem and finding the next step *is* the outcome — say that plainly instead of overselling.

### 6. State the applicability boundary and the entry point

Close by naming the kind of situation that's a fit for a paid session, then link to the consulting page. The CTA should say what the client needs to bring, what the first session determines, and what the service format looks like.

## De-identification and consent

- Consent to write about a session is not consent to publish the combination of company, business context, timeline, team, and relationships that could re-identify someone. Minimize disclosure regardless of consent.
- Keep only the background necessary to understand the judgment being made — never the organizational path, internal metrics, or sensitive data that lets someone reverse-engineer who this is.
- State explicitly that the piece is "an edited record of a real session, not a transcript"; note where multiple facts were abstracted or merged when that's true.
- Never write a staged action plan as if it already happened, and never write the counselor's advice as if the client had already carried it out.
- The `guest` frontmatter field is a role/description, never a real name (see `agent/translation-spec.md` for how it translates).

## Comparative grounding (when it earns its place)

Where a piece's advice runs against common but weaker patterns — the usual "communicate more" genre of advice this guide already warns against — naming that pattern and why it fails the specific situation is worth a sentence or two before giving the sharper alternative. This is not a mandatory section; force it only where the contrast actually sharpens the reader's understanding, not as decoration.

## Pre-publish checklist

- Does the title name a concrete difficulty a reader would recognize, not just the client's identity?
- Does the first ~300 characters signal "this might be about me"?
- Is the dialogue filtered — does every block move the problem definition forward?
- Is the counselor's decomposition stated explicitly, not just advice-giving?
- Is there an executable next step, not a slogan?
- Is it clear what one session actually delivers?
- Are the applicability boundary, anonymization, and "not a transcript" disclosure present?
- Do the Chinese and English titles, problem framing, conclusion, and CTA align?
- Passed `.claude/skills/write-consulting`, then `.claude/skills/content-review` before it enters the finalize/publish flow.
