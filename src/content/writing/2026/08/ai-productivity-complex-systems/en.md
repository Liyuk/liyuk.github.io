---
title: "AI Does Not Create Productivity Directly: Local Acceleration, Workflow Redesign, and Cost Attribution in Complex Systems"
description: "Starting from a multi-system integration experience, this essay distinguishes creation, task efficiency, organizational productivity, and business value—and asks where value and cost actually come from when AI enters a complex system."
locale: en
translationStatus: draft
createdAt: 2026-08-26
publishedAt: 2026-08-26
draft: true
type: essay
tags: [ai, developer-productivity, systems, systems-design, architecture, metrics, observability, technical-planning, strategy]
citationUrls:
  - https://www.microsoft.com/en-us/research/publication/shifting-work-patterns-with-generative-ai/
  - https://www.nber.org/papers/w31161
  - https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-how-organizations-are-rewiring-to-capture-value
  - https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gencost02.html
  - https://shopify.dev/docs/api/storefront/latest/enums/orderfinancialstatus
  - https://docs.stripe.com/payout-reconciliation
translationKey: 2026/08/ai-productivity-complex-systems
---

I have become increasingly skeptical of a sentence that sounds straightforward: AI will directly create productivity.

AI clearly amplifies human creativity. A vague idea can quickly become text, code, a page, a workflow diagram, or a runnable prototype. It can also make particular tasks faster. But whether the created thing has value, whether the organization becomes faster, and whether the business outcome improves are three different questions.

The real question is not whether AI can generate things. It is how a result enters a real system, passes through users, workflows, and constraints, and becomes productivity that can be delivered reliably.

## One person getting faster does not mean the system gets faster

One of my main areas of work last year was integrating our systems with external companies such as OTAs, or online travel agencies. On the surface, this was interface development. In practice, it was closer to translating business models between two organizations.

Both sides had systems and interface documentation. Once integration began, however, we found that the definitions of finance, merchants, products, transactions, and orders did not fully match. The same field meant different things in different systems. The same status represented different stages. Some protocols looked similar, while their error handling and recovery paths were completely different. When different external companies each used different protocols and systems, the engineering problem was not a few interfaces. It was several realities without a shared model.

