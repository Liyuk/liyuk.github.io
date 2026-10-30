---
title: "Comment Systems 101 (3): Product Forms, Supply, and Community"
description: "From experience-based evidence and Q&A to public discussion, this article examines comment formats, contributor motives, cold start, AI summaries, and multilingual design."
locale: en
translationStatus: reviewed
translationKey: 2026/10/comment-101-product
createdAt: 2026-10-30
publishedAt: 2026-10-30
draft: false
type: case-study
tags: [product, technology, algorithms, data, metrics, governance]
column: { slug: comment-systems-guide, order: 3 }
citationUrls:
  - https://support.reddithelp.com/hc/en-us/articles/15484546290068-Community-settings
  - https://www.cac.gov.cn/2022-11/16/c_1670253725725039.htm
  - https://www.sciencedirect.com/science/article/pii/S0167811626000881
  - https://doi.org/10.1016/j.ijresmar.2026.07.004
  - https://doi.org/10.1016/j.dss.2026.114776
  - https://doi.org/10.1177/10591478231224941
  - https://www.sciencedirect.com/science/article/abs/pii/S0191886911005149
  - https://www.sciencedirect.com/science/article/pii/S0747563215302119
  - https://pubmed.ncbi.nlm.nih.gov/36269670/
  - https://ojs.aaai.org/index.php/ICWSM/article/view/14930
  - https://rules-center.meituan.com/m/detail/guize/255?activeRule=1
  - https://rules-center.meituan.com/m/detail/guize/901
  - https://www.samr.gov.cn/zfjcj/tzgg/art/2023/art_d337c3291e8b40459ca03dea54395856.html
  - https://doi.org/10.1016/j.dss.2026.114623
  - https://doi.org/10.27034/j.cnki.ISSN:1006-4885.2026.01.004
  - https://doi.org/10.1080/19368623.2026.2734369
  - https://doi.org/10.1287/mnsc.2023.01006
---
A comment product first needs to decide what work comments are meant to do. Reviews as evidence, Q&A, public discussion, and relationship-based communities may all look like replies, but they serve different user outcomes, carry different supply costs, and need different governance boundaries.

Return to the restaurant place listing (point of interest, or POI) from the series: a review should attach to a stable `place_id`, not only to the `content_id` where it was posted. An article or video can be deleted, reposted, or edited; the place remains the object people search for and compare. The review’s media, author, and thread still keep their own relationships.

## 1. Comment forms: define the output, then choose the anchor and governance

The table brings together comment tasks, platform examples, anchors, outcomes, and guardrails. These categories are not mutually exclusive; one product can support several comment tasks.

| Comment task / form | Platform or context | Anchor and key design choices | Outcomes and guardrails |
| --- | --- | --- | --- |
| Experience evidence and transaction decisions | Amazon, Google Maps, hospitality and e-commerce reviews | `product_id` / SKU, `place_id`, experience date, order or visit provenance; distinguish verified purchase from verified experience; retain model, context, freshness, and genuine negative feedback | Decision quality, returns and after-sales issues, stale information; prevent fake reviews, privacy leaks, and merchant manipulation |
| Q&A and collaborative knowledge | Zhihu, Quora, Stack Overflow, Wikipedia talk pages | `question_id`, distinct answers, source and decision records; promote reusable solutions to answers while preserving arguments and outcomes in decision discussions | Resolution, answer reuse, traceable decisions; prevent votes from standing in for correctness |
| Content response and creator feedback | Articles, YouTube, TikTok videos | `content_id`, author, reply relationship, and media assets; offer an author inbox for questions, author replies, and ways to turn comments into content; moderate media separately | Useful responses, adopted questions, response time; control harassment, spam, and creator burden |
| Public discussion and interest communities | Reddit, Facebook, Weibo/X, Douban Groups, Baidu Tieba, Hacker News | `thread_id`, `parent_id`, `space_id`, rules and relationships; preserve branch context and combine voting with moderators, flags, and community norms | Useful participation, branch reading, first response; watch conformity, conflict, and minority voices being buried |
| Time-anchored co-viewing and co-reading | Video danmaku, live chat, novel chapters or passages | `media_id`, timestamp, live session, chapter version; control density, obstruction, spoilers, and replay mapping | Useful co-viewing or reading, real-time responses, replay reuse; prevent spam and address live risks |
| Subscription, identity, and professional relationships | Subscription communities such as OnlyFans, Blind, Levels.fyi | Subscription entitlements, creators and members, verified identity and visibility; distinguish replies by the person, a team, or AI | Renewal and trust, creator workload; protect identity and prevent harassment and impersonation |
| Publisher-owned discussion layer | Embedded Discourse comments or forums | `site_id`, category, topic, and trust level; publishers manage rules, slow mode, moderation queues, and appeals | Governance cost, member health, and publisher control; make moderation decisions reviewable |

