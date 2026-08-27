---
title: "Quota Router: An Explainable Multi-Source Fallback Chain for DSH"
description: "A policy-only DeepSeek Harness plugin that builds ordered, explainable, auditable model candidate chains per task and advances along them within bounded failure rules."
locale: en
translationStatus: reviewed
translationKey: 2026/08/quota-router
createdAt: 2026-08-19
publishedAt: 2026-08-19
updatedAt: 2026-08-19
status: active
draft: false
repositoryUrl: https://github.com/Liyuk/dsh-quota-router
paperUrl: https://www.npmjs.com/package/@liyuk/dsh-quota-router
hero:
  src: /images/projects/quota-router/architecture.en.svg
  alt: "Quota Router inside DSH: a user turn enters the policy layer, passes through source priority, task-model mapping, and guardrails, then returns to the native DSH layer."
  caption: "Quota Router's architectural boundary: explainable model selection and fallback, without owning providers, credentials, or the model catalog."
tags: [agent, routing, algorithms, explainability, reliability, observability, typescript]
---

[View Quota Router on GitHub ↗](https://github.com/Liyuk/dsh-quota-router) · [View the published package on npm ↗](https://www.npmjs.com/package/@liyuk/dsh-quota-router)

> `@liyuk/dsh-quota-router` is a **policy-only plugin** for DeepSeek Harness (DSH). It does not register providers, store credentials, or guess model capabilities. It uses the routes DSH already knows to build an ordered, explainable, auditable candidate chain for each task, then advances along that chain within bounded failure rules.

## The problem

People who combine subscriptions, free shared pools, and paid APIs run into the same failures: a quota exhaustion ends the turn; simple tasks accidentally use expensive models; rate-limit jitter causes repeated retries on a broken route; and afterward it is unclear which model was used or why.

The root cause is that two separate decisions are often mixed together:

1. **Which source should be tried first?** A global cost-and-risk ordering, such as subscription → free → paid.
2. **Which model should this task use at that source?** A task-quality decision, such as a mini model for simple work and a stronger model for difficult coding.

Quota Router makes these dimensions orthogonal: sources have global priorities, while task profiles map each source to a model.

## Source priority × task model

![Quota Router's architectural boundary inside DSH](/images/projects/quota-router/architecture.en.svg)

The configuration expresses two concepts:

```yaml
sources:            # global source order
  - { id: opencode-go, provider: opencode-go, tier: subscription, priority: 1 }
  - { id: token-share, provider: token-share, tier: free, priority: 2 }
  - { id: starchasing, provider: starchasing, tier: paid, priority: 3 }

profiles:           # model used at each source for each task
  - id: coding
    keywords: ["write code", "fix", "bug"]
    modelBySource: { opencode-go: mimo-v2.5, token-share: gpt-5.6-luna }
  - id: hard-coding
    keywords: ["deadlock", "concurrency"]
    modelBySource: { opencode-go: mimo-v2.5, token-share: gpt-5.6-terra }
```

At runtime, the message first matches a profile using first-match semantics. The profile's model mapping is then expanded with the global source order into a task-specific candidate chain. `coding` and `hard-coding` can share the same inexpensive primary while falling back to Luna and the stronger Terra respectively. The router preserves `profileId + candidateIndex` for each DSH turn instead of remembering only the current provider/model.

## What happens on failure

Failure classification is deliberately conservative: stable failures such as exhausted quota, insufficient balance, and 401/403 responses advance immediately to the next healthy candidate; transient failures such as rate limits, 5xx responses, timeouts, and interrupted transport are first handed back to DSH for normal retry, then advance only after the threshold enters cooldown; context overflow and similar failures stay put because changing models cannot solve them. Candidates move forward only, `paid` sources are skipped by default, and selections and cooldowns remain inspectable in the in-memory ledger. The complete failure table, four invariants, and implementation details live in [Engineering Design and Routing Algorithms](/en/projects/2026/08/quota-router-engineering/), so this page does not repeat them.

## The Settings page

The plugin includes a DSH Web page at Settings → Quota Router:

- the first screen expands each task into a candidate chain and distinguishes automatic candidates, skipped candidates, and paid protection;
- sources can be reordered, providers are selected from DSH's local catalog, and model fields provide catalog completion;
- duplicate IDs, missing keywords, and unknown source references are reported before saving;
- the interface makes responsibilities explicit: users configure priorities and mappings, the plugin guarantees first-match/forward-only/cooldown, and DSH owns providers, credentials, and the model catalog.

Configuration is written back through optimistic revision control and candidates are revalidated live, without a restart.

## Task-aware subtask routing and cost accounting

v0.2+ also exports `SubtaskRouter`, so a subtask already decomposed by an Agent or Planner keeps a stable model lease across turns. The router can also audit primary-selection share, fallback recovery, and token usage by tier, distinguishing “a cheaper model was selected” from “the system actually saved money.” The interface example, idempotency rules, and savings formula are documented in [Engineering Design and Routing Algorithms](/en/projects/2026/08/quota-router-engineering/).

## Safety model and boundaries

| Area | Owner |
| --- | --- |
| Source order, task mappings, thresholds, cooldowns | User configuration |
| first-match, forward-only, and cooldown algorithms | Fixed plugin implementation |
| Provider registration, credentials, model catalog, adapter retries | Native DSH layer |

`tier` is a cost-and-purpose label. It does not query prices or balances and does not secretly reorder sources. The plugin does not fabricate messages, inject events, or modify context compaction.

## Quick start

```bash
npm install @liyuk/dsh-quota-router
```

Configure the policy in DSH's `quota-router` namespace or open Settings → Quota Router. Use `quota_router_status` at runtime to inspect decisions, cooldowns, and usage.

The project is currently published as npm `v0.1.3`. Development verification includes `pnpm test` (44 unit/integration tests), real DSH AgentLoop acceptance, type checking, and a production build.
