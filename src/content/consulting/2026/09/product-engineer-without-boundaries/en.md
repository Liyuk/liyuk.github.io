---
title: "When a Project Gets No Product Support, How Should Engineering Move Forward?"
description: "A consultation about a high-pressure blended role: looking past the schedule to the business goal, shared expectations, resources, and authority the work requires."
locale: en
translationStatus: reviewed
createdAt: 2026-09-23
episode: 3
guest: An engineer taking on a blended role
format: career-case
featured: false
draft: false
tags: [career-development, engineering, product-thinking, operations, communication, collaboration, prioritization, risk-management]
column: { slug: engineering-team-judgment, order: 1 }
translationKey: 2026/09/product-engineer-without-boundaries
---

> This is an edited account of a real consultation, not a verbatim transcript. The conversation is presented in its original order: the client first described the situation, then I worked through it with him. People, organizations, business details, and project specifics have been abstracted, and some repeated facts have been combined. The advice reflects what we discussed; the client and his team have not yet acted on it.

## The client starts with a recent project

**Client:** Most of my work is engineering. Our team does not have a clearly defined product role right now, and my manager wants engineering to take on both product and engineering work. I had said before that I was willing to do more and had talked about moving toward full-stack work. So when this business project came in, I assumed I was supposed to connect the product and engineering sides. Now I am wondering whether one person can really carry all these roles. I am also worried that my way of working may not fit with the team.

The project was tied to a time-sensitive business goal. Operations wanted to launch quickly. After the request came in, we spent several days clarifying it and going back and forth on the proposal. By the time development started, the expected launch was close. Development and self-testing had to fit into a short window, and we had not agreed early on when QA would get involved. I treated both product and engineering as my responsibility, but we had not clarified who was leading and who was supporting.

At the start, I did not know the existing flows or capabilities very well. The requirements document described features, but it did not give enough context on how people would use them or on the edge cases and constraints. We moved ahead with incomplete information. Looking back, I think I was too optimistic about the timeline and the possible impact.

The conflict was between a new feature and benefits users already had. There was not enough time to build the needed capability from scratch, so we temporarily reused a similar existing feature. Several business scenarios shared some underlying capabilities, and users could need the new feature and their existing benefits at the same time. During internal testing, we found that the two use cases conflicted: some users who joined the new promotion could no longer use benefits they already had.

My first reaction was to limit the damage. We could not let the new promotion disrupt the existing business. Operations was more focused on whether the promotion could still run and how to reach its business goal. I felt we were not looking at exactly the same problem. We also had different understandings of launch and internal testing. The demo made the feature look complete, but Operations had a different idea of what the delivered version could actually do.

Once internal testing surfaced a problem we could not work around, we had to change the temporary solution and delay the launch. Other problems came up afterward too. The implementation itself may not have been the main issue. I was more concerned that the product design had missed use cases and that we had not checked the interactions between markets and existing features at the start.

Product work, design coordination, and acceptance testing took a lot of my time. I could not make backend technical judgments on my own, so I had to ask a senior backend engineer to review the situation with me. I could not participate in every backend decision. Someone in Operations was upset for a while. I tend to think that once the problem is fixed, we can move on, but the other person's frustration was still there. I found that hard to handle, and I was not sure how product and operations were supposed to divide the work.

I also have follow-up support and other small tasks. Wrapping up another exploratory project has taken time too. With this new project on top, my attention is being pulled in several directions. I do not know whether I need to be more proactive, whether I lack the skills, or whether there is simply too much work. I want to know what direction to discuss with my manager. Should I keep taking on product-engineering work? If I do, what will be hard and what should I improve? If I stop taking on these business projects, could I return to more focused engineering work?

I am under a lot of pressure. Maybe anxiety and stress can help me grow, but I also want to feel more optimistic and confident. I still have gaps in backend knowledge, product understanding, and cross-team communication. I was in a bad state that day, and I was wondering if I was suited to this role at all.

## I didn't start by answering, "How can I execute better?"

