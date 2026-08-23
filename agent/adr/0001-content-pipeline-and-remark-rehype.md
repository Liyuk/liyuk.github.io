# ADR 0001: Keep Astro Content Collections and the unified/remark-rehype pipeline

- Status: Accepted
- Date: 2026-08-19

## Context

The site must carry Markdown/MDX, Mermaid, math, code highlighting, and static image processing, with content entering a typed Astro collection at build time and ending as deployable static HTML.

## Decision

Keep Astro Content Collections and the existing Astro Markdown integration with the unified/remark-rehype plugin chain. The content schema is frontmatter's machine contract; pages and scripts read it only through the shared helpers in `src/lib/`.

## Rationale

- Build-time processing means the published site has no runtime database or CMS dependency.
- Schema validation, image audits, build, and page generation all verify inside one publish gate.
- Mermaid and KaTeX already run through build-time plugins; introducing a second Markdown parser isn't justified.
- unified's plugin boundaries are granular enough to replace a single processing stage later without rewriting the content model.

## Constraints

A new plugin must state its build cost, output safety, and whether it needs a browser dependency; do not re-parse frontmatter inside page components. Any upgrade that changes Markdown output semantics must add a fixture or page smoke test.
