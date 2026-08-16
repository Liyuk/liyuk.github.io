---
title: "Data Measurement Guide (Part 3): Metric Tiers, Let Data Serve the Most Important Decisions First"
description: "Don't lay metrics flat on the dashboard: prioritize them by task relevance, scope of impact, actionability, and data trustworthiness, and choose what to watch at each stage."
locale: en
translationStatus: draft
createdAt: 2021-04-08
publishedAt: 2021-04-08
type: essay
tags: [data, metrics, collaboration, measurement]
column: { slug: data-metrics-guide, order: 3 }
translationKey: 2021/04/metric-tiers-prioritize-decisions
---

A dashboard can hold dozens of metrics, but human attention cannot. Without tiering, teams are easily drawn to the most prominent, fastest-moving numbers while ignoring the signals that actually determine user outcomes.

Metric tiering is not about labeling data as "advanced" or "basic"; it answers two working questions: **How close is this metric to the user's goal? If it changes, can we take different action?** The former decides whether it is worth observing first; the latter decides whether it is worth maintaining continuously.

Below is a four-tier metric model, illustrated throughout with the task of "a user searching for and opening a result." It applies to product, growth, experience, and technical quality; specific goals and thresholds should be decided by each context.

## 1. First tier by distance from the user's task

| Tier | Question it answers | Typical metrics | Primary use |
| --- | --- | --- | --- |
| L1: Task outcome | Did the user accomplish what they set out to do? | Task completion rate, conversion rate, retention, successful task count | Judge whether the goal was achieved |
| L2: Experience guardrails | Did completing it incur costs that shouldn't have been paid? | Visible waiting, timeout rate, jank, share of affected users | Prevent optimizing only the outcome number while harming the experience |
| L3: Process diagnosis | Which part of the path or which conditions may have caused the change? | Per-step conversion, error category, version distribution | Narrow the search area and validate hypotheses |
| L4: Data quality | Can these numbers themselves be trusted? | Event coverage, duplication rate, latency, state closure rate | Prevent acting on bad data |

The four tiers are not a one-way causal chain. A rise in L3 error rates does not necessarily cause L1 to fall, and L1 may fluctuate because of changes in entry points, user intent, or product strategy. The value of tiering is this: first check whether the outcome changed, then use guardrails to judge the cost to users, and finally use diagnostic metrics to find evidence—while keeping a check on data quality at all times.

## 2. Break "important" into four judgeable dimensions

Even metrics at the same L1 tier do not all deserve the same frequency of attention. Use the following four questions for lightweight ordering.

| Dimension | Question to answer |
| --- | --- |
| Task relevance | How close is it to the task the user needs to complete? |
| Scope of impact | How many users and scenarios will a change affect? |
| Actionability | After the value changes, what different action can the team take? |
| Data trustworthiness | Are coverage, latency, and definition solid enough to support this judgment? |

I do not recommend attaching a falsely precise score to each metric. The purpose of the four questions is to make "why look at this first" something that can be stated clearly.

### Example: ordering metrics for a search task

| Metric | Tier | Why it is prioritized |
| --- | --- | --- |
| Search task completion rate | L1 | Directly answers "did the user find and open the desired result" |
| User-visible completion rate | L1 | Excludes cases where the backend succeeded but the user never perceived a result |
| P95 result wait, exit rate after no results | L2 | Guardrail: result improvements must not come at the cost of waiting or abandonment |
| Request error rate, distribution by network/version | L3 | Locate which path and which conditions the change comes from |
| Start-to-open association rate, event latency | L4 | First confirm the completion rate itself can be trusted, then talk about attribution |

This also explains a common mistake: treating the most easily obtained technical metric as the highest-tier goal. Cache hit rate can be quite valuable, but if users still cannot find a result, it is not proof of success.

## 3. Different stages, different metric combinations

Metric priority is not permanently fixed. As a task moves from pre-launch to early validation to scaled operation, the signals most worth watching change.

| Stage | Primary focus | Example (page load optimization) |
| --- | --- | --- |
| Pre-launch | Whether key content is visible and whether failure has a clear state | Content visibility, failure state, basic load duration |
| Early validation | Scope of impact, failures and costs | Share of affected users, load failures, task completion rate |
| Scaled operation | Long tail, segmentation, and their link to business outcomes | P95/P99 long tail, segmentation by device/network, INP/CLS |
| Post-optimization review | Goal improved with no other regressions | Key task completion rate, INP/CLS not regressed |

### Example: page load optimization

Before launch, do not only record LCP or FCP; also confirm whether key content is actually visible and whether failure has a clear state. During early release, prioritize the share of affected users and load failures rather than rushing to compare some individual resource. Only after things stabilize is it more appropriate to analyze the P95/P99 long tail by device capability, network condition, and page type. After optimization is done, in addition to load metrics, check whether the key task completion rate, INP, and CLS have not regressed.

## 4. Build three lists: "core, watch, on-demand"

Beyond the four-tier model, you also need to decide on monitoring frequency. One practical approach is to divide metrics into three lists.

| List | Meaning | Entry condition |
| --- | --- | --- |
| Core | Each has a definition card, baseline, paired guardrails, and data quality checks | When it changes, the team knows who does what |
| Watch | Review trends regularly; expand analysis only on anomaly | Has diagnostic value but is not for daily decisions |
| On-demand | Query only when a specific problem needs locating | Low-frequency, scenario-specific, not resident on the dashboard |

The core list should be short. Every core metric must have a definition card, a baseline, paired guardrails, and data quality checks. If you cannot state who does what when it changes, it should usually be demoted to a watch or on-demand metric.

## 5. How to run a tiering review

There is no need to hold a long dedicated meeting. Pick one task and spend 30 minutes on the following questions:

- What is the user's completion outcome? Which L1 metric represents it?

- Which costs must not be masked by outcome improvements? Choose one or two L2 guardrails.

- If the outcome or guardrails change, which three L3 metrics should you check first?

- Which missing L4 checks would invalidate all conclusions?

- Which metrics go on the core list, and which are kept only as watch or on-demand?

### Example output

Task: a user searches for and opens a result
Core: search task completion rate; user-visible completion rate
Guardrails: P95 result wait; exit rate after no results; related feedback per million active users
Diagnosis: request error rate, index or resource load success rate, distribution by version/network
Data quality: start-to-open event association rate; event latency; duplicate reporting rate
On-demand: specific query categories, single-resource cache metrics
This is not about getting everyone to agree on a single answer; it lets different roles discuss trade-offs from the same tiered structure: some care about task outcomes, some about experience costs, some are responsible for locating evidence—but no one will mistake each other's metrics for competing priorities.

## Conclusion: few but actionable beats many that no one uses

A good metrics system is not an exhaustive record; it is a deliberate allocation of attention. Protect the key task first, then watch the experience guardrails, use diagnostic metrics to explain changes, and keep checking data quality. Only then does data turn from a dashboard that "anyone can look at and no one owns" into a working system that truly supports decisions.
