---
title: "How Close Should Managers Stay to the Code"
description: "A manager's distance from the code shouldn't be a fixed number but a consequence of the goal: close enough to judge architecture, risk, and blockers, far enough to spend energy on defining problems, unblocking collaboration, and securing authority upward."
createdAt: 2023-03-09
publishedAt: 2023-03-09
type: essay
tags: [engineering-management, leadership, engineering, work-leadership]
locale: en
translationStatus: reviewed
translationKey: 2023/03/how-close-managers-should-stay-to-code
---

Technical managers are often pulled between two anxieties: keep writing code, and worry about not having time for the team; stop touching code, and worry that they will soon only be able to talk in empty phrases. I have been through both, and I have watched peers around me swing back and forth.

But I gradually realized the question itself asks about the wrong object. A manager's focus was never the code itself — it is **getting things done and hitting the goal**. Distance from the code should not be some fixed number you hold onto, but a consequence of "which layer the goal needs me to make judgments at."

## First ask: what does the goal need you to judge

You don't need to know how every function is written, but you should stay clear about four things:

- Whether the architecture is clear: where the boundaries are drawn, which decisions are irreversible, which parts will drag everyone down later;
- Where the risk is: what the most dangerous dependency is right now, which part of delivery is most likely to be reworked;
- Where the blockage is: dependency, information, capability, or no one making a decision;
- Whether cross-team collaboration is unblocked: whether interfaces and ownership have been claimed early.

If you can't answer these, then everything a manager sees — progress charts, kanban boards, status reports — may only be surface appearance.

One example is quite typical: the team was late before release two times in a row. Looking only at the progress chart, it's easy to conclude "everyone isn't efficient enough"; but after sitting in on one design review, you find the real problem was that the interface owner wasn't pulled in early enough, and the compatibility conflict only surfaced just before release. What needed to change was the collaboration entry point, not urging everyone to move faster. A manager who stays far from the front line answers the right problem with the wrong question.

## The order of solving a problem: define before you execute

A manager's real output often happens before anyone starts building. Thinking something through comes down to four definitions:

- Define the problem: what outcome are we changing, and what evidence are we holding onto;
- Define the architecture: system boundaries and dependencies, which trade-offs are hard to reverse once made;
- Define "correct": to what extent is this done right, and which risks are unacceptable;
- Define the goal: therefore what to do, what not to do, and when it counts as done.

Once these four are clear, code gets written in the right place; conversely, if the definition is vague and you push everyone to start, the faster they build the faster they're just accelerating on the wrong problem. Whether a manager is close to the code is not measured by whether they still write it, but by whether they can give the team an accepted judgment on these four things.

## Judgment runs on information, not intuition

For interests, resources, positions, and purposes, judgment especially can't rely on guessing. Who is pursuing what interest, whose hands the resources actually sit in, what position each side stands on, what purpose it all ultimately serves — these only become visible by gathering information, not by reasoning it out from your desk.

Once the information is there, the manager can decide what to do at their own layer: touch the code when it needs code, do the resource request and coordination when it needs that. Whether you're close to or far from the code is ultimately the same judgment's result — **what kind of support does this particular thing lack.**

## Horizontally: unblock collaboration between peers

The biggest blockage on a front-line team often isn't inside the team but at the boundaries: another team wasn't pulled in early, interface ownership was never settled, upstream changed a commitment without syncing. These things don't fix themselves; someone has to actively align them.

The manager's value here isn't writing code for anyone, but pulling the cross-team disagreement back to one question: what are we jointly trying to change, and who makes the final call under what conditions. Unblocking collaboration is usually worth more than making the team internally a bit faster.

## Upward: secure authority, manage expectations, request resources

Many managers only look downward and forget that the level above is also something to "manage." Upward there are at least three things:

- Take the goal definition from above and translate it into something the team can actually execute, rather than forwarding it verbatim;
- Manage expectations: let the level above know what's feasible and which risks have to be shared, rather than revealing them at the last moment;
- After seeing the gap clearly, request resources explicitly — what risk you're eliminating, what gap you're filling — rather than vaguely "asking for more people."

Securing authority top-down and aligning peers horizontally are two sides of the same thing: **using a bigger goal to unify the organization's development**. Once you have the authority, the goal is settled, and the resources are in place, the team's effort connects to what the organization actually needs — and the goal gets reached.

## The measure of distance: does the judgment need you

Once these are clear, "how far from the code" becomes an operational question: close enough to make credible judgments on architecture, risk, and blockage; far enough not to make decisions that belong to the person in charge.

To judge whether you've crossed the line, the two tests still hold:

- The person in charge can't explain the plan and can only wait for the manager to explain it for them → support is insufficient, you should be closer;
- The person in charge can already explain the risks clearly, yet the manager still takes over the implementation line by line → delegation is being undermined, you should be farther.

Day-to-day implementation is decided by the person in charge, cross-module design is reviewed together, and only matters that change the goal or the way risk is tolerated involve the manager in the trade-off. The right distance isn't forever standing at the front writing, nor retreating to just reading reports, but letting people at each layer make decisions at the point closest to the problem.

## Closing: translate "distance" into "which layer holds the judgment"

Looking only at reports will mistake a green light for health; looking only at code will mistake local elegance for overall correctness. What a manager actually has to do is keep calibrating between goal, architecture, risk, collaboration, resources, and people's load.

Every time I finish a round of sampling, I ask myself two questions: what detail recently changed my judgment? If I took two weeks off, could the key technical and collaboration judgments continue? If I can't answer, it means I've put my judgment on the wrong layer — not too far from the code, but too far from the goal.