I first acknowledged some of the sound judgments he had already made. When he saw that existing user benefits might be affected, his first thought was to limit the damage. For backend questions he could not assess independently, he knew to ask an experienced colleague. The project had gone unevenly, but he was not simply focused on pushing the feature out. A disappointing result should not erase those concrete things he did well; they also do not mean he should carry every outcome alone.

He asked how he could execute better: should the schedule be longer, should he leave more buffer, should engineers get information earlier? Those are part of project execution. But as we kept talking, I did not start with a scheduling prescription. There was a more basic question underneath: why had engineering taken on this project? What was Operations trying to achieve? Without product resources, who would work with Operations to clarify the goal, the approach, and the resources?

My understanding is that this marketing project did not receive product resources in the prioritization process, while Operations still had a business goal to meet. Engineering was then asked to take on more product and engineering work. The client understood his assignment as becoming a "product engineer," but the organization may have assigned him a set of blended responsibilities without defining the scope, resources, or decision authority that came with them. My reading is that both his willingness and his ability may have shaped his manager's expectations: he had said he wanted to do more and had mentioned full-stack work, and he had done well in his existing work. That is one way to interpret the expectation, not a reason his manager explicitly gave.

So the surface question was how to execute better, but several questions were mixed together: did he want to keep taking on this kind of work? If so, what business result was he meant to achieve, and what people and resources would it take? When scope, time, and risk conflicted, what could he decide, and when would he need someone with more authority to step in? When all of that is reduced to "Maybe I'm not capable enough," it is easy to pile more work onto oneself and miss the conditions actually holding the project back.

## If the work is going ahead, clarify the outcome and the path

I asked him to go one level deeper: what result was this promotion meant to produce, and which metric would show it? Why did Operations believe the promotion could produce that result? Given the time and resources available, what paths could the team try?

This was not about challenging Operations' idea for its own sake, or treating every requested feature as a must-do task. Product work takes "I want this feature" and asks what problem it is meant to solve and what outcome should change. Then the business and engineering teams can look at workable paths together. That might be the original proposal, a smaller scope, a phased attempt, or even a manual process to test the idea. The feature should serve the goal, not become the goal. If no one can say what outcome matters or how to judge it, the team needs to return to that discussion before assuming it should start building.

## Product work is more than writing a PRD

Here, product work meant more than writing a PRD and handing the request to engineering. It meant understanding the business goal and user context, breaking the request into a problem and assumptions, making scope and risks visible, and coordinating design, engineering, and testing resources. Product cannot guarantee the metric, but it can help the team understand why the work matters, who it affects, and how to judge whether it is worth continuing. For an engineer stepping into this work, the challenge is not only learning more technology; it is learning to discuss the outcome while being candid about cost, timing, system risk, and existing user experience.

That calls for communication that can both cooperate and disagree. The disagreement is not with the person who raised the request. It is about naming the gap when a proposal does not fit the time or resources, or may affect existing user benefits, and then comparing alternatives. In this project, the client was right to think first about limiting harm to existing benefits. The next step is to bring the question of how the business goal might still be reached into the same conversation, rather than stopping at "this implementation has a problem."

## Negotiate the resources and decision authority

My understanding is that the project did not receive product resources in prioritization, while Operations still had a business goal to meet, so engineering took on more product and engineering work. That did not automatically give engineering the full decision authority of a product role. The client needed to coordinate expectations with key partners and their managers: What were the goal and metric? How would scope and timing be traded off? What product, design, engineering, and testing resources were needed? Who could coordinate, and who could make the decision? There could be different ways to proceed, but first he needed to know where resources would come from, what he could decide, and which issues needed escalation.

Organizational authority is not always neatly written into a job description. Someone taking on a new assignment may need to ask for the room required to move it forward. That does not mean making every decision alone; it means tying the request to the outcome: Who needs to be involved? Which options can I coordinate? Which risks need a manager or business owner to decide? If those things are unclear, the work lacks conditions for execution and may need to pause while the team clarifies them.

