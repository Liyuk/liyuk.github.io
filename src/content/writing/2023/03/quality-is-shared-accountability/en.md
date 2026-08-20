---
title: "Quality Is Not One Team's Job: Shared Accountability for the Outcome"
description: "Every role owns its own delivery, and everyone shares accountability for production outcomes. A quality loop depends on monitoring, fast containment, precise fixes, and retrospectives."
locale: en
translationStatus: reviewed
createdAt: 2023-03-17
publishedAt: 2023-03-17
type: essay
tags: [quality, reliability, engineering, technology]
translationKey: 2023/03/quality-is-shared-accountability
---

> This essay expands on the "closed loop" thread from [Management Retrospective](/en/writing/2026/08/management-retrospective/).

When quality slips, an organization's first reaction is almost always "whose fault is this?" Drawing clear boundaries is fair enough, but if only one role ends up accountable for the production outcome while everyone else is accountable only for their part of the process, quality gets lost at the handoffs — because every segment has someone responsible for process, but no segment is responsible for the outcome.

After years of engineering, my biggest takeaway is this: **a quality incident is almost never "one person did a bad job" — it is almost always "no one was standing at the boundary."**

## Shared Accountability for the Outcome

A more sensible principle is this: everyone owns the result they deliver, and everyone involved in delivery shares accountability for the production outcome. Requirements left unclear, risks not surfaced in design, edges not covered in implementation, anomalies not caught in verification — these are all problems in the same delivery chain. Pinning blame on "testing didn't catch it" or "the developer wrote it wrong" sounds clean, but in practice it only lets the next incident happen somewhere else.

## Four Steps for Production Quality

For production quality, I follow four steps, and the order matters.

Prevention is not a guarantee that nothing will go wrong; it is about making high-risk changes visible before they ship: critical-path review, edge scenarios, rollback plans, and a clearly named owner. The earlier prevention happens, the lighter the other three steps become.

Detection is where monitoring matters most. Without monitoring, a team can only wait for user complaints; with monitoring, you learn when the problem started, how big its impact is, and whether it is still spreading. The point of monitoring is not to look good — it is to make detection stop depending on luck and users.

Containment does not require fully understanding the root cause. First, roughly identify the blast radius, then turn off a switch, roll back the change, or degrade a service to stop the loss from growing. Separating "restore first" from "fully explain" reduces chaos during an emergency — and this is the easiest trap to fall into: everyone debates a root cause that has not yet been located while the damage keeps growing.

Only at the fix step do you move into precise localization: the reproduction path, the root cause, the patch, verification, and prevention of recurrence. The retrospective is not about pursuing any individual; it asks two questions: which signal should have appeared earlier? And which boundary was not held?

## Roll Back First, Explain Later

After a rule adjustment went live, monitoring showed a small number of submission failures. The on-call engineer did not wait for the logs to be fully analyzed; they first turned off the new rule to stop the impact, and only then located the uncovered legacy-version input and added compatibility handling and monitoring. The retrospective did not ask who should take the blame; instead, everyone checked together: why did the old input fall outside the scope? What was missing from the release checks? What signal could alert us earlier next time?

This example is worth remembering because its order was right: detection, containment, precise fix — rather than treating "full explanation" as a precondition for recovery. The most expensive thing at an incident scene is time; the cheapest is a switch.

Quality is not one department's KPI; it is the delivery system's ability to face real outcomes together. That ability does not come from stricter process — it comes from making accountability for the production outcome something everyone does.
