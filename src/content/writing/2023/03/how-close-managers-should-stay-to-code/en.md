---
title: "How Close Should Managers Stay to the Code"
description: "Managers don't need to review every line of code, but if they drift away from front-line detail they lose the ability to judge risk, cost, and what is really blocking the team; the point is to build sampling-based understanding, not micro-control."
createdAt: 2023-03-09
publishedAt: 2023-03-09
type: essay
tags: [engineering-management, leadership, engineering, work-leadership]
locale: en
translationStatus: draft
translationKey: 2023/03/how-close-managers-should-stay-to-code
---

Technical managers are often pulled between two anxieties: keep writing code, and worry about not having time for the team; stop touching code, and worry that they will soon only be able to talk in empty phrases. I have been through both, and I have watched peers around me swing back and forth between the two.

The answer is not to pick a side between "implementing it myself" and "letting go completely," but to decide how you want to keep your grasp on the real work. I would sum it up in one sentence: **you don't have to review code line by line, but you must never drift away from the details that let you judge risk.**

## What a manager needs to know

You don't need to know how every function is written, but you should be able to answer a few questions:

- What is the most dangerous dependency right now?
- Which part of delivery is most likely to be reworked?
- Why can't the team estimate accurately?
- What risk does a given technical investment actually eliminate?

If you can't answer these questions, then everything a manager sees—progress charts, kanban boards, status reports—may only be surface appearances.

One example is quite typical: the team was late before release two times in a row. A manager who only looked at the progress chart might conclude that "everyone isn't efficient enough." But after sitting in on one design review, they discovered the real problem: the owner of the interface hadn't been pulled in early enough, and the compatibility conflict only surfaced just before release. What needed to change here was the collaboration entry point, not urging everyone to move faster. A manager who stays far from front-line detail answers the right problem with the wrong question.

## Use sampling instead of taking over

There are three low-cost ways to stay in touch:

- Regularly join a small number of key design reviews, and press on goals, alternatives, and risks;
- Sample-read important changes or post-incident reviews, and observe the team's quality of thinking rather than fixing code for them;
- Personally do a small piece of work at truly critical moments, to feel the actual friction in tools, processes, and upstream/downstream flow.

The purpose of sampling is not to find mistakes, nor to prove you are still the best, but to calibrate management judgment. It lets the manager know where to invest, where to delegate, and where to remove unnecessary process. The difference between sampling and taking over is this: sampling is looking in order to judge; taking over is doing in order to do it for others.

## Stay close to the detail, but also hold the boundary

If every decision waits for the manager's confirmation, the team loses room to grow; if the manager overrides the person in charge with personal coding ability, the boundary of responsibility is also broken. A good signal is this: the team can make most decisions independently, while the manager can still understand key judgments, spot risks, and provide broader context and resources when needed.

To judge whether you are getting involved too deeply, the standard I use is simple:

- The person in charge can't explain the plan clearly and can only wait for the manager to explain it for them → support is insufficient;
- The person in charge can already explain the risks clearly, yet the manager still takes over the implementation line by line → delegation is being undermined.

Day-to-day implementation is decided by the person in charge, cross-module design is reviewed together, and only matters that change the goal or the way risk is tolerated involve the manager in the trade-off. Staying close enough to the code is not about forever standing at the front writing it, but about not losing your feel for the cost the team is paying.

## Build a rhythm of looking downward

Staying close to the front line shouldn't only happen after an incident. Each cycle, pick one high-risk approach to join in review, sample-read one important change or review, and occasionally complete a piece of development, troubleshooting, or a release path yourself. The point is not frequency, but bringing a question every time: what does this choice solve, and what does it give up? Is the blockage in dependencies, information, ability, or decision-making? Does the team share the same set of boundaries?

Looking only at reports will mistake a green light for health; looking only at code will mistake local elegance for overall correctness. A manager has to keep calibrating between user outcomes, delivery rhythm, collaboration friction, and people's load. Every time I finish a round of sampling, I ask myself two questions: what detail recently changed my judgment? If I took two weeks off, could the key technical judgments continue? If I can't answer, it means I've drifted too far from the code again.
