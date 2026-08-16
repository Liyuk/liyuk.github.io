---
title: "Data Measurement Guide (Part 4): The Metric Dictionary Template — Turning Definitions into a Recomputable Collaboration Interface"
description: "A ready-to-copy metric dictionary template, plus public examples for completion rate, retention, conversion, error, experience quality, and feedback metrics."
locale: en
translationStatus: draft
createdAt: 2021-04-20
publishedAt: 2021-04-20
type: essay
tags: [data, metrics, collaboration, measurement]
column: { slug: data-metrics-guide, order: 4 }
translationKey: 2021/04/metric-dictionary-template
---

The same "completion rate" often has different denominators in different people's hands: some use clicking start as the denominator, some use request initiation, some exclude timeouts, and some count a success after retry as a complete success. Without a metric dictionary, data definitions gradually diverge across meetings, SQL, and dashboards.

The goal of a metric dictionary is not to make definitions lengthy, but to let readers know — without knowing the author or opening the original code — how a number is computed, when it is comparable, and what to look at when it changes. This article provides a template and six categories of public examples; you can copy them directly into Markdown, documents, or a data catalog.

## 1. Use the Same Definition Card for Every Metric

Name:
One-line purpose: what decision does it help make?
Tier: task outcome / experience guardrail / process diagnosis / data quality
Measured object: request, session, deduplicated user, task, or another clearly defined object
Events and sources: which controlled events, logs, or public measurement tools are used?
Formula: numerator / denominator; aggregation method; percentile or time window
Success and failure definitions: which states count, which are listed separately?
Deduplication and attribution: what ID is used to link; how are repeated attempts handled?
Exclusions: tests, bots, duplicate reports, invalid samples, etc.
Breakdown dimensions: platform, version, network, entry point, etc.; plus dimensions that should not be collected
Data freshness and quality: available latency, coverage, known blind spots
Companion metrics: what are the goal, guardrail, and diagnostic metrics respectively?
Interpretation boundary: what can this metric not tell you?
Change log: when did the definition, events, or computation rules change; can it be compared with history?

Fields don't have to be written as paragraphs every time; a table or YAML works too. The key is that a single team's dictionary uses the same structure — in particular, never omit the denominator, exclusions, data source, and interpretation boundary.

## 2. Example 1: Task Completion Rate

| Field | Task Completion Rate (Example) |
| --- | --- |
| Name | Task completion rate |
| One-line purpose | Determine whether users can complete key tasks |
| Tier | L1: Task outcome |
| Measured object | Task |
| Formula | Tasks that reached the goal / tasks started |
| Success and failure definitions | Clear success / clear failure / timeout / user cancellation |
| Exclusions | Test traffic, bots, duplicate reports |
| Interpretation boundary | Not equal to a single-endpoint success rate; first confirm the start event isn't underreported |

**How to use:** When completion rate drops, first confirm whether the start event is underreported; then check whether the no-result rate, waiting, and errors changed in sync; finally, locate the issue by entry point or version. Don't substitute a single endpoint's success rate for task completion rate.

## 3. Example 2: Conversion and Retention

Conversion, activity, new users, and retention are common public product metrics, but they are especially prone to losing comparability when time windows and segments differ.

| Metric | Definition | Common pitfalls |
| --- | --- | --- |
| New users | Number of valid users entering for the first time | Affected by entry point and attribution; not equal to value |
| Conversion | Proportion of users who complete the target action | Time window and segment must be consistent |
| Activity | Number of users with valid usage within the observation window | The definition must be stated |
| Retention | Proportion of the same cohort that still has valid usage later | First check whether the cohort's source composition has changed |
| Return visit / repeat purchase | Proportion completing the target action again | Keep it distinct from the retention definition |

### Example: Don't Blend "New Users" and "Retention" into a Single Conclusion

An entry point brought more first-time visitors, so the new-user metric rose, but the same cohort's subsequent valid usage did not improve. This may show that the entry point expanded reach, but not that it created long-term value. Conversely, when retention changes, first check whether the cohort's source composition has changed. Observing new users, conversion, and retention within the same task or funnel brings you closer to a complete judgment.

