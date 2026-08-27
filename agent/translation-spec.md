# English translation spec

This document is the single source of truth for producing the English (`en.md`)
version of every content entry. Each article may be translated by an independent
agent; follow these rules exactly so the result stays consistent and passes the
strict content schema and the publish gate. `agent/editorial-rules.md` sets the
quality bar (信达雅) this spec's mechanics serve; the
`.claude/skills/xinda-ya-translation` skill operationalizes both together.

## Where files live

Every Chinese source is a `zh.md` next to dated directories (`writing`,
`research`, `projects`, `consulting`) or a flat file (`galleries`). The English
version is a sibling `en.md` in the **same directory**:

```
src/content/writing/2026/08/example/zh.md
src/content/writing/2026/08/example/en.md   ← create this
```

Galleries are flat and keyed by slug, not by a dated directory:

```
src/content/galleries/maomao.md
src/content/galleries/maomao.en.md          ← create this (en)
```

Never rename or move the `zh.md`. Never touch `_template.md` / `.gitkeep`.

## Frontmatter rules

Start from the `zh.md` frontmatter, then apply these transforms:

### Quoting (critical)

English text often contains an ASCII `: ` (colon + space) or a `#`, which
**breaks unquoted YAML** (the Chinese sources use full-width `：`, so they were
safe). To be safe, **always wrap translated human-facing strings in double
quotes**, for example:

```yaml
title: "Why Code Decays: From Local Convenience to Debt"
description: "A command-driven workflow: the author drives with short commands."
```

Quote these fields: `title`, `description`, `hero.alt`, `hero.caption`,
`work.penName`, `work.platform`, `work.status`, and gallery `alt` / `caption`.
If a value contains a double quote, escape it as `\"` (or use single quotes
around the whole value). Do **not** quote slugs, tags, dates, URLs, enums,
`version`, or numeric values like `width` / `height`.

1. **Translate** `title` and `description` into natural, idiomatic English.
2. **Set** `locale: en`.
3. **Set** `translationStatus: draft` (machine/AI translation, not yet
   human-reviewed). Only a human reviewer flips it to `reviewed` after checking
   it against the 信达雅 standard in `agent/editorial-rules.md`.
4. **Set** `translationKey` to the locale-free path shared by both languages:
   - dated collections: the directory path relative to the collection root,
     e.g. `2026/08/example`
   - galleries: the slug, e.g. `maomao`
5. **Copy verbatim, do not translate**:
   - dates: `createdAt`, `publishedAt`, `updatedAt` (same values)
   - `draft`, `featured`, `type`, `format` (same values / same presence)
   - `tags` (these are stable slugs, never translate them)
   - `column` (slug + order unchanged)
   - enums: top-level `status` (`active` / `preprint` / …) and `version`
   - URLs: `repositoryUrl`, `paperUrl`, `workUrl`, `citationUrls`
   - `hero.src`, image `src`, image `id`, image `width` / `height`
   - gallery `slug`, `cover`, and each image `id`
   - `episode` (consulting)
6. **Translate** these human-facing strings:
   - `hero.alt`, `hero.caption`
   - `work.penName` → keep the romanized/English form used on the About page
     (`盗火的魔法师` → `The Fire-Stealing Magician`)
   - `work.platform` (e.g. `起点中文网` → `Qidian`), `work.status`
     (e.g. `连载中` → `Serializing`)
   - `guest` (consulting — a role/description, not a real name; see
     `agent/category-guides/consulting.md` for de-identification rules)
   - gallery `title`, `description`, and each image `alt` and `caption`

7. **Strict schema (`writing` and `consulting` only).** Both collections use
   `.strict()`, so the `en.md` frontmatter must contain **only** the keys
   declared in `src/content.config.ts` for that collection — nothing else.
   Check the current schema before translating; do not carry over a `zh.md`
   key that isn't in it, and add only the new locale/translation keys
   (`locale`, `translationStatus`, `translationKey`).

## Body translation rules

Translate the **entire** Markdown body faithfully and idiomatically, preserving
structure exactly (heading levels, lists, tables, blockquotes, horizontal rules).
Structure is fixed; sentence-level phrasing is not — see "Sentence-level
freedom vs. structural fixity" below.