This kind of difference is visible even in public order-management systems. Shopify separates an order’s financial status from its fulfillment status, with financial states including authorized, paid, partially paid, pending, refunded, and voided. Oracle models the sales order, order line, fulfillment task, and orchestration process separately.[Shopify order financial status](https://shopify.dev/docs/api/storefront/latest/enums/orderfinancialstatus) [Oracle order status model](https://docs.oracle.com/en/cloud/saas/supply-chain-and-manufacturing/26b/fauom/order-management-statuses.html)

Worse, much of the important information was not in the documentation. It lived in historical compatibility, manual operations, exceptional customers, production experience, and assumptions shared within a team. At the hardest points, it was not only that we did not understand the other system; no single person inside the other company could explain their own system completely either. Meetings before integration helped, but could not always surface every difference. We often had to connect first, respond quickly, and learn as the system ran.

We often found the problem not during interface testing but during reconciliation: the orders looked successful, yet receivables, cash received, refunds, or settlements did not match. When the money does not reconcile, everything else becomes a problem too. Reconciliation turned hidden model differences into hard facts. Only then did we gradually add alerts, automatic recovery, staged status transitions, and, when necessary, status rollback and model migration.

Payment platforms likewise treat matching payment activity, payout batches, and bank deposits as a distinct reconciliation task rather than treating a successful API response as financial completion.[Stripe payout reconciliation](https://docs.stripe.com/payout-reconciliation)

Once this kind of system is running, the work becomes a loop that repeatedly checks the model against reality:

```mermaid
flowchart LR
    A["Interface connection"] --> B["Order and status mapping"] --> C["Production run"]
    C --> D["Reconciliation finds a mismatch"] --> E["Alert and localization"]
    E --> F["Automatic recovery or manual handling"] --> G["Model correction and monitoring"]
    G --> C
```

The engineering work then included:

- separating the business objects and state machines on both sides;
- mapping fields, models, and protocols;
- deciding which system owned which data;
- designing error, retry, migration, and reconciliation paths;
- instrumenting the system so problems could be localized rather than investigated by asking people;
- continuing to compare the model with what happened in production after launch.

Code was only part of the work. Even if AI helped engineers generate adapter code faster, it could not magically know the business meaning that both sides had left undefined. We did use AI extensively in this system work—I am certain of that because I led the effort. But AI accelerated local understanding, generation, investigation, and repair; it did not give us the other system’s complete context for free.

This is also where I began to separate knowledge accumulation from a vertical model. If a system continuously accumulates its own data, states, exceptions, mappings, and handling results, AI can become more familiar with that system and make many tasks easier. That does not mean the same experience will work equally well in another company. In my view, the marginal benefit of training a vertical model outside the enterprise’s own context can be limited, and a stronger foundation model may quickly absorb that advantage. The more durable value is often the organization of enterprise context so it can continuously feed back into and improve the current system.

## Creation, efficiency, productivity, and value

I now separate these terms:

| Layer | Question | Common mistake |
| --- | --- | --- |
| Creation | Can I make something new? | Treating existence as value |
| Task efficiency | Can one person complete a task faster? | Treating an individual gain as a team gain |
| Organizational productivity | Can the system reliably deliver more useful results with the same resources? | Looking only at calls, code, or time saved |
| Business value | Did revenue, cost, risk, or customer outcomes change? | Attributing every improvement to AI |

AI acts most directly on the first two layers. The latter two require organizational work: workflow changes, adoption, integration, quality checks, responsibility, and measurement.

Real-work studies by Microsoft and NBER support the claim that local improvements do not automatically spread. AI can materially improve the task productivity of customer-support workers; in another randomized experiment involving employees at large firms, AI mainly changed behaviors workers could change independently and had less effect on work patterns that required coordination.[NBER customer-support study](https://www.nber.org/papers/w31161) [Microsoft Research study](https://www.microsoft.com/en-us/research/publication/shifting-work-patterns-with-generative-ai/)

This does not mean AI has no organizational value. It means there is an intermediate chain:

```mermaid
flowchart LR
    A["Local capability"] --> B["Workflow change"] --> C["Role adoption"] --> D["System outcome"] --> E["Business value"]
```

If one link does not change, the improvement before it may remain a personal experience.

## In large companies, the bottleneck may not be execution speed

Large companies have strong processes, permissions, approvals, data systems, and responsibility boundaries. An engineer may write code faster with AI and still wait for product confirmation, compliance approval, cross-team integration, a release window, and production verification. The gains at one node can be absorbed by handoffs and waiting.

That is why giving everyone an AI tool rarely produces linear organizational productivity. The tool enters the organization, but the default path does not change. AI may simply help everyone produce intermediate artifacts faster, then push more review, coordination, and rework downstream.

Small companies can have the opposite experience. Their processes may be less fixed and their systems less complete. An AI project may also remove approvals, combine roles, rebuild data flows, and redesign delivery. The company may genuinely get faster, but it is difficult to separate the gain from AI itself from the gain from redesigning the process.

The more accurate statement is:

> AI does not automatically create organizational efficiency. It may trigger a redesign of the work system, or it may only speed up one node.

McKinsey’s enterprise survey identifies workflow redesign as an important factor associated with enterprise-level AI value, while noting that many organizations use AI without yet seeing significant enterprise-level EBIT impact.[McKinsey, *The State of AI*](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai-how-organizations-are-rewiring-to-capture-value)

## Redundancy should not always be removed

When people discuss AI transformation, they quickly suggest cutting redundant workflows. But systems contain two kinds of redundancy.

Some is harmful repetition: entering the same data into multiple systems, several teams repeatedly organizing the same material, approvals by people without clear authority, or manually synchronizing the same status across systems.

Some is resilience redundancy: backups, human review, retries, reconciliation, fallback paths, and multiple people who can take responsibility. These look repetitive, but protect the business when the system fails.

AI can help us find repetition. It cannot decide why the repetition exists. Removing resilience redundancy may reduce steps in the short term while increasing outage, recovery, or compliance costs over time.

The question for an FDE or systems designer is not simply “where can we automate?” It is:

- Is this step creating value, or compensating for a defect upstream?
- Can it be removed, or should it only be accelerated?
- Who carries the failure if it is removed?
- Did AI remove the bottleneck, or move it into review, data, or operations?
- Which necessary redundancies does this redesign preserve?

## AI cost is more than the model price

Business owners want AI to reduce cost, but AI also introduces cost. The price of one call is only the easiest item to see. Full cost includes:

```text
Total cost
= model calls
+ data processing and storage
+ system integration
+ evaluation and observability
+ human review and rework
+ training and workflow migration
+ security, access, and governance
+ long-term maintenance
```

Common enterprise cost controls now include using smaller models for simple tasks, routing different tasks to different models, caching repeated context, reducing agent loops, limiting meaningless output, batching non-real-time work, and observing how much each business task actually consumes.[AWS Generative AI Lens](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/gencost02.html)

Cost optimization still has to remain tied to business outcomes. The useful question is not only “what is the price per million tokens?” It is:

> How much does the business spend to solve one customer problem, deliver one order, or complete one training engagement? Did that unit cost fall after AI was introduced?

If AI saves one person two hours but adds three hours of review, rework, and maintenance, it has not really reduced cost. If a system redesign removes many useless handoffs and AI was only one trigger, the full gain should not be credited to the model.

## Be honest about attribution

The easiest mistake in an AI project is to attribute every improvement to AI.

A more honest account separates the sources of change:

- local execution speed from AI;
- less waiting from removing or combining workflow steps;
- less rework from unifying data and systems;
- lower coordination cost from changing roles;
- better recovery from monitoring and reconciliation.

These usually happen together. What a business needs is not a beautiful AI ROI figure, but an explainable causal chain: where the original problem was, what changed, who adopted it, how the result moved, and what the investment and side effects were.

This is how I understand productivity: not producing more things, but enabling a system to deliver useful results reliably under real constraints.

## What this means for FDEs

An FDE is not simply the person who hands an AI tool to a company. The role moves between several worlds: the owner’s operating goal, the business user’s workflow, the engineer’s system model, and the evidence from production.

An FDE needs to ask:

1. Is the owner trying to change revenue, cost, risk, or delivery capacity?
2. Which workflow is blocking that result?
3. Which facts are absent from the documents but determine whether the systems can connect?
4. Which node should AI accelerate, and which workflow should be redesigned instead?
5. What proves the pilot worked, and how will the team reconcile, stop, or roll back if it fails?

Without those answers, an FDE may deliver a runnable demo rather than a solution that can enter production.

AI makes “building something” easier. It does not make “what is worth building” clearer. Productivity begins when a generated result enters a business system, is adopted by the relevant roles, survives constraints and feedback, and ultimately changes the cost or quality of a unit of business output.
