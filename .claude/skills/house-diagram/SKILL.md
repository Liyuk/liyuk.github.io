---
name: house-diagram
description: Use when a writing or projects entry needs a structure map — an article explaining how a platform, architecture, capability system, or reusable engineering method is organized. Builds a goal-driven hierarchy: design goal → layers → modules → classifications. Reach for a dependency, flow, or state diagram instead when the reader's question is what calls what, how to decide a case, or how something moves through a lifecycle.
---

# House diagram

A house diagram is the structure-map case in `agent/editorial-rules.md`. Read that section first: it decides when a diagram earns its place at all, and it owns the English-label and bilingual-equivalence rules this file does not restate.

The shape is a goal-driven capability map, not a building metaphor:

```text
design goal
    ↓ layers
    ↓ modules within each layer
    ↓ categories within each module
    ↓ observable outcome or operating constraint
```

The roof is the design goal: one sentence naming the outcome and the constraint the architecture must satisfy. The body decomposes that goal into layers and modules. The bottom bar states the resulting value, boundary, or invariant.

## When it applies

Use this skill when the article's argument is itself structural — the reader needs to see how a capability space is divided, what each layer owns, and where a new capability or difference belongs.

A piece about one incident, one code fragment, or a personal reflection carries its argument in prose; leave it there. `.claude/skills/write-writing` and `.claude/skills/humanize-writing` both read a diagram added to make an article resemble the site's technical pieces as an AI signal. This skill is for the case where the structure is real and the reader needs to see it.

## Build

### 1. State the design goal

Write an outcome with a tension in it. `Reuse stable capabilities while keeping local differences governable.` is a goal. `Configuration Platform`, `System Architecture`, and `Technical Solution` name subjects, and a roof that names the subject repeats the title.

### 2. Choose three to five layers

Each layer holds a different kind of responsibility, stability, or decision. Common options: domain facts and ownership; shared capabilities and protocols; policy, configuration, and orchestration; presentation and operations; governance and feedback loops. Derive the actual layers from the article's own argument — a layer answers "what kind of thing belongs here?" rather than "which team owns it?"

### 3. Fill modules and classifications

Two to five modules per layer, each carrying a second-level classification where the reader needs its internal shape:

```text
Domain capability layer
  Commerce
    price · inventory · orders · entitlements
  Search
    index · retrieval · ranking · result contract
```

Keep the overview legible and move detailed flows, schemas, and state transitions into child diagrams or prose.

### 4. State the invariant below the figure

One paragraph of architectural judgment: what may vary, what must stay stable, and what would count as crossing a boundary. For example: configuration may alter presentation and policy, and it stops short of becoming a hidden transaction engine or writing another domain's facts.

## Poster composition (optional)

When the article calls for a consulting-style capability poster, add this visual grammar on top of the semantic hierarchy:

```text
┌─ title / framing ────────────────────────────────────────────────┐
│                         roof: one goal                           │
├──── left rail ────┬──────── central body ────────┬──── right ────┤
│ context, scope,   │ layer 1: capability family   │ rail:         │
│ entry conditions  │   module → classifications   │ governance,   │
│                   │ layer 2 …                    │ constraints   │
├───────────────────┴──────────────────────────────┴───────────────┤
│ bottom bar: observable outcome, invariant, or decision boundary  │
└──────────────────────────────────────────────────────────────────┘
```

The rails are semantic regions: the left answers "from what context or entry point?", the right answers "what governs, constrains, or operationalizes it?". A rail with no real content is omitted. The roof holds one goal; the bottom bar holds a consequence or invariant.

Plan the composition before writing any diagram syntax:

```text
Title / framing: [what the reader is looking at]
Roof goal: [outcome + tension]
Left rail: [context / entry conditions, or omitted]
Central layers: [3–5 layers; each with 2–5 modules]
Right rail: [governance / constraints / operations, or omitted]
Bottom bar: [outcome / invariant / decision boundary]
```

A reference poster supplies composition only. This article keeps its own evidence, wording, colors, typography, and box count.

## Medium

Mermaid is the default and stays the semantic source: one outer `flowchart TB`, one roof node, one `subgraph` for the body, optional rail subgraphs, the body visually dominant. Prefer orthogonal relationships over connecting every module to every other one.

The medium follows what the figure has to show, not what is quickest to write. A composition Mermaid can only render as unreadably small text becomes a designed SVG or HTML figure, with the Mermaid kept as its source of structure. Authored SVG covers exactly what can be specified precisely — countable boxes, rails, flat shape systems — which is what a house diagram is.

Check the figure at desktop and narrow mobile widths. A diagram that shrinks into a miniature poster on mobile gets shorter labels, fewer crossing edges, a vertical layout, or a split into two figures.

## Review checklist

- The roof states a design goal, not the article's title.
- A reader can tell what each layer owns.
- Every module carries a clear category or boundary.
- The map stays distinct from any dependency, flow, or state diagram beside it.
- A reader can use the map to place a new capability or difference.
- The worked example is public or fully anonymized, and it demonstrates a boundary.
- `zh.md` and `en.md` are structurally equivalent.
- The figure is legible at desktop and mobile widths.

The house diagram is a reader-facing map and a thinking aid. It shows the architecture the article's evidence already supports.
