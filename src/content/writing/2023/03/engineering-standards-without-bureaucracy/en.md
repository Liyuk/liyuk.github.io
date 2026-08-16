---
title: "How Engineering Standards Reduce Rework Without Creating Bureaucracy"
description: "Good standards don't turn every step into an approval; they make the key handoff points — where distortion, rework, and accidents are most likely — visible, discussable, and reusable."
locale: en
translationStatus: draft
createdAt: 2023-03-13
publishedAt: 2023-03-13
type: essay
tags: [engineering, process, collaboration, technology]
column: { slug: technical-systems, order: 3 }
translationKey: 2023/03/engineering-standards-without-bureaucracy
---

> This article expands on the "closed loop" thread from [Management Retrospective](/writing/2026/08/management-retrospective/).

Teams often swing between two kinds of failure: with no standards, everyone moves forward on personal experience and problems only surface at the last moment; once standards multiply, people get busy filling forms, attending meetings, and waiting for approvals, and delivery slows down instead.

I have lived through both, and I have personally created the latter — for a while I believed that "the more complete the process, the more professional," and standards turned into a ritual that let people fill something out and then be absolved of responsibility. Only later did I figure out the real question: it is not "whether to have process," but whether the process is protecting important judgments.

## Start Designing from the Rework

Suppose a small feature is rejected three times: the first because the goal was not made clear, the second because the plan missed an exceptional path, and the third because after launch nobody knew how to observe the outcome. At that point there is no need to immediately add ten more meetings; instead, establish minimal agreements against those three points of distortion: before starting, write down the goal and the completion criteria; for risky changes, leave a one-page design note; after release, confirm who watches which signals and how often they revisit them.

Standards should come from recurring losses, not from "what a mature team seems like it ought to have." A step that has never caused a problem is not worth forcing everyone to pay the same cost — this single criterion can block more than half of all excessive process.

## Standards Need Tiers and Exits

Not every task needs a full review. You can differentiate by scope of impact: changing copy and changing the payment path should not go through the same procedure; routine changes can rely on automated checks, while cross-module or irreversible changes need a deeper design discussion.

Just as important is an exception mechanism. Emergency fixes can of course simplify the process, but they must leave behind the responsibility to fill in the gaps afterward. A standard without an exit gets bypassed; an exception without backfill gradually becomes the new normal — this is the most typical path by which process decays.

## A Minimal Delivery Closed Loop

Any team can start by answering five questions:

- What outcome is this change meant to produce?
- Which dependencies and failure paths must be stated up front?
- Who is responsible for design, implementation, acceptance, and release respectively?
- What are the minimum checks and the rollback plan before going live?
- After launch, what signals do we watch and when do we revisit them?

They can be written in the task description or a one-page design document; the key point is that they must not live only in one person's head. The purpose of a standard is to make the answers shareable, not to make the answers complicated.

## What You Measure Is Rework and Uncertainty

A good standard should let people know earlier: who is responsible, what counts as done, where the risks are, and how to handle things once change happens. What it reduces is not all communication, but pointless waiting, repeated explanations, and last-minute surprises.

Process is not a substitute for responsibility: a clearly named owner with no minimum standard means every discussion starts from scratch; a long process with no owner just gets handed back and forth. Every quarter I do a "delete process" exercise: what loss has this step prevented recently? Can it be automated or downgraded? Delete the steps that cannot answer. Regularly removing steps that nobody uses and whose value cannot be explained matters more than continuing to add new process.

Standards are not decoration for organizational maturity; they are the minimal scaffolding left in place for shared judgment.