Accounts, moderation, reports, interaction events, and deletion propagation can share a foundation. Answers, discussion spaces, media timelines, and decision records should keep their own domain semantics.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-business-directions.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comment products serve entertainment, experience communities, commerce and local services, and information discussion. Each task needs its own outcome metrics.">
    <img src="/images/writing/comment-101/comment-101-business-directions.svg" alt="Four comment-product tasks: entertainment, experience communities, transactions and local services, and information discussion. Each calls for different outcome metrics." width="960" />
  </a>
  </div>
  <figcaption>Figure: Comments serve different consumption tasks. Interaction capabilities can be shared; outcomes should not be collapsed into one score. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

These forms can be grouped into three broad types. **Evidence-oriented** comments help users make decisions or get answers. **Discussion-oriented** comments produce branching viewpoints, annotations, or traceable consensus. **Relationship-oriented** comments continue through an interest space, a creator relationship, or a shared live moment. The groups overlap, and products often combine them, but the governance priorities differ: evidence needs provenance and freshness, discussion needs a way to organize disagreement, and relationship spaces need to support continued participation while keeping boundaries clear.

## 2. The psychology behind interaction: identity, emotion, and expression

I think another layer sits beneath comments and community interaction: self-expression. Not everyone wants to say everything out loud. Sometimes a like, save, or follow is enough; sometimes a user says publicly, “I agree with you”; sometimes they challenge a claim, add a fact, or point out what they believe is wrong. Expression often circles three questions: **What do I agree with? Who do I want to become? What do I want to correct?** Saving a tutorial may preserve a method for later, or bring someone closer to the person they want to be. Sharing a view may say “this is what I believe.” Correcting an error can defend the facts while also showing what the person values and knows.

