---
title: A Fresh Start
description: This site is being rebuilt from an old static blog into a personal publication about technology, work, and life — and it also records the trade-offs made along the way.
locale: en
translationStatus: reviewed
createdAt: 2026-08-14
publishedAt: 2026-08-14
type: note
featured: true
tags: [site-notes, field-notes]
translationKey: 2026/08/rebuilding-this-site
---

This blog has been around for years. Old pieces are scattered in different places, and plenty of links stopped working long ago. Now I want to tidy it up: slowly sort through what I wrote before, and bring in the things I have been making, studying, and noticing on the road.

Chinese remains the original. English will come only after the Chinese draft is genuinely clear — there is no rush to machine-translate a copy and post it.

## First, be clear about the problem

The first thing we discussed in this rebuild was not what the homepage should look like, but what the site should actually be for. The old site felt like a blog snapshot frozen at some past year. If I just moved the old posts and old styling into a new framework, the problem would stay — new content would have no proper home, and readers could not tell the difference between a quick note, an ongoing project, and a piece of research.

So in the end I did not make it a résumé-style portfolio, nor a "personal brand" homepage that crams everything in. It is closer to a personal publication I can keep editing: writing is where experience gets organized, projects keep the path from problem to artifact, research holds questions that are not yet settled, and photography keeps a place for looking beyond the screen. The categories exist not to look complete, but to give content of different density its own honest entry point.

The homepage therefore only does navigation and reading guidance, instead of being a dense CV. The visuals are deliberately restrained: let the title, summary, time, and links do the talking, with less decorative noise. The archive is organized by creation time, so content can be filled in gradually instead of pretending everything just happened.

## Migration is not moving house

The old site will be kept as a historical version you can still look back at, but the new site will not copy everything over indiscriminately. Migration requires re-judging each piece: which posts still represent how I think today, which are better distilled into a single new topic, and which involve old links, internal information, other people's privacy, or contexts that no longer hold — those stay in the private archive.

This judgment is slow, but more important than "restoring everything." Public writing is not a pile of documents; publishing means being willing to keep standing behind the words today. Old posts will be handled one by one, adding the original context and a present-day note where necessary, rather than producing a false sense of abundance through a one-time clearance.

## What can be recovered, and what cannot

Only once I got moving did I realize the workload is not in building the site, but in the content. There were about one hundred and twenty old posts, each needing to be re-graded: migratable, splittable and rewritable, distillable to a single idea, or only fit for the private archive. Every single one had to be stripped of company names, internal links, other people's privacy, and outdated context, before I could decide whether I still wanted to be associated with it today.

Even more work came from the things I had done and thought about over the years but never wrote down systematically. They were scattered across documents, chat logs, and memory; this time they were reorganized into standalone pieces. This is not recovering old writing — it is writing down what had never been written.

And some things genuinely cannot be recovered. Some context was never backed up anywhere: why I wrote something a certain way, the backstory of a conversation — I can only piece them together from memory. So this cleanup is half moving, half rewriting, and the rest is admitting that some things are simply gone.

## Make future writing lighter

The technical design also revolves around this goal. Content is stored as Markdown, with dates, topics, and tags described by explicit metadata; pages, archives, and RSS are generated from that content. Adding a new post no longer requires re-laying-out anything, and does not depend on some backend or platform. The site can still have its own look, but writing should not be tied down by appearance.

Language of drafting comes from the same consideration. I write the first draft in Chinese — it is where thinking and revision actually happen; if an English version appears, it should be a separately reviewed text, not a by-product produced at publish time. I would rather have a single language version for now than have two texts that look parallel but whose tone and judgment have not been aligned.

This architecture might one day be tidied into a reference demo: not just the page code, but the content model, migration trade-offs, publishing process, and maintenance habits explained together. But that should happen after it has actually survived some time of writing and maintenance. For now I treat it as a working method in use; once the practice is complete enough, I will look back and see which designs held up and which need to be redone.

## What the tools did, and what I did

In this cleanup, AI took on the high-volume, mechanical, comparison-heavy parts: reading through more than a hundred old posts, grading them into "migratable / rewritable / distillable / not migratable," listing the internal information to remove from each, and drafting the de-identified public version. The version records and citation checks in the research drafts, the scripts and tests, were also mostly sketched out by it first.

But "can this be public" and "am I willing to stand behind this today" were always my calls. A tool can offer suggestions, but it does not know which sentence hides a privacy concern or which past story should not be read by strangers; however smooth its first draft, whether the tone is right and whether the trade-offs are too heavy still had to be reviewed by me, sentence by sentence.

Including the words above — from the acknowledgments to the "what cannot be recovered" sections — the feelings were mine first, then it organized them into prose, and then I edited them back. That is probably the relationship between human and tool in this rebuild: it turns a hundred posts into a list and first drafts, and I decide what is worth keeping, and admit what can no longer be found.

Toward the end this actually became quite exciting — grading, de-identifying, writing scripts, checking citations, drafting first versions, with AI lending a hand at almost every step. I felt like a cybernetic body, one person doing the work of a team. The whole rebuild took only two or three days, all in the gaps between confirming the approach; in the past, this workload would have taken a month or more.

The tools also changed several times along the way. In the end the workload mostly moved to the DeepSeek harness — it is still simple, but genuinely useful. Before that, Codex and Claude each ran for a while; trying them out, it turned out DeepSeek was the one that could most reliably carry a piece of engineering through to the end. These projects also happened to validate several approaches for "running stable engineering over long stretches": how to break down tasks, how to keep context, and how to pull it back when it runs off course.

Of course I also benefited from the framework: the structure was constrained and the acceptance criteria were simple, which removed a lot of back-and-forth and made it feel easy. But maybe the workflow being strengthened to this degree is the real question to face going forward — what, in the end, is still left between a person and it. I have not figured that answer out yet.

So this update is not a one-time "relaunch," but closer to re-establishing a set of editorial habits I can keep for a long time. Make the container quiet and the boundaries clear first, then leave the rest to time and continuing judgment.

## Acknowledgments

The people to thank for this rebuild are few, but each mattered. Thanks to Jie for the DeepSeek access, which let this genius programmer live a second life; and thanks to my wife's GPT and Claude — sorting out the notes and thoughts from all these years of work is no small amount of labor, and without them, this site might not have gotten off the ground today.
