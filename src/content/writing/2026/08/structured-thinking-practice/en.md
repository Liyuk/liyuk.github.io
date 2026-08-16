---
title: "Structured Thinking in Practice"
description: "A hands-on companion to the Five Lenses method: four scenarios — interview, promotion, reporting, and cross-team collaboration — show how to apply the structured tools and the Five Lenses to real problems."
locale: en
translationStatus: reviewed
createdAt: 2026-08-15
type: essay
draft: false
tags: [thinking, problem-framing, decision-making, communication, work-leadership]
column: { slug: thinking-training, order: 4 }
translationKey: 2026/08/structured-thinking-practice
---

> This is the hands-on companion to [The Five Lenses: Connection-Oriented Problem Location](/research/2026/08/connection-oriented-problem-location/). That piece explains "what this method is, why it holds, and where its boundaries lie"; this one is only about "how to use it." Tool definitions are not repeated here — where a tool is used, a brief mention is dropped in. For the full definitions, see the research version or the quick-reference card at the end.

First, remember this one line: **being structured isn't "looking organized"; it's laying out "conclusion, evidence, assumption, and next step" in separate cells, so that others can point out exactly which cell they disagree with.**

Below are four scenarios, straight to the point.

## Interview: turning "walk me through your project" from a ramble into structure

Asked to "walk me through your most challenging project," most people answer with a rambling chronology. Give the conclusion first, then expand with STAR (Situation–Task–Action–Result):

- **Conclusion**: I used risk prioritization to add tests to the critical path, and post-launch incidents dropped by half.
- **Situation**: I took over a module that had to ship, but had only 30% test coverage.
- **Task**: Raise coverage to 80% within three months, without slipping the deadline.
- **Action**: First list the risks (MECE — mutually exclusive, collectively exhaustive), then prioritize by "high frequency × high risk" (a 2×2 where two orthogonal dimensions cut four cells), and fill the critical path first.
- **Result**: After launch, production incidents were cut in half.

Then use two of the Five Lenses to understand the interviewer: the **Position lens** — they stand where "a bad hire is costly"; the **Interest lens** — they need to judge "whether you can replicate this method in a new environment." So when talking about the "Action," the point isn't "how hard I worked" but "what reusable method I used."

## Promotion: replace "I worked hard" with "reproducible evidence"

The worst mistake in promotion materials is turning them into a laundry list of achievements. First break down the criteria, then fill in the evidence, and finally state the trade-offs explicitly:

- **Break down the criteria (MECE)**: split the promotion criteria into four non-overlapping, exhaustive parts — technical depth / business impact / collaboration and mentoring / values.
- **Find the gap (decision matrix)**: score yourself on each part, find the weakest one, and focus on filling in evidence there.
- **Conclusion first**: open the material with one line — "This year I moved metric X from a to b, and here's how…".
- **Trade-offs**: honestly write "what I gave up and why." Someone who only lists achievements ends up looking like they have no priorities.

Use the Five Lenses to understand the reviewers: the **Position lens** — reviewers fear "promoting the wrong person"; the **Interest lens** — they want "reproducible evidence," not "I worked hard." So every sentence should land on verifiable facts, not adjectives.

## Reporting: let your manager know "what decision you need them to make" as soon as they finish listening

**Scenario**: you report a stuck project to your manager, spend five minutes on the process, and they ask, "So? What do you want me to do?"

**Structured (conclusion first + status–blocker–decision–next step)**:

- Conclusion: the project will slip two weeks, and I need you to decide one thing — cut scope or add headcount.
- Status: core functionality is 70% done; we're stuck on the payment interface.
- Blocker: the payment interface depends on a third party, whose schedule is a week later than expected.
- Decision: I need you to call it — cut a non-core feature and ship on the original date, or add one person to work in parallel.
- Next step: once you decide, I'll produce the revised schedule the same day.

**Use the Five Lenses to understand your manager**: the **Position lens** — your manager stands where "will this slip affect the promises I made externally" matters; the **Interest lens** — what they want is "don't let the delay become a surprise." So put the conclusion up front; don't make them dig for the problem in the details themselves.

## Cross-team collaboration: turn "who's dragging whom down" into "what's the root cause"

Two teams collaborate — A builds the platform, B does the business integration — and after a delay they blame each other: "A should have delivered the interface first," "B should have provided the requirements first."

First, structure it: replace "who's dragging whom down" with a fact table (each side's delivery milestones, blockers, dependencies), turning "about people" into "about the work."

Then run through the Five Lenses one by one:

1. **Causal lens** (5 Whys): Why the delay? → The interface wasn't pinned down → Why? → The two sides' field definitions didn't align → Why? → There was no shared document.

   ```mermaid
   flowchart TD
   A["Delay"] --> B["Interface undecided"] --> C["Field definitions misaligned"] --> D["No shared doc"]
   ```
2. **Duality lens**: the pro side "A should deliver the interface first," the con side "B should provide the requirements first" — two opposing sides.
3. **Dialectical lens**: objectively, both sides are waiting for the other; there's no owner to set the timeline.
4. **Position lens**: A wants platform stability, B wants to go live quickly — both goals are legitimate.
5. **Interest lens**: the real reason is "whoever moves first loses" — the one who commits first bears the rework risk.

Once the root cause is found, the solution can aim at it: designate an owner + freeze the interface date + make a trade-off (support 80% of the scenarios first, the rest in the next version). This is far more useful than "both sides just try a little harder."

## Quick-reference card

**The Five Lenses, Five Questions**

| Lens | Question |
| --- | --- |
| Causal lens | Why did it happen? Keep asking down level by level |
| Duality lens | What are the two opposing sides? |
| Dialectical lens | What is it objectively? |
| Position lens | What are their goals and needs? |
| Interest lens | What is the real cause, and whose interest? |

**Have you reached the bottom?** Swap out your current solution and see whether the problem is still there. If it is, you haven't reached the root.

**Four questions before you act**: What's the conclusion? Which facts does it depend on? Which assumptions are unverified? What should the other person do after reading it?

---

To understand why each tool is used this way, where its boundaries lie, and how it differs from KT / systems thinking, see the research version [The Five Lenses: Connection-Oriented Problem Location](/research/2026/08/connection-oriented-problem-location/). To practice from something more basic, see the sorting, counting, and questioning pieces in this column.