I use “narcissism” here in its everyday sense: people want to affirm their own value, judgment, or sense of belonging, either privately or in view of others. This is not a clinical diagnosis, and it does not mean every interaction comes from narcissism. A classic model of social media use treats belonging and self-presentation as important motives. A study of Facebook users also found an association between self-enhancing presentation and receiving likes and comments. These studies describe group-level motives and feedback; they do not let us infer a user’s personality from a single like or save. [Model of motives for Facebook use](https://www.sciencedirect.com/science/article/abs/pii/S0191886911005149); [Study of self-presentation and social feedback on Facebook](https://www.sciencedirect.com/science/article/pii/S0747563215302119)

Interaction also expresses and receives what someone feels in the moment. Joy, agreement, curiosity, being moved, envy, anger, hurt, and disappointment all find different outlets. One person taps like; another saves the post; someone else writes a comment hoping for a response. A user may share a post with a friend to celebrate or get angry together. Replies may comfort, add experience, disagree, or intensify the emotion. A comment section is therefore a place for emotional expression and response as well as an exchange of views.

Research supports the idea that emotion can shape the form of interaction and how people feel afterward. It does not show that every interaction is simply an emotional outburst. In one Facebook experiment, 382 participants were randomly assigned to view positive or negative fictional self-disclosures. Positive posts received more public likes or reactions, while participants were more willing to send a private message in response to negative posts; the researchers interpreted this as possible support-seeking or support-giving. Another study analyzed real Facebook posts and comments from 233 participants. It found that comments tended to match the original post’s emotional tone, and that comment positivity and intimacy were associated with interaction satisfaction and later mood. Both studies have limited samples and settings, but they point to a product distinction: a public like, a private message of comfort, a substantive answer, and a pile-on are different outcomes even when the original post is negative. [Experiment on responses to positive and negative self-disclosure](https://pubmed.ncbi.nlm.nih.gov/36269670/); [Study of comment content and interaction satisfaction](https://ojs.aaai.org/index.php/ICWSM/article/view/14930)

Quiet and expressive interaction form a continuum. A user might simply save or like something, write a sentence of agreement, offer a long analysis, or join an argument. My view is that comments and community interactions respond to other people and content, but they often answer private questions too: What do I believe? Who am I? How do I want others to see me? Recognizing someone else’s view can also affirm one’s own judgment. A creator’s reply, an accepted comment, or agreement from other readers turns a private judgment into social feedback, reinforcing belonging, identity, and the desire to speak again. That is part of how comment sections grow into communities.

Products should offer ways to express oneself at different levels of effort and visibility rather than pressuring everyone to speak: saving quietly, leaving lightweight feedback, asking a question, adding experience, and debating publicly all need a place. Comfort, thanks, agreement, disagreement, and requests for help also call for different kinds of response. Community governance should not remove every negative emotion. It should preserve room for dissatisfaction, disappointment, and criticism while stopping threats, humiliation, pile-ons, and manipulation. Nor should these actions be treated as direct labels of motive: a save does not always mean agreement, a like does not always signal endorsement, a correction is not necessarily right, and negative tone does not make a comment low quality. Product analysis can use context, later behavior, and voluntary feedback to understand expression; recommendation models should treat behavior as a weak signal with context. If the system rewards only the expression that attracts the most attention, conflict, superiority, and the urge to “prove I’m right” can crowd out quieter, useful contributions.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-product-architecture.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comment-product capabilities are organized into expression and submission, conversation and co-creation, discovery and decisions, and contribution and return, with community governance across all layers.">
    <img src="/images/writing/comment-101/comment-101-product-architecture.svg" alt="Comment-product capability architecture: expression and submission, conversation and co-creation, discovery and decisions, and contribution and return, with community governance across the layers." width="960" />
  </a>
  </div>
  <figcaption>Figure: Comment-product capability architecture. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

## 3. Supply, incentives, and return visits

If the business also wants to improve retention and LTV, incentives can give users a reason to return. They should reward the result of a contribution, not daily opens or sheer volume. Consecutive-day check-ins are easy to implement and just as easily turn participation into a chore. Tasks closer to comment value might ask a user to answer an unresolved question this week, return a week later to say whether a method worked, or help a new member find reusable advice. Missing a day should not erase all progress; let users pause, make up, or turn off reminders.

Rewards can work at three levels: immediate feedback (the questioner accepts an answer, or an author responds or says thanks); visible milestones (“You helped resolve five questions this month”); and small permissions tied to the contribution (such as suggesting topic tags or an FAQ entry). If points are used, weight them by whether an answer is later accepted, reused in search, or confirmed by the questioner. Discount points for duplication, reciprocal farming, and low-effort spam. Keep leaderboards inside challenges people choose to join. A high comment count should not automatically grant moderation authority or more organic exposure. Reddit has streaks and contribution achievements; Stack Overflow connects the reputation earned through useful Q&A to community permissions. These are product patterns to learn from, not proof that the same mechanics will raise LTV elsewhere.

Badges depend on what they reward. A large online-learning experiment found that badges increased contribution volume and sustained participation without an observed decline in quality. Research on Stack Overflow badges also found associations between badge levels and later answering activity. A quasi-experiment involving 81,393 Yelp reviewers found different effects from first recognition, repeated recognition, and recognition people felt they had earned but did not receive. Repeated rewards may have diminishing returns, while perceived unfairness can reduce contributions. The results come from specific products and tasks. Test effects in the product at hand with a holdout, and watch whether the reward widens the gap between new and experienced contributors.

Before adding incentives, account for the cost of contributing. Users recall an experience, organize their thoughts, decide whether to attach their identity, and perhaps upload media. Someone answering also has to read the context, check the question, and risk being misunderstood or attacked. If a submission receives no status update for a long time or never becomes visible, the user pays a process cost on top of the creative effort. Each additional moderation step can improve safety while adding friction. Moderation therefore affects supply as well as governance. “Tax” is a product-analysis metaphor here, not a uniform monetary valuation of users’ time.

Supply health is more than the total number of comments. Track whether useful contributors return: 7- and 30-day contribution rates after a first submission, return rates by contribution depth, the relationship between moderation-delay percentiles and return probability, the share of blocked or collapsed comments with no explanation or appeal outcome, appeal wait time, and attrition across contributor tiers. A team can estimate how the probability of a contributor’s next submission changes with each additional hour of review delay. That requires historical queue data, a quasi-experiment, or a randomized workflow change; correlation alone does not establish cause.

### 3.1 Supply and demand share the same users: motives, rewards, and reputation

Unlike a typical two-sided market, comments do not always come from one fixed group and go to another. A reader may have just completed an experience or may be looking for an answer to a specific situation. They might first read other people’s accounts, then add, “My case was different.” Demand and supply move back and forth among the same users: when a need is met, someone may contribute a new experience; when a contribution is read and answered, its author has a reason to write again.

The platform’s interventions affect both sides. Ranking and summaries lower reading costs, but also determine which comments receive attention. Levels and rewards add external returns, but can change the effort people put into writing. Replies and “helpful” feedback tell contributors whether their words entered someone else’s decision. Neither total comment volume nor reader satisfaction alone reveals whether an intervention created a cost on the other side.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-supply-demand.svg" target="_blank" rel="noopener" aria-label="View the full diagram: users move between reading comments and contributing; ranking, summaries, incentives, moderation, and feedback affect both sides, while object, time, and context create distinct supply gaps.">
    <img src="/images/writing/comment-101/comment-101-supply-demand.svg" alt="Comment readers and contributors are often the same people. Ranking, summaries, incentives, moderation, and feedback affect both sides; gaps arise by object, time, and context." width="960" />
  </a>
  </div>
  <figcaption>Figure: Comment supply and demand are not a static match between two groups; they feed back into each other through the platform.</figcaption>
</figure>

People may write for at least three reasons: **intrinsic motivation**, the wish to record, express, or share; **instrumental motivation**, the prospect of points, status, benefits, or compensation; and **social motivation**, the hope that someone will read, respond, accept, or thank them. These motives can coexist, but a platform’s incentive design can strengthen one while weakening another.

Rewards do not have one universal effect. A 2026 study in the *International Journal of Research in Marketing* used data from roughly 1,600 merchants on a Chinese local-services crowdsourced review platform in 2009 to 2010. With a time-discontinuity design, the researchers estimated the effect of per-review rewards. They reported lower total review volume and more positive reviews; low-visibility merchants were affected more, and the estimated Gini coefficient for review distribution rose by 16.85%. Mechanism analyses were consistent with crowding out intrinsic motivation; reviews also became shorter, less informative, and more alike. The study covers one early platform and reward scheme. It shows how rewards can change who writes, which businesses receive reviews, and what those reviews contain. [Study of platform rewards and inequality in review distribution](https://doi.org/10.1016/j.ijresmar.2026.07.004)

Badges are another intervention. Research on Tripadvisor Star Badges found that quantity-based levels may increase review volume while reducing the effort put into each review’s text. What a level rewards shapes what users optimize. [Study of Tripadvisor Star Badges and review effort](https://doi.org/10.1016/j.dss.2026.114776)

Product design should distinguish cash or benefit rewards, volume-based levels, quality recognition, and task prompts, then test how each affects supply, topic coverage, writing effort, and contributor mix. Review solicitation should not be judged by total volume alone either: a Tripadvisor study observed that as total reviews increased, organic reviews and specific experience reports could be crowded out. Rewards are not necessarily more effective than natural expression, and a lifetime review count should not automatically become moderation authority, privileged exposure, or a claim to judge facts. [Study of review solicitation and organic contributions](https://doi.org/10.1287/mnsc.2023.01006)

### 3.2 Feedback and cold start: turn demand into specific contributions

Demand feeds supply first through feedback. A 2025 study of a restaurant review platform found that negative peer feedback was associated with higher platform retention than receiving no feedback at all. Among users who continued to post, the researchers also observed higher subsequent review frequency and quality. For product teams, the finding points to the cost of silence: a response can sustain participation even when it is critical. Products can show contributors aggregated, anonymized signals such as reads, helpful votes, acceptance, or follow-up questions, while leaving room for constructive criticism. [Study of negative peer feedback and subsequent content production](https://doi.org/10.1177/10591478231224941)

The decision itself can also create a more specific opening for a contribution. Right after buying, visiting, or resolving a question with a review, a user may know exactly what helped and what was missing. Asking “Did this review help?” or “What condition did it leave out?” at a natural decision point is a product hypothesis. Compare it with a generic “Write a review” prompt, and avoid pushing people to post during complaints, refunds, or other negative-experience handling.

Ranking determines the attention a contribution receives. A new comment should not be permanently buried because it arrived late, but that does not mean every new comment deserves equal exposure. Give new comments some exploratory exposure, adjust interactions for position, test whether new topics or conditions add information, and see whether people who read them actually complete the task. Fairness means a reasonable chance to be evaluated on a comparable basis, not a guarantee of equal results. Spam and low-quality noise still need controls.

When a comment section “lacks supply,” the missing piece may not be total volume. It may be one of three things:

1. **Object scarcity:** A new product, place, or piece of content has search or browsing demand but few comments. Reach people who have just had a real experience and can add first-hand detail, rather than broadcasting “write a review” to everyone.
2. **Time scarcity:** There are many comments, but opening hours, software versions, product batches, or service processes have changed. Use timestamps, recent filters, and stale-information notices to show whether current evidence exists. Whether an old comment should lose weight depends on the information, not a universal expiration rule.
3. **Context scarcity:** A product or place has many comments, but none answer “Is it good for children?”, “Is there a lunch queue on weekdays?”, or “Does this model work with my device?” Turn unanswered demand into a specific task for someone with relevant experience.

Demand from readers can show where the gap is; a contribution task turns that gap into something a contributor can answer. Afterward, measure effective coverage, time to first answer, answer reuse, and contributor return alongside comment volume.

If a team uses operational seed contributions during cold start, keep them distinct from customer-experience reviews. Internal accounts can post rules, FAQs, conditions of use, or example questions, clearly labeled as official or operational content. They must not impersonate ordinary users or fabricate visits, purchases, or use. Seed content needs an internal provenance label, a size limit, and an exit condition. Once real contributions reach the planned coverage, review whether seed content should remain, be labeled differently, or be removed. Track its share in supply and its share of ranking, search, and summary exposure. Set thresholds for the product; reading rates supported by seed content do not show that real user supply is healthy.

A better seed effort is for the internal team to ask representative questions, clarify service conditions, and show what makes an answer useful, then invite people with real experience to add their own. The first provides participation norms and demand structure; only the latter provides first-hand evidence. Keep them distinct in data and presentation.

Feedback, specific gaps, and return visits form a contribution loop:

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-contribution-loop.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comment tasks prompt useful contributions; user confirmation and reuse create recognition and return visits; contribution quality, community burden, incentive distortion, and abuse are guardrails.">
    <img src="/images/writing/comment-101/comment-101-contribution-loop.svg" alt="A comment task prompts a useful contribution; user confirmation and reuse lead to recognition and return visits, with quality, community burden, incentive bias, and abuse as guardrails." width="960" />
  </a>
  </div>
  <figcaption>Figure: The comment contribution and incentive loop. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

### 3.3 How AI summaries reshape supply

Public research does not agree on whether AI summaries reduce review volume. Studies of Tripadvisor and Ctrip report a decline in contribution, while a cross-platform study of Tripadvisor and Expedia observed increased participation. An Amazon experiment also found lower engagement with individual reviews and less diversity in later review topics. The platforms, samples, and summary formats differ; these results do not support a blanket claim that AI summaries always crowd out supply. [Tripadvisor study of AI summaries and UGC supply](https://doi.org/10.1016/j.dss.2026.114623); [Study of 644 hotels on Tripadvisor and Ctrip International](https://doi.org/10.27034/j.cnki.ISSN:1006-4885.2026.01.004); [Cross-platform study of Tripadvisor and Expedia](https://doi.org/10.1080/19368623.2026.2734369); [Amazon study of AI summaries and review-topic diversity](https://www.sciencedirect.com/science/article/pii/S0167811626000881)

Product teams need to test which expressions a summary replaces and which details it leaves out. By review sentiment, object popularity, and contributor tenure, track net contribution, topic diversity, coverage of specific conditions, and later reuse. If the summary already covers generic praise, the prompt could ask users to “add a condition, timing, or counterexample the summary missed.” Evaluate reading benefits and supply structure in the same experiment; summary clicks or total review volume alone are not enough. Publicly accessible reviews have some features of a public good: they are non-rival and difficult to exclude people from. Login, payment, or community permissions make access excludable, so the classification depends on visibility. Either way, contributors bear the cost of writing and waiting for moderation; “digital shadow labor” can remind a team to account for that cost, but it is not a universal way to price it. Contributor retention also needs to be separated into recognition and relationships versus reputation that cannot be transferred elsewhere.

## 4. Community climate and contributor supply

A welcoming community does not appear just because a rule says “be kind.” The product needs to explain what the community is for, what participation it welcomes, and where to go when conflict arises. Before someone’s first comment, offer a short, concrete prompt such as “Add the conditions that mattered to you; discuss the approach, not the person asking.” New members should be able to start with low-pressure actions: save a useful account, add a condition, or answer an open question. They should not have to introduce themselves publicly or maintain a check-in streak. Authors, experienced members, and moderators can model how to welcome newcomers and disagree without attacking them. The platform needs to enforce rules consistently, explain its actions, and provide an appeal path. YouTube offers channel welcome messages and conversation guidelines; Reddit has welcome messages and new-member threads; X’s community guidance describes connecting members and building a community culture as moderator responsibilities. Each turns community-building into product entry points and ongoing work.

Comment sections also rely on people willing to keep answering: authors, experienced users, buyers, local contributors, and moderators. Their time is supply; it is not unlimited and free. Queues for unanswered questions, duplicate-question merging, author-reply notifications, and volunteer schedules can make the work easier. Too many reminders, sending every question to the author, or ranking people by reply count can turn participation into a burden. Track retention among useful answerers, contribution concentration, responder workload, and response time. Ask contributors periodically whether they want to continue. When supply is short, first improve question visibility, answer reuse, and the cost of responding rather than simply adding points.

## 5. Multilingual comments: one shared discussion space or several?

The first multilingual decision is about the boundaries of the discussion space, not a translation button: do comments stay visible within language-specific areas, or enter one shared pool? The choice affects supply, moderation, ranking, summaries, and search.

| Model | Visibility and translation | Main benefit | Main cost and when it fits |
| --- | --- | --- | --- |
| Separate language spaces | Comments stay in their original language area; users request translation and can always see the source text | Clear governance boundaries; moderation and community norms can vary by language or region | Evidence pools fragment and small-language content is harder to reuse; suits an early stage before supply, moderation, and translation quality are stable |
| Shared pool with mixed-language display | All languages enter one pool and are translated for the user | A more unified evidence pool and greater cross-language reach | Translation can change tone or meaning; moderation, regional compliance, and ranking become more complex, so a universal default needs validation |
| Shared pool with layered ranking | Store comments together, but select translation, ranking, and summaries by user language, region, and current task | Combines evidence reuse with contextual fit | Requires reliable language identification, translation evaluation, provenance labels, and cross-language retrieval; can be introduced as supply and governance mature |

A product can begin with separate language spaces, then pilot a shared pool with layered ranking where cross-language demand is clear and moderation is ready. There is no need to jump straight to a fully translated mixed feed. Label machine translations, let users open the original in one tap, and record original-author, human, and machine translations separately. Moderation should retain the source text, target-language version, policy and model versions, and source region. A translated tone should not be mistaken for the author’s intent. Cross-language recommendations should follow the user’s current query and task: a search for a place can retrieve useful local-language experience, while a home feed does not need to distribute every translated review to everyone.

Better translation coverage and discovery by the right audience may reward contributions in smaller languages. That is a product hypothesis, not a substitute for authentic reviews, provenance labels, or user consent.

## 6. A stage model for comment systems: what work can comments do now?

Stages should be defined by the work a comment system is trusted to do, not by its month number. Each stage needs an entry condition for the next one. If safety, trust, or user outcomes from the previous stage remain unstable, fix the guardrails before adding more features.

| Stage | What comments are expected to do and what to measure | Main product and operational work | Conditions for moving on |
| --- | --- | --- | --- |
| **0: Don’t break** | People can post, read, report, and delete; status is understandable. Track basic availability, moderation errors, and deletion-propagation time. | A minimal input and list. At low volume, manually review every submission to calibrate rules. Record appeals, edits, and deletion propagation. | Moderation errors, appeals, and deletion propagation are observable and stable. Audit human review too; people are not automatically right. |
| **1: Get read** | Comments are consumed, not merely produced. Focus on useful reads after exposure and exposure coverage. | Minimal latest and popular sorts; visible first-screen comments. If using seed contributions, label them as operational content rather than real experiences. | Moderation and appeals are stable, seed content is controlled, and useful-read rates are not carried by operational content alone. |
| **2: Solve problems** | Provide information with conditions, context, and freshness. Focus on resolution, answer reuse, and decision quality. | Question labels, resolved status, task filters, and specific contribution prompts based on unanswered demand. | Useful reading is stable and resolution and decision quality can be measured; a few pinned high-vote comments are not enough. |
| **3: Sustain supply** | Contributors return and the supply mix remains healthy. Focus on useful-contributor retention, contribution concentration, and first responses to new members. | Tasks with quality constraints, visible feedback, tiered moderation, and community norms. | Incentives have not degraded decision quality, specificity, or the contributor mix. Continue to watch moderation delays and retention. |
| **4: Reuse as evidence** | Comments become traceable evidence for search, recommendations, and AI retrieval. Focus on downstream task quality, citation accuracy, and correction time. | Provenance links, structured time and conditions, conflict and staleness cues, and downstream data contracts. | Edits, appeal reversals, deletions, and authorization changes propagate to indexes, summaries, features, and training snapshots. |

The stages are not a calendar or a maturity ladder every product must climb. Entry conditions are guardrails, not the previous stage’s primary metric. Comment counts, time spent, and conversion can diagnose a task, but their growth does not prove the system is ready for a new responsibility. The second article covers metric definitions and experiments. The roadmap answers what comments are allowed to do now; specific thresholds still need to be validated against the product’s user tasks.

---

The product form determines what kind of value comments should preserve; supply design determines whether that value keeps appearing. Ranking and moderation answer the next questions: how these expressions get a chance to be seen, and which boundaries must hold.

Series: **Comment Systems 101** | [Series guide](/en/writing/2026/10/comment-101/) · [Metrics and experiments](/en/writing/2026/10/comment-101-metrics/) · [Product forms and supply](/en/writing/2026/10/comment-101-product/) · [Ranking and governance](/en/writing/2026/10/comment-101-governance/) · [Data and algorithms](/en/writing/2026/10/comment-101-architecture/)

Continue reading: [Next article](/en/writing/2026/10/comment-101-governance/)