The client said his manager wanted concrete people and events. My interpretation was that, when speaking with this manager, it would help to anchor the conversation in facts and decisions: who set the goal, how the request changed, which user cases were missed, when the risk surfaced, and what decision is now needed from whom. Specifics are not for finding someone to blame; they let a person with authority see the issue and step in. We do not have enough information to know whether the manager had product experience or understood what this product was meant to solve. A request for concrete cases alone does not show that he lacked product knowledge. Feelings matter too; in this conversation, if the client wanted the manager's help resolving the work, he could also explain where the pressure came from, how it affected him, and what support he needed.

## Execution review: buffer helps, but is not the answer

The execution still needed a review. Time went into clarifying the request and discussing the proposal. Development began close to the expected launch, leaving little room for development, self-testing, internal testing, and QA. With little time, the team reused a similar capability without fully checking how it interacted with existing features across markets. Internal testing then found that the new promotion could affect benefits users already had, and the team had to change the approach and delay launch.

The client also saw that he had been too optimistic and had not surfaced unknowns and risks early enough. Next time, he could map the key user flows, historical constraints, and connected scenarios sooner; make sure Operations and design shared an understanding of what would be delivered; and agree on QA involvement early. But extra buffer can only create room to test and adjust. It cannot replace agreement on goals, resources, and who decides. With a fixed deadline, the team needs to reset expectations together and discuss a smaller scope, a phased test, or another path. If more resources are needed, the people who can allocate them need to see the gap early. Whether a lightweight test or manual process is appropriate depends on the goal.

Under pressure, each side naturally sees a different risk: Operations worries about missing its target; engineering worries about the system and users. That tension is understandable, but we have no evidence that any particular person was shifting blame. The useful move is to surface risks, options, and decisions in time for key partners and their managers to share the trade-offs.

## Growth should not mean becoming a superhero

He asked whether stronger product and backend skills would make attention less of a problem. My answer was that better skills might reduce time spent understanding the system, aligning repeatedly, and reworking decisions. I estimated that this time could fall by about half; that was an estimate, not a measured result. But when several responsibilities still land on one person, attention still needs to be allocated. Greater familiarity can reduce friction; it cannot replace a discussion about resources and priorities.

He did not need to become an all-purpose product engineer overnight. He could start by learning the context that most affects his decisions: how users move through the flow, what historical constraints exist, and which related scenarios need checking. He could also practice discussing options in terms of the goal and metric, and escalate trade-offs that exceed his authority. AI can help organize questions and risks, but it cannot set the business goal or make a trade-off for the people with authority.

We also briefly discussed that support for growth should reflect a person's experience and confidence on a particular task, rather than adding another blanket list of skills to master. The client was willing to take on a new responsibility, while product judgment, backend context, and cross-team negotiation were still new challenges. A smaller next step, the right context, someone to ask for help, and timely feedback may be more useful than expecting himself to learn everything at once. Pressure does not automatically become growth; the important thing is to find something he can practice with the support to do so.

## What the consultation clarified

This conversation did not decide whether he should continue taking on product-engineering work. It made "How can I execute better?" more concrete: clarify the outcome and possible paths; coordinate expectations, resources, and decision authority with the business and relevant managers; surface unknowns, risks, and user impact earlier; and build the context most relevant to his decisions instead of demanding instant mastery of everything.

He could take these questions to his manager: What outcome am I responsible for? Which people and resources can I coordinate, and what can I decide? What risks require someone else to step in? If those conditions are not available, should the goal, scope, or investment change? These questions do not guarantee the organization will provide the ideal answer, but they can help him tell whether he is taking on a supported experiment or filling a role and resource gap alone.

If you are carrying work whose goal and authority are unclear, start with a specific event: what result someone wanted, what resources and constraints were in play, which decisions you could make, and where the work got stuck. A consultation cannot make organizational decisions for you, but it can help clarify the facts, options, and conditions for the next conversation.

[Learn about consulting →](/consulting/)
