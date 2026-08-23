# Category guide: `project`

The `project` collection (source directory and public route are plural — `src/content/projects/` → `/projects/`) covers two distinct subtypes, distinguished by frontmatter shape (`src/content.config.ts`):

- **Engineering projects**: `repositoryUrl` required, optional `paperUrl`, `hero`, `status` (`active` / `maintained` / `archived`).
- **"Work" subtype** (e.g. serialized novels): `workUrl` plus a `work` object (pen name, platform, serialization status, optional cover) — see `agent/architecture.md` for how this renders differently (a "作品" badge, no repository links).

This guide is about the engineering subtype; work-subtype entries follow `agent/writing-style.md`'s narrative voice instead of the structure below.

## Structure for an engineering project write-up

1. **Problem, not feature list.** Open with the actual problem the project solves and for whom — not a bullet list of capabilities.
2. **Architecture and the decisions behind it.** A diagram earns its place when the system has real structure to show (see `agent/editorial-rules.md` for the English-labels-only rule on Mermaid). Alongside the diagram, name the decisions that could reasonably have gone another way and why they didn't — this is the project-scale version of the negation-reframe move: "this isn't X, because Y."
3. **What actually happened, not just what was built.** Outcome, current status, and known limitations. `status: archived` or `maintained` should read as an honest signal, not a stale label.
4. **Boundary and what it doesn't do.** Same non-absolute-claims discipline as `agent/writing-style.md`: state the scope limit once, plainly.

## Comparative grounding (expected for engineering projects)

An engineering project write-up should name the realistic alternative approach it chose against — an existing tool, a simpler design, a different architecture — and say concretely why that alternative was worse for this problem's constraints, not just "more complex." This is what turns a project page into a judgment artifact instead of a changelog. Keep it to what's actually true of the decision made; don't invent a straw-man alternative to make the choice look better than the decision process actually was.

## Drafting order

Same Chinese-first, `humanize-writing`-then-translate-then-`content-review` sequence as `writing.md`. Engineering projects have no bilingual fallback exception (`agent/adr/0002-bilingual-fallback-policy.md`) — the English sibling is required before publish, same as `writing`.

## Pre-publish checklist

- Opens with the problem, not a capability list.
- Architecture diagram (if any) uses English labels and reflects the real system, not an idealized one.
- At least one real alternative is named and the reason it lost is concrete, not generic ("too complex", "not scalable") without a stated constraint that made it so.
- `status` reflects current reality.
- `repositoryUrl` (or `workUrl` for the work subtype) resolves.
- English sibling exists and is 信达雅-checked before `draft: false`.
