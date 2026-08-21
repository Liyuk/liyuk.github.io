---
title: "Shared Core and Local Variation: How Multi-Region Systems Evolve"
description: "A multi-region system can neither cram every difference into a single core nor rebuild everything for each region. The key is to identify stable boundaries, preserve extension points, and clarify module ownership."
locale: en
translationStatus: reviewed
createdAt: 2023-03-29
publishedAt: 2023-03-29
type: essay
tags: [architecture, engineering, systems-design, technology]
column: { slug: technical-systems, order: 4 }
translationKey: 2023/03/shared-core-and-local-variation
---

When a system begins serving a second region, a second kind of customer, or a second business line, teams often fall into a dilemma: keep making another copy and worry about maintenance costs spiraling out of control, or immediately turn it into a "unified platform" and discover that the real differences are far more numerous than expected. Each end of the spectrum has its own lessons.

Behind the dilemma is the fact that the system has not yet distinguished what has become stable from what is still changing.

## Unification and Customization Are a Sliding Scale

Unification and customization are not an either-or choice, but a sliding scale adjusted as conditions change. When the foundational capabilities are solid, the domain knowledge is clear, and the business model is stable, unification can reduce duplication and give collaboration a common language. Conversely, when the business is still being explored, regional differences are large, or the team has not yet understood the domain boundaries, keeping customization is often more honest.

The problem is not which end to choose, but whether you can adjust as conditions change. A booking service that, early on, allows different venues to have different processes may be safer than immediately abstracting a "universal workflow"; only when rules for cancellation, confirmation, notification, and the like keep appearing in a stable way is there evidence to support extracting a shared core.

### Three Sources of Over-Design

- Weak foundations: the underlying capabilities are unstable, yet complex abstractions are layered on top first.
- Unclear domain: not knowing why business rules exist, and treating accidental similarity as inevitable commonality.
- Unclear business: goals and future changes have not been spelled out, so the architecture can only guess at the future.

## Distinguish the Core from Variation First

Suppose a booking service first runs in one city and later needs to support different business hours, cancellation rules, and reminder styles. Accounts, booking status, and the basic notification flow are likely the shared core; local rules, copy, and approval processes are better placed in an explicit extension layer.

The key is not to put everything into the same codebase, but to give every difference a clear place. If each region directly modifies the core, they will block each other in the long run; if the core is designed up front for every imaginable change, complexity will arrive before value.

## Abstract After Stabilization

Abstraction should follow repeated, stable patterns. Two regions happening to be similar does not mean you have found the domain model; when similar needs keep appearing and the differences can also be named, extracting them into an interface, configuration, or shared module is more reliable.

Before each abstraction, ask four questions first:

- Has this rule already appeared stably across multiple scenarios?
- Is the difference a matter of parameters, or of the process itself?
- If one scenario changes, must all scenarios change together?
- Once shared, who is responsible for maintaining it?

If you cannot answer clearly, keep the local implementation first; it is safer than building a platform too early. Deferring abstraction is accumulating evidence for the right design, not giving up on design.

## Ownership Matters More Than Directory Structure

A shared module needs clarity on who maintains it, who can change it, and how changes are reviewed. Cross-team changes are not forbidden, but the module owner should understand the scope of impact, and tests should cover the truly common paths.

## The Stages from Copying to Sharing

Early copying is not always a bad thing: it lets the team see the real differences faster. The key is to record which rules keep appearing and which differences have stable names. Only when similar needs appear repeatedly and the differences can be clearly described is it worth extracting interfaces, configuration, or shared modules.

## A Composite Case: The Universal Configuration Center

A team built a "universal configuration center" for three kinds of business, hoping to write every difference into the same configuration table. Half a year later, only a few people could understand the rule combinations, and whenever a new business had an exception, a switch was added to the core. The problem was not configuration itself, but mistaking process differences for parameter differences. The team later kept the stable account and record capabilities and moved the different approval processes to an adaptation layer; new scenarios were first implemented locally, and sharing was discussed only after they kept recurring.

The goal of a multi-region system is not "a single copy of the code", but to let sharing bring real benefit and let change not harm other users. With clear boundaries and clear responsibilities, the system has a chance to evolve together with its regions and businesses. Good architecture lets the team adjust at a reasonable cost when change comes; being able to move boundaries as the facts change is what counts as architectural judgment.