## 4. Example 3: Errors, Availability, and Resource Quality

| Metric | Definition or formula |
| --- | --- |
| Error event count | Total failure events within the statistical window |
| Error rate | Error events / valid events |
| Affected-user share | Deduplicated users with at least one problem / active users |
| Problems per user | Problem events / affected users (or / active users) |
| Crash rate | Sessions or users with a crash / total sessions or users |
| Availability | Proportion of time or requests that deliver the expected capability normally |
| Success rate | Success events / all valid events |
| Post-fix recurrence rate | Proportion of the same problem recurring after a fix |

**How to use:** First separate network from non-network errors, then distinguish "request failed" from "user saw a failure." When the total error count rises, look at the error rate and the affected-user share at the same time; otherwise traffic changes will mislead your judgment.

## 5. Example 4: Latency, Jank, and Perceivable Waiting

| Metric | Formula or definition | Common companions | Interpretation boundary |
| --- | --- | --- | --- |
| P95 task wait | P95 of time from task submission to the user seeing a clear result | P50, timeout rate, task completion rate | Don't substitute an average alone; task types should be comparable. |
| Perceivable wait per user-minute | Total foreground visible wait time / deduplicated user usage minutes | Waiting task count, timeout rate | Usage minutes must exclude background and abnormal lingering. |
| Jank per user-minute | Foreground jank occurrences meeting the defined condition / deduplicated user usage minutes | Long tasks, INP, device segment | The jank threshold and sampling method must be fixed and public. |
| LCP / INP / CLS | Loading, interaction, and layout-stability observations under the Web Vitals definitions | Task completion rate, errors, device and network dimensions | Not equivalent to business outcomes; definitions follow the public standard. |

**How to use:** Define the start and end of waiting as states the user can perceive, rather than only computing server-side time. If P95 slows while P50 stays stable, check the long-tail environment first; if both P50 and P95 are stable but feedback increases, check whether users can't understand the current waiting state.

## 6. Example 5: Feedback and Problem Quality

| Metric | Definition or formula |
| --- | --- |
| Feedback rate | Valid feedback / active users or tasks |
| Problem confirmation rate | Verified problems / valid feedback |
| Duplicate problem share | Feedback for a given problem type / all problem feedback |
| Problem feedback per million active users | Valid problem feedback / active users × 1,000,000 |
| Feedback resolution time | Time from feedback submission to confirmed resolution |
| Feedback entry-point distribution | Feedback volume and problem type by entry point |
| Feedback topic distribution | Share of problems clustered by topic |

Feedback is an important discovery channel: public materials often note that "monitoring finds only a limited set of problems, and real production issues are often reported by users first." The right approach is not to let feedback replace data, but to cross-validate it with task events, error classification, and reproduction paths.

## 7. Example 6: Data Quality Metrics

What a metric dictionary most easily omits is precisely the numbers used to validate the metrics themselves.

| Metric | Definition or formula |
| --- | --- |
| Event coverage | Actually collected events / expected events |
| Event latency | Time from event occurrence to availability for analysis |
| Duplicate report rate | Duplicate events / all events |
| State closure rate | Events with a clear terminal state / all events |
| Instrumentation change annotations | Time markers for collection versions and definition changes |

## 8. Dictionary Maintenance Rules

- Before adding a core metric, write the definition card first, then the query or dashboard.

- When changing events, formulas, exclusions, or denominators, you must record a version; break the historical trend when necessary.

- Avoid one name mapping to multiple computations; prefer writing "by user," "by request," "first," or "final" in the name itself.

- Link every core metric to at least one guardrail, one diagnostic metric, and one data quality check.

- Periodically delete metrics that no one uses, that can't drive action, or that have lost credibility, so the dictionary doesn't become a list of abandoned terms.

A metric dictionary ultimately serves collaboration: it lets analysts, developers, product people, and future successors discuss the same thing over the same number. When definitions are clear, disagreements deserve to happen over goals and tradeoffs — not over what the denominator actually is.
