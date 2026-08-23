# agent/

This directory holds curated, Git-tracked reference material for AI collaborators working on this repository — as opposed to `docs/`, which is personal, local-only working notes (logs, one-off analyses, series plans) that never enter Git, with **no exception** (see `docs/README.md` and `agent/adr/0005-public-content-and-private-material-boundary.md`). If a standard needs to survive across sessions or be visible from a fresh clone, it belongs here or in root `AGENTS.md`/`CONTRIBUTING.md` — never in `docs/`.

`AGENTS.md` at the repository root is the entry-point contract: architecture, routing, and engineering invariants. The files here extend it with the deeper architecture rationale and the editorial/writing-quality standards that apply to authoring and reviewing content in `src/content/`.

| File | Covers |
| --- | --- |
| `architecture.md` | Content-model rationale, the current feature surface across all five collections, image-asset conventions, UTM outbound-link tracking, the CI/automation contract, and known exceptions/edge cases worth not re-discovering. |
| `writing-style.md` | The author's distilled voice — structure, rhetorical patterns, register — derived from actual published writing. Use it to calibrate drafts and reviews, not as a template to force onto every piece. |
| `editorial-rules.md` | Cross-cutting rules: language choice for diagrams/formulas, the AI-detection threshold and how to work under it, the 信达雅 translation standard. |
| `translation-spec.md` | The mechanical rules for producing an `en.md`: frontmatter transforms, YAML quoting, what to translate verbatim vs. copy unchanged, per-collection strict-schema keys. |
| `category-guides/writing.md`, `research.md`, `projects.md`, `consulting.md`, `gallery.md` | Structure, evidentiary bar, and comparative/prior-art expectations specific to each content collection. Read the relevant one before drafting a new entry in that collection. |
| `adr/` | Decision records for the trade-offs behind the content pipeline, bilingual policy, deploy/notify ordering, the Node version contract, and the public/private material boundary. |

Project-level Claude Code skills that operationalize these standards live in `.claude/skills/`. Keep this directory and those skills in sync: if a rule changes here, update the skill that enforces it, and vice versa.
