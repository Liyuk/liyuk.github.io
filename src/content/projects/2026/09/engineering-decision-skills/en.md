---
title: "Engineering Decision Skills: What I Want AI to Do in Reviews, Planning, and Retrospectives"
description: "A proposal is due for review, three projects do not fit the next planning cycle, and another delivery is late. Five independent skills, each with an input and a concrete output you can take into a discussion."
locale: en
translationStatus: reviewed
createdAt: 2026-09-28
publishedAt: 2026-09-28
status: active
repositoryUrl: https://github.com/Liyuk/engineering-decision-skills
draft: false
tags: [agent, technical-management, decision-making, metrics, workflow, open-source]
translationKey: 2026/09/engineering-decision-skills
---

[View the project on GitHub ↗](https://github.com/Liyuk/engineering-decision-skills)

You have to review a proposal tomorrow. It covers queues, retries, alerts, and rollback. On paper, the pieces are there. You still want to know whether a failure could leave you with a rollback that cannot actually roll anything back.

Or the next eight-week cycle is already full. Product wants permissions, support wants self-service exports, and the engineers want to split a service. Every request has a case. Someone still has to write down what gets done, what waits, and when the deferred work comes back for discussion.

I collected some of my working methods for technical planning, reviews, retrospectives, metric analysis, and engineering reporting in Engineering Decision Skills. Each of the five skills handles one of these jobs. Give it the material for the task at hand.

Each of the five sections shows a different skill in use, with the request it receives and a sample response. The staffing, schedule, and business figures are part of the request.

## `tech-review`: find the rollback that does not actually take you back

Start with a proposal for issuing a coupon after an order is paid. A review can easily become a check for missing document sections. This skill also follows specific failure sequences: what a retry does after a timeout, and what happens to work already dispatched when a switch is flipped back.

**The material supplied:**

> $tech-review
>
> Review this proposal. Tomorrow we need to decide whether it can go into production. The business rule is one coupon per order.
>
> Coupon issuance currently runs synchronously after payment, so a slow coupon service delays the request. We plan to make it asynchronous: the API returns after writing a task to a queue; a worker calls the coupon service and records completion locally after success. Failures retry once a minute, up to three times, then go to a dead-letter queue. A coupon-service timeout can mean a coupon was actually issued. The service has an API for looking up issuance records by order number. The proposal does not specify idempotency keys.
>
> We monitor queue backlog and task failures. To roll back, we turn off workers and return to synchronous issuance. We plan to start with 5% of traffic. Give a conclusion, blockers, and scenarios to exercise before launch.

**Switching back to the synchronous path does not cancel asynchronous tasks already in progress.** An order could receive a coupon through both paths. The review turns that risk into blockers and scenarios the team can reproduce.

<details open>
<summary>Read the review: two blockers and how to show they are fixed</summary>

**Conclusion: hold production rollout; proceed with integration testing in isolation.** A 5% rollout limits the number of orders exposed, but the one-coupon-per-order rule must still hold. The material does not explain how that rule survives timeouts, retries, and rollback.

**Blocker one: requests with unknown outcomes enter ordinary retries. Status: open.**

The evidence is that a timeout may occur after a coupon has been issued, and failures retry up to three times. Suppose the coupon service issues a coupon but its response is lost. The worker never records completion, and the next call may issue another coupon. This is a gap between an external side effect and local state. An “already completed” field in the local order table alone does not close it.

Confirm whether the coupon service supports idempotent requests scoped to an order. If it does, both synchronous and asynchronous paths should use the same business identifier. If it does not, define an “outcome unknown” state, reconciliation through queries, and a manual resolution path. Do not treat every timeout as safe to retry. The lookup API can help confirm outcomes, but querying before issuing does not by itself prevent duplicates caused by concurrency or delayed query results.

**Blocker two: rollback does not account for queued work and requests in flight. Status: open.**

The evidence is “turn off workers and return to synchronous issuance.” Stopping consumers does not withdraw requests already sent to the coupon service. When queued tasks are consumed later, they may also process orders already handled synchronously.

The rollback design must address four things: where new work goes during the switch, how in-flight outcomes are confirmed, how queued tasks are reconciled and handled, and how both paths share deduplication rules. The implementation may choose to pause, drain, or isolate old work. The acceptance condition is that switching paths cannot issue a duplicate coupon or leave an order permanently unfulfilled.

**Important open question: how does an order complete after its task reaches the dead-letter queue?**

Keep the proposed backlog and failure-count monitoring. Also confirm who takes failed tasks, how issuance is recovered, and how the business can check the final state. Queue durability and what counts as a successful write are not specified either. These are missing review inputs; their absence from the proposal does not establish that the implementation loses messages.

**Suggested exercises before launch:**

- Issue a coupon, lose the response, and consume the task again. There must still be only one coupon.
- Exit after the coupon service succeeds but before the worker writes local completion. Restarting must not issue a duplicate.
- Enqueue the same order twice, or let it reach both old and new paths. The business rule must hold.
- Roll back with queued and in-flight work, then reconcile each order's final state. Checking that the switch changed is insufficient.

Once these behaviors are specified and exercise records are available, review whether to enable 5% of traffic. The proposal owner and production approver have not been identified; confirm them before rollout.

</details>

The review names the evidence missing for each blocker and gives the team failure cases to reproduce. When the proposal already addresses those risks, `tech-review` can recommend approval too.

## `tech-planning`: three worthwhile projects, room for only two

The difficult part of a plan is often what gets deferred. Labeling every request high priority is easy. Accepting that one will not happen this cycle takes an actual trade-off.

**This input supplies capacity and competing requests:**

> $tech-planning
>
> I lead a six-person backend team. The next cycle is eight weeks. After existing commitments, on-call work, and leave, we have 12 person-weeks for new work. I need options to discuss with the product lead.
>
> Three candidates: project-level permissions, estimated at 7 person-weeks, which a prospective customer wants to accept in week six, though no contract is signed; self-service exports, estimated at 4 person-weeks, with support currently submitting about 20 manual export requests a week but no timing data; and splitting the order service, estimated at 12 person-weeks, to improve deployment. There were two deployment conflicts last month, but no evidence that a service split is necessary to resolve them.
>
> Permissions and the service split both need the same senior engineer for key design work. Whether exports need that engineer is unconfirmed. Compare the choices, proposed near-term commitments, deferred work, and conditions for revisiting the plan.

Seven plus four is less than twelve, so the work appears to fit. But enough person-weeks does not guarantee availability of the key engineer. A prospective customer's acceptance date is also not committed revenue. `tech-planning` brings both facts into the decision.

<details>
<summary>Read the plan: a recommended combination, deferred work, and reasons to change course</summary>

**Make project-level permissions the primary candidate, exports a conditional second item, and defer committing to the full order-service split.** First run a brief scope and capacity check to establish whether two items can be promised. All effort figures are supplied estimates, not validated estimates; 12 person-weeks is the stated available capacity.

| Choice | What it addresses | Cost and constraints this cycle | Current judgment |
| --- | --- | --- | --- |
| Permissions plus full exports | The prospective customer's acceptance needs and manual export demand | An estimated 11 person-weeks leaves only one; key-person availability is unchecked | A target combination, not yet a delivery commitment |
| Permissions plus narrower exports | Preserves the customer window and covers common export tasks first | Requires an analysis of export requests; effort for the reduced scope is unknown | The first option to discuss for reducing risk |
| Full order-service split | Attempts to improve deployment independence | Uses all 12 person-weeks and displaces both other items; the link between conflicts and service boundaries is unconfirmed | Defer this cycle |
| Start no new projects | Preserves all discretionary capacity | Manual exports continue, and the customer acceptance window may be missed | A temporary option if the customer window is not real and scope remains unclear |

**Confirm two things first.** The product lead should establish exactly which permission capabilities are needed in week six and whether they are a purchasing prerequisite. Engineering should separately map the key person's design, review, and integration time. A total effort budget can still produce two projects waiting on one person if capacity by capability is ignored.

Bound permissions by the customer's confirmed requirements. Suggested acceptance checks include permitted role actions, rejected access across projects, and inspectable authorization-change records; validate these against the actual requirements. For exports, first inspect which tasks recur within the roughly 20 weekly requests, then define the first version's scope. Without time per request, the plan cannot claim a number of person-days saved per month.

**Bring the direction to discussion without presenting both full scopes as committed.** If scope review still yields 11 person-weeks, make the remaining one person-week visible to the product lead. If a dependency or rework exceeds that allowance, reduce export scope or renegotiate acceptance timing first. Do not silently budget overtime.

For the service split, investigate the two deployment conflicts. Compare a split with changes to deployment windows, compatibility practices, or the release process. Reopen the investment decision if evidence shows coupling repeatedly blocking deployment and smaller changes cannot resolve it. Investigation consumes capacity too: estimate it, then authorize it from the available allowance, rather than attaching it to the plan for free.

**Revisit the combination if** the customer cancels or pushes back acceptance of the permissions work, its scope exceeds the estimate substantially, the key engineer is unavailable when needed, or new deployment evidence changes the priority. Those changes should reopen the plan rather than leave the original schedule in place.

</details>

The first meeting can settle what the customer needs to accept and when the key engineer is available. Those answers determine whether exports can stay in the cycle. The service split also has clear conditions for reconsideration.

## `management-retro`: another late project. Was it really changing requirements?

This skill also works for ordinary delivery retrospectives, especially when everyone can explain what went wrong but nobody can say what to change on the next project.

**The input contains delivery records and conflicting accounts:**

> $management-retro
>
> Help me review a partner integration that was planned to take six weeks but was not accepted until week eight. Another similar project starts next week, and I want this retrospective to change how it runs.
>
> In week two, both teams reported “API development complete.” Weekly reports stayed green. We only began applying for the partner's production test access in week four. The first complete integration run was in week five, when we discovered that we sent amounts in yuan while the partner expected fen, and that we disagreed on empty-order behavior. After the fixes, the integration was accepted in week eight.
>
> Product added a filter field in week four. Developers blame changing requirements; product says the field was not on the main flow and that API quality was the main issue. The records do not contain effort per change or a complete critical path. Preserve the disagreements and recommend the changes most worth trying next time.

The timeline highlights a distinction that matters to the next delivery: API development was marked complete in week two, but the first full integration run did not happen until week five. The retrospective uses that sequence to assess both explanations without picking a side.

<details>
<summary>Read the retrospective: supported judgments, unresolved causes, and two experiments for next time</summary>

**The most useful change is how integration readiness is judged.** The material supports this sequence: APIs were reported complete in week two; the first complete integration run happened in week five; amount units and empty-order semantics surfaced then. A green weekly status did not show that end-to-end acceptance had not taken place.

This supports a judgment about the working process: development completion stood in for evidence that delivery risk was under control, without timely proof that both sides understood the interface in the same way. It does not show that this caused the entire two-week delay, nor that no contract checks happened earlier. The material only records when the first complete integration run happened.

The new filter field may have added work, and obtaining production test access may have caused waiting. Their contributions to the critical path cannot currently be calculated. Preserve both the product team's claim that the field was outside the main flow and the developers' claim about changing requirements; neither is established fact. Attributing the full delay would require change records, access-availability timing, and integration-blocker records. Preparing the next project need not wait for all of those.

**Try two changes on the next similar project.**

First, agree on minimal integration examples at kickoff: one normal order, one with a fractional monetary amount, and one empty order. Keep inputs, units, expected responses, and error semantics together for both teams to confirm. Aim to run the smallest complete path in week two. If production test access is unavailable, use mutually confirmed examples to check the contract while keeping real-environment validation explicitly incomplete. Passing examples does not replace acceptance in the real environment.

Second, report “our development complete” separately from “end-to-end validation complete.” To mark integration ready, attach an accessible environment, test-access status, and the latest example results. If a condition is missing, name the dependency and who must confirm its availability. Both teams need to agree on those owners at kickoff; a retrospective cannot accept commitments on their behalf.

Keep resolving differences found during integration and carrying the work through acceptance. Stop marking a cross-team milestone green solely because APIs are complete. Do not add a comprehensive new approval process for now.

**Review the experiment** in week two of the next project by checking whether the minimal path has run. At acceptance, check whether differences in units, states, or error semantics still emerge mainly at the end. If the main obstacle instead becomes prolonged lack of external access, adjust dependency preparation and escalation. Do not attribute every delay to late integration.

</details>

For the next project, try two changes: run the smallest integration path by week two, and report development completion separately from end-to-end validation. At acceptance, check whether interface differences still surface near the end.

## `metric-decision`: the bot's “resolution rate” hit 91%. Can we drop weekend human support?

This number directly affects service staffing. A mistaken interpretation could simply make a person harder to reach.

**Input:**

> $metric-decision
>
> After a support-bot upgrade, “resolution rate” rose from 72% to 91%. We are discussing removing weekend human coverage. The report counts conversations that do not transfer to a person as resolved.
>
> In the same week, the button for contacting a human agent moved into a submenu, and the conversation denominator changed to exclude sessions that ended after only a welcome message. We have neither a comparison recalculated under one definition nor records of whether users completed their tasks. A few users reported that they could not find a human agent, though we do not know how many were affected. Today we must decide whether to change staffing. Give an action and a way to validate it.

The question for `metric-decision` is whether “did not transfer” can legitimately mean “resolved.” Even a correctly calculated 91% may not answer what the staffing decision needs to know.

<details>
<summary>Read the metric analysis: what to decide today and how to test whether human support is no longer needed</summary>

**Keep existing weekend human coverage today; do not reduce service on the basis of this increase yet.** What is established is that the displayed value changed from 72% to 91%. Because the denominator and transfer entry point changed together, those values do not yet establish improved task resolution by the bot.

The current metric measures conversations without a transfer. Removing coverage requires knowing whether users can complete their tasks without human help. Abandonment, failure to find the entry point, and seeking help through another channel can all count as success under the current definition.

At least three explanations remain unresolved: the bot handles more problems; the harder-to-find entry point reduces transfers; and excluding welcome-only exits changes the denominator. These may occur together. A few reports justify investigating the entry point, but cannot establish the share affected.

**First make the comparison interpretable, then run a limited service trial.** If original events remain available, recalculate both periods under one denominator rule, segmented by issue type and weekday versus weekend. If old events cannot be recovered, state that the increase cannot be reconstructed and begin a new baseline. Even if the recalculated rate rises, the effect of the changed entry point still needs investigation.

Start with a frequent task whose completion can be observed, such as checking order status. Define the primary metric as the proportion of conversations attempting that task which return the needed order status and receive user confirmation of resolution. Mark unconfirmed outcomes as unknown. Both system state and user confirmation have limitations, so sample-check them during the trial; silence is not success.

The minimum records are task attempts, returned results, user confirmation, and requests for human help with their outcomes, linked to the same conversation. Begin with one data-quality check: replay a sample of conversations and compare attempts and final states with the event records. A full new dashboard is unnecessary at this stage.

**Cover a complete working week and weekend initially, while keeping a clear, usable route to a person.** Whether that produces enough evidence depends on task volume and segment distribution; seven days alone guarantees nothing. Track task completion, with unmet requests for human help and repeat requests over a short interval as guardrails. The support lead must confirm the interval and acceptable limits; the current material cannot supply thresholds.

If a conversation shows a task remaining incomplete and human help being blocked, address that failure path and pause expansion of self-service. Discuss reducing coverage only when evidence supports a specific task and time period. Success for one task does not justify removing all weekend coverage.

</details>

A single bot metric is not enough to justify removing all weekend human coverage. This example starts by testing a specific task, checking order status, then considers coverage by task and time period.

## `eng-reporting`: after the release-platform pilot, can an engineer join for two weeks?

The final example is a release-platform status report. The technical details and the team's conclusion already exist. The recipient needs to understand what they are being asked to approve.

**The notes look like this:**

> $eng-reporting
>
> Turn these notes into a progress report for the engineering director, who must decide whether to make an engineer familiar with the old release scripts available to our team for two weeks starting next week.
>
> Four-week pilot, eight services planned, six connected. The other two use old release scripts and do not have automated rollback integrated. The connected services have made 17 releases; one rollback still required manual handling.
>
> Records show median manual operation time for the same six services falling from 18 minutes before the pilot to 6 minutes afterward. These are manual records; we did not measure waiting time or failure rate. Business teams are frustrated by slow onboarding. I handle integration standards and cross-team coordination; another group built the execution engine.
>
> Existing review conclusion: complete rollback before expanding. The team proposes temporary support from one engineer for two weeks. That duration is an estimate and the assignment is not approved. If nobody is available, maintain the six-service pilot without promising a date for the other two. Preserve contribution boundaries and data limitations.

The report starts with the request and uses the technical progress to explain it.

<details>
<summary>Read the report: requested support, observed results, and the plan if support is unavailable</summary>

**Release-platform pilot progress and a request for two weeks of engineering support**

We recommend assigning an engineer familiar with the old release scripts to the team next week for an estimated two weeks, to adapt and validate rollback before reconsidering expansion. The assignment awaits approval. If support is unavailable this cycle, the team will maintain the current six-service pilot and will not commit to an onboarding date for the remaining two services.

Over four weeks, six of eight planned services have joined the pilot and completed 17 releases. Manual records for the same six services show median manual operation time decreasing from 18 minutes before the pilot to 6 minutes afterward, providing initial evidence of less time spent on operating steps. This excludes release waiting time, and no failure-rate data has been collected. It does not yet establish improved overall release efficiency or reliability. One of the 17 releases still required manual rollback.

Rollback capability is the main obstacle to expansion. The two remaining services use old release scripts without integrated automated rollback. The existing review requires that gap to be closed first. Business teams are frustrated with onboarding speed, but adding services before meeting that condition would exceed the scope the review currently permits.

My responsibilities are integration standards and cross-team coordination; another group built the execution engine. The next stage needs an engineer familiar with the old scripts for adaptation and validation. Two weeks is the current estimate, to be refined once staffing and script differences are confirmed. Suggested acceptance should cover rollback paths for the two pending services and revisit the earlier manual rollback, so that expansion is not based solely on completed onboarding.

The director's decision is whether this staffing support can be provided. If approved, the team will confirm the engineer, scope, and next review date. If it cannot be provided, the team will continue the limited pilot under the existing conclusion and explain to business teams why expansion is paused and what would allow it to resume.

</details>

The report makes the support request and fallback plan explicit, while separating what the manual records show from outcomes that have not been measured. `eng-reporting` can also help with project summaries, self-reviews, and promotion cases, based on work you actually did and evidence you can point to.

## A model can do this directly. Why install a skill?

You can ask directly. A capable model with a complete task description may produce an equally useful result. I do not have enough comparative evidence to claim that installing these skills will always outperform a direct request.

What I want to save is repeated instruction about how the work should be done. Reviews need references to the proposal, a distinction between blockers and personal preferences, and conditions for reconsideration. Plans need opportunity costs and checks for double-booking key people. Retrospectives need to preserve disagreements and end with changes worth trying next time. Each task has its own requirements that are easy to omit.

Those requirements live in each skill's `SKILL.md` and reference files. Invoke the one you need, provide the task's material, constraints, and decision, and reuse its working method. The instructions are readable and editable; adjust a rule that does not suit your team.

I split the collection into five because these jobs call for different judgments. A review looks for risks that affect a release; a report presents an existing conclusion to a decision-maker; a retrospective uses the event record to find a change worth trying. Each skill keeps the instructions for its job, so you can call the one you need without restating its working rules every time.

For occasional paragraph polishing, a direct request is convenient enough. If you do these jobs every week and often need another round of “do not rewrite it; tell me whether it can ship,” “you counted that person twice,” or “which parts are your inference,” try one skill on an old document.

## Try it on a proposal you have already reviewed

I suggest starting with `tech-review`. Choose a proposal you have already assessed and whose issues you understand. Check whether it identifies problems that affect the decision, mistakes implementation preferences for defects, and gives recommendations you could send to the author.

Install this skill for Codex:

```sh
npx skills add Liyuk/engineering-decision-skills --skill tech-review --agent codex --global
```

Then enter `$tech-review`, paste the proposal, and specify whether the decision concerns a direction, a pilot, or a production rollout. You can also try the first example in this article. To use another skill, replace the name in the installation command with the one for your task.

The project currently contains five skills, 39 evaluation cases, and three reports based on public engineering material. Behavioral smoke checks have focused mainly on Codex. These limited case checks do not establish that the skills generally outperform direct requests across models, teams, and tasks. Code implementation and execution are outside their scope. The current version, full instructions, and cases are in the [project repository](https://github.com/Liyuk/engineering-decision-skills).
