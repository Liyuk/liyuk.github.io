# agent/

This directory holds curated, Git-tracked reference material for AI collaborators working on this repository — as opposed to `docs/`, which is personal, local-only working notes (logs, one-off analyses, series plans) that never enter Git, with **no exception** (see `docs/README.md` and `agent/adr/0005-public-content-and-private-material-boundary.md`). If a standard needs to survive across sessions or be visible from a fresh clone, it belongs here or in root `AGENTS.md`/`CONTRIBUTING.md` — never in `docs/`.

`AGENTS.md` at the repository root is the entry-point contract: architecture, routing, and engineering invariants. The files here extend it with the deeper architecture rationale and the editorial/writing-quality standards that apply to authoring and reviewing content in `src/content/`.

| File | Covers |
| --- | --- |
| `architecture.md` | Content-model rationale, the current feature surface across all five collections, image-asset conventions, UTM outbound-link tracking, the CI/automation contract, and known exceptions/edge cases worth not re-discovering. |
| `writing-style.md` | The author's distilled voice — structure, rhetorical patterns, register — derived from actual published writing. Use it to calibrate drafts and reviews, not as a template to force onto every piece. |
| `editorial-rules.md` | Cross-cutting rules: language choice for diagrams/formulas, when a diagram earns its place and which kind answers which question, the canonical analytical evidence sequence, the AI-detection threshold and how to work under it, the 信达雅 translation standard. |
| `translation-spec.md` | The mechanical rules for producing an `en.md`: frontmatter transforms, YAML quoting, what to translate verbatim vs. copy unchanged, per-collection strict-schema keys. |
| `category-guides/writing.md`, `research.md`, `projects.md`, `consulting.md`, `gallery.md` | Structure, evidentiary bar, and comparative/prior-art expectations specific to each content collection. Read the relevant one before drafting a new entry in that collection. |
| `adr/` | Decision records for the trade-offs behind the content pipeline, bilingual policy, deploy/notify ordering, the Node version contract, and the public/private material boundary. |

Project-level Claude Code skills that operationalize these standards live in `.claude/skills/`. Keep this directory and those skills in sync: if a rule changes here, update the skill that enforces it, and vice versa.

Use one primary path for each content task: draft a new entry with its `write-*` skill; review an existing Chinese draft with `humanize-writing`; perform requested Chinese rewrites with `humanize-writing` then `shuorenhua`; translate or review English with `xinda-ya-translation` then `humanizer`; and use `content-review` only for the final go/no-go judgment. UI skills follow the existing Astro implementation and do not imply a framework migration.

## Writing workflow and handoff

| Current task | Entry point | Completion and next step |
| --- | --- | --- |
| New entry | Matching `write-*` skill | Establish sufficient sourced material and a bounded draft; hand off to Chinese calibration. |
| Chinese calibration or revision | `humanize-writing`, invoking `shuorenhua` | Apply the revision contract in `editorial-rules.md`; preserve voice, resolve or record gaps, and identify the Chinese version ready for translation. For gallery captions, apply the same preservation rules without essay-length requirements. |
| English translation or revision | `xinda-ya-translation`, invoking `humanizer` | Work from the identified Chinese version; secure 信 and 达 before English cleanup, then review 雅. Report readiness for owner acceptance. |
| Publication readiness | `content-review` | Review current files and prior handoff; report unresolved findings and GO / NO-GO. A repair starts a revision pass, then re-review affected stages. |

Run cleanup once per revision; downstream review assesses the result without silently rewriting it again. Review-only requests finish with findings rather than entering drafting. A later Chinese change requires rechecking affected English passages and metadata; record which stages were repeated. Research fallback follows `adr/0002-bilingual-fallback-policy.md`. Owner acceptance of translation review and publication remain separate confirmation points.

When maintaining these rules or skills, use `writing-check-cases.md` for manual workflow and preservation cases.
