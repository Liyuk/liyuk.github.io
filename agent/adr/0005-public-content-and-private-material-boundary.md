# ADR 0005: Public content, git-tracked standards, and private material

- Status: Accepted (revised 2026-08-21 — see "Revision" below)
- Date: 2026-08-19

## Decision

`src/content/` and the build output are public; they must never carry tokens, subscriber data, personal absolute paths, or unpublishable raw material.

`docs/` is ignored **in its entirety, with no allowlisted subdirectory**. It holds personal work logs, one-off analyses, series plans, and pre-migration source material — write-once notes for the owner's own later reference, never a repository contract, never cited as required reading for a change, never a place CI or a reviewer is expected to look.

Any standard that must survive across sessions or be visible to a person or agent working from a fresh clone — editorial rules, the writing voice, translation mechanics, category-specific writing structure, architecture notes, and design decisions — lives in git-tracked files: root `AGENTS.md` and `CONTRIBUTING.md`, and the `agent/` directory (including `agent/adr/` for decision records like this one). `.claude/skills/` holds the Claude Code skills that operationalize those standards.

`audit:content` blocks structural problems it can detect for certain (tag registry misses, inconsistent bilingual metadata, malformed URLs, secret-shaped strings) and prints a warning for judgment calls (a `localhost` example, a research entry's translation fallback) that the publisher must confirm by hand.

## Rationale

This is a public GitHub Pages repository. Engineering and editorial standards need to be reviewable and to travel with the repo regardless of which machine or agent is working on it; personal career strategy, raw interview material, and internal analysis must not enter Git or the deployed site just because a Markdown file was convenient to write.

## Revision (2026-08-21)

The original version of this ADR described an "allowlist" that would keep specific `docs/` subdirectories (`docs/adr/`, `docs/engineering/`, …) tracked despite the general ignore rule. That allowlist was never implemented — `.gitignore` ignores `docs/` outright, and no file under `docs/` was ever tracked — and the owner has since confirmed the simpler rule is the intended one: **`docs/` has no exceptions**. This revision retires the allowlist language and formalizes `agent/` as the sole home for anything under `docs/` that turns out to need to be shared. The five ADRs that were drafted under the old allowlist assumption (this one included) moved from `docs/adr/` to `agent/adr/` as part of this revision, unchanged in substance.

## Constraints

A new engineering or editorial standard goes into `agent/` (or root `AGENTS.md`/`CONTRIBUTING.md`), never into an exception carved out of `docs/`. If a document mixes a public workflow with private material, split it before either half is placed. Loosening this boundary again requires updating this ADR first and stating the public-exposure risk in the change that does it.