- **Prose**: translate naturally, restructuring sentences and clauses the way
  an English writer actually would — do not preserve Chinese sentence order,
  clause sequencing, or connective words where English idiom would organize
  the same content differently. Keep the author's voice, argument, and
  judgment; do not add facts, opinions, or explanations that are not implied
  by the source, and do not drop or soften a claim.
- **Headings**: translate the wording; do not add, remove, merge, split, or
  reorder headings, and do not change heading level.
- **Fenced code blocks** (``` ```, ```sh ```, ```json ```, ```jsonc ```,
  ```text ```, etc.): keep the code and its content **verbatim**. Do not
  translate inside code fences — this includes comments and JSON string values.
- **Mermaid blocks** (``` ```mermaid ```): node labels stay in English in both
  languages per `agent/editorial-rules.md` — there is nothing to translate here
  beyond keeping the diagram syntax exactly as-is.
- **Images**: keep the path (`./images/…` or `/images/…`) unchanged; translate
  the alt text (and any caption).
- **Links**: keep the URL/`href` unchanged; translate the visible link text.
- **Inline math** `$…$` and **block math** `$$…$$`: keep as-is (English
  variable names already, per `agent/editorial-rules.md`).
- **Inline code** `` `…` ``: keep as-is.
- Keep the same paragraph/line structure where practical so the translation
  stays auditable line-by-line against the source.

## Sentence-level freedom vs. structural fixity

Two different things both get called "faithful," and conflating them produces stiff, over-literal English:

- **Fixed, never reorganized:** frontmatter `title`, the collection an entry belongs to, heading count/level/order, section order, and which claims appear at all. A reviewer should be able to map every heading and paragraph 1:1 back to the `zh.md` without hunting for where content moved.
- **Free to restructure at the sentence level:** clause order, sentence boundaries (splitting one long Chinese sentence into two English ones or vice versa), connective words, and word choice. A translator second-guessing whether they're "allowed" to reorder a clause because 信 is the top-priority check has the priority backwards — 信 constrains *what claims survive*, not *what word order they survive in*. Rewrite the sentence the way an English piece making the same argument would actually be written.

## Term glossing (proper nouns and institutional shorthand)

Some Chinese source terms assume shared context a reader has by living in the same professional culture — a job-level label (`P7`), a company-size shorthand (`大厂`), a platform name (`起点中文网`) — that an English-only reader has no way to place. Where the term is load-bearing enough that leaving it opaque would cost the reader real understanding, add a short descriptive gloss inline rather than leaving the bare term or a literal-but-empty translation:

- `起点` → `Qidian, a major Chinese web-fiction platform` (not just `Qidian`).
- `大厂` → `a large tech company` (not a literal rendering that means nothing outside Chinese tech culture).
- A job-level label like `P7` → keep the label and add what tier it roughly denotes (`P7, a senior engineering level`), not a guessed Western-company equivalent.

This is a narrow exception, not license to explain culture generally:

- Gloss only proper nouns and institutional shorthand the argument actually depends on — not every culturally specific reference.
- The gloss is a short descriptive clause, not a new sentence, a caveat, or an opinion. It does not add a claim the Chinese didn't make.
- Do not use glossing as a workaround to restructure or soften a claim; if a term doesn't need a gloss to be understood in context, don't add one just to be thorough.

## Style

- Natural, professional English; no literal word-for-word translation. See
  `agent/editorial-rules.md` for the full 信达雅 standard this serves.
- Prefer plain language matching the source's register (essays are direct and
  practical; research papers are formal and precise; consulting pieces keep the
  dialogue's spoken cadence in quoted lines).
- Keep technical terms stable across articles (e.g. `canon`, `chapter
  contract`, `evidence context`, `review finding`, `settlement`). When a term is
  already established in English in the source (like CanonLoom's S0–S6 stage
  names), keep it exactly.

## Do not

- Do not translate `tags`, `column`, `status`, `version`, URLs, dates, `slug`,
  `cover`, image `id`/`src`/`width`/`height`.
- Do not change `draft` / `featured` / `type` / `format` values.
- Do not add or remove headings, sections, images, or code blocks.
- Do not modify `zh.md` or any other file.
