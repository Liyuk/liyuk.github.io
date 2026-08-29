---
name: write-projects
description: Use when drafting a new project-collection write-up (engineering project or "work"-subtype entry under src/content/projects/) from scratch. Applies agent/category-guides/projects.md's problem-first structure and the required alternative-approach comparison for engineering projects.
---

# Draft a `project` entry

Read `agent/category-guides/projects.md` first — it explains the two subtypes (engineering vs. the "work" subtype for serialized novels) and which structure applies. This skill is the drafting sequence for the engineering subtype; a work-subtype entry should instead follow `agent/writing-style.md`'s narrative voice.

## Before drafting

1. Confirm the subtype: engineering (`repositoryUrl` required) or work (`workUrl` + `work` object). Check `src/content.config.ts` if unsure which fields apply.
2. Read `agent/category-guides/projects.md` for the full structure and the comparative-grounding requirement.

## Drafting an engineering project

1. Open with the actual problem and who has it — not a capability list. If the honest opening is "this exists because X was annoying," say that; don't manufacture a grander problem statement than the one that actually motivated the work.
2. Show the architecture where there's real structure to show. `agent/editorial-rules.md` owns which diagram answers which question and the English-label rule that applies in both `zh.md` and `en.md`; for a capability or layering overview, build it with `.claude/skills/house-diagram`.
3. Name at least one decision that could reasonably have gone another way, and the concrete constraint that made the alternative worse for this problem — not a generic "too complex" without a stated reason.
4. Report what actually happened: current status, real limitations, anything that didn't work as planned. `status: archived`/`maintained` should be an honest signal, not a label nobody revisits.
5. State the scope boundary once, plainly — what this project deliberately doesn't do.

## What NOT to do

Don't invent a straw-man alternative just to make the chosen design look better than the actual decision process was. Don't let the write-up read as a changelog with no judgment in it — the alternative-approach comparison is what turns "what was built" into "what was decided and why."

## Handoff

Same downstream sequence as any collection: `.claude/skills/humanize-writing` → translation via `agent/translation-spec.md` / `.claude/skills/xinda-ya-translation` → `.claude/skills/content-review` before `draft: false`. Engineering projects have no bilingual fallback exception — the English sibling is required.
