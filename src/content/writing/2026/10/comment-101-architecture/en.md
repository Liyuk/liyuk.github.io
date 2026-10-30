---
title: "Comment Systems 101 (5): Data Models, Cleaning, and Algorithms"
description: "From comment-domain models, moderation lifecycles, and data cleaning to recommendations, search, AI search, and GEO, this article follows the engineering path of comment data."
locale: en
translationStatus: reviewed
translationKey: 2026/10/comment-101-architecture
createdAt: 2026-10-30
publishedAt: 2026-10-30
draft: false
type: case-study
tags: [product, technology, algorithms, data, metrics, governance]
column: { slug: comment-systems-guide, order: 5 }
citationUrls:
  - https://developers.google.com/search/docs/appearance/structured-data/discussion-forum
  - https://developers.google.com/search/docs/appearance/ai-features
  - https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - https://doi.org/10.1145/3637528.3671900
  - https://developers.google.com/search/docs/monitor-debug/prevent-abuse
  - https://developers.google.com/search/docs/crawling-indexing/control-what-you-share
  - https://redditinc.com/policies/data-api-terms
  - https://www.nature.com/articles/s41586-024-07566-y
  - https://research.google/pubs/improving-user-topic-interest-profiles-by-behavior-factorization/
  - https://research.google/pubs/transparent-scrutable-and-explainable-user-models-for-personalized-recommendation/
  - https://arxiv.org/abs/2605.24245
---
A comment is both user-facing content and a data object that keeps changing. Consider the restaurant place listing (point of interest, or POI) in this series. The system needs to connect a specific experience to a place, time, author, and exposure context. Algorithms must then distinguish consumption interests, expressive behavior, and evidence in the content; raw interaction counts are not preferences.

## 1. Model the object, its relationships, and its current state

Comments differ across products, but the underlying model does not need a separate copy for every business. Engineering first needs to answer three questions: what does a comment attach to, which relationships can a user create with which objects, and which state is authoritative? A restaurant review should reference a stable `place_id`, its author, and the experience date. A reply under a video should reference both the video and the comment it answers. A product review may also carry an SKU and order-verification source. These can share a comment foundation and extend it with facts specific to each domain.

A comment has a body, author, attachments, reply target, moderation decision, and visibility state. It is a content entity with its own lifecycle, not a simple interaction event. A like or save usually represents a current relationship between a user and a target. A comment like can point to a comment; a content like can point to an article or video. The two can share a target reference and event format, but their state semantics differ and should be stored separately.

A domain model can begin with several object types:

- `contents` / `places` / `products` are the content or business entities being discussed. Each domain owns its identity and state.
- `comments` stores the body, author, target, parent comment, root comment, version, and current moderation and visibility state.
- `user_reactions` stores current user-to-target relationships such as likes and saves, with a uniqueness constraint on user, target, and action.
- `moderation_cases` stores the review case, workflow stage, evidence, policy version, and appeal outcome. Do not collapse moderation history into `approved=true/false`.
- `interaction_events` records facts such as submission, exposure, expansion, likes, saves, replies, reports, edits, hides, and deletions.
- `comment_counters`, search indexes, and recommendation features are downstream projections that can be rebuilt. They are not the source of truth for whether a comment exists or is public.

A rough schema might look like this:

```text
contents(id, type, author_id, status, published_at, ...)
discussion_spaces(id, type, owner_id, ruleset_id, ...)
threads(id, space_id, root_content_id, status, ...)
places(id, canonical_name, category, geo, status, merged_into_id, ...)
products(id, canonical_id, category, status, ...)
comments(id, target_type, target_id, author_id, parent_id, root_id, depth,
         body, version, status, created_at, updated_at, ...)
answers(id, question_id, author_id, body, status, accepted_at, ...)
discussion_outcomes(id, thread_id, outcome_type, rationale, source_refs, resolved_at, ...)
user_reactions(user_id, target_type, target_id, reaction_type, active, updated_at)
interaction_events(event_id, user_id, target_type, target_id, event_type,
                   event_at, context, object_version, ...)
moderation_cases(id, object_type, object_id, stage, decision,
                 policy_version, reviewer_id, created_at, ...)
comment_counters(target_type, target_id, likes, replies, version, updated_at)
```

The schema illustrates facts and ownership boundaries; each product can choose its own physical tables. A comment target can be represented logically as `target_type + target_id`, but a relational database may not be able to enforce a foreign key across all target types. For database-enforced referential integrity, use association tables for content, places, and products behind a unified service interface. Choose the design around target types, query patterns, and consistency requirements.

Fields also need to distinguish current values from events that happened. `comments.status` and `comments.version` represent the current authoritative state. Every edit, moderation reversal, and deletion is a distinct version change. Likes and unlike actions fit a current relationship such as `user_reactions.active`, while also emitting `reaction_added` and `reaction_removed` events for analytics and modeling. If the system stores only cumulative counters, it is hard to correct duplicate requests, reversals, or abuse-related rollbacks. If it stores only events, every online read has to scan history. Typically, relationships and objects hold current facts, event streams preserve changes, and counters and features are rebuildable projections.

Design APIs around these boundaries instead of letting clients submit a writable `status`:

| Operation | Request | Server-side checks | Side effects on success |
| --- | --- | --- | --- |
| Create comment | Target, body or media references, parent comment, idempotency key | Target exists and allows comments; permissions; length; media ownership; reply depth | Write a pending version and emit a submission event |
| Edit comment | Comment ID, expected version, updated content | Author or moderator permissions; version is current; re-review policy | Create a new version; show or hide the old one according to policy |
| Moderation decision | Case ID, action, policy version, operator | Case is current; state transition is valid; permissions and rationale are complete | Update authoritative state and emit a versioned state event |
| Delete or hide | Comment ID, expected version, reason category | Operator permissions; whether appeal or audit retention applies | Change visibility immediately and notify caches, indexes, and features to withdraw it |
| Like or unlike | Target and action, idempotency key | Target is visible; user can act; rate limit | Update the relationship idempotently and emit add/remove events |

The client requests an action; it cannot set the final moderation state, counter, or risk level. `expected_version` rejects stale edits, and an idempotency key absorbs retries. Use controlled categories for moderation rationale and attach auditable evidence references, rather than putting unnecessary personal information in free-text logs.

Different community forms should not all be forced into one `comments` table. Q&A answers may need their own sorting, acceptance, and editing rules. Interest communities need `discussion_space` and `thread` objects for the container and topic. Collaborative discussion may need to record conclusions, evidence, and follow-up actions. They can share user, moderation, and event infrastructure without collapsing distinct domain semantics into `body + parent_id`. Whether they need separate physical tables or services depends on query load and lifecycle.

Reply relationships also need to enforce the product rule. Following the one-level design from the product article, top-level comments have no `parent_id`; a reply points to a top-level comment, `root_id` always points to the same root, and `depth` can only be 0 or 1. A reply can also store `reply_to_user_id`, separating “who am I answering?” from “how far is this indented?” Enforce the depth rule in the database or server-side write path, so a client cannot bypass the UI and create an infinitely deep tree. That gives listing, sorting, notifications, moderation, and branch deletion stable boundaries.

POI and e-commerce fields belong in domain extensions, not as empty fields every comment must carry. A place contribution can reference `place_id`, `visited_at`, branch, and place-merge relationships. A product review can reference `product_id`, SKU, order or trial provenance, purchase or usage duration, and after-sales status. Order verification is evidence of provenance, not objectivity. A visit date shows when the review may apply, not the user’s precise location history. Store images, video, and audio as media assets; comments reference media IDs, while review status, transcription versions, and permissions stay with the assets.

Tables should reflect real queries. A detail page reads comments by target, public status, and time. Replies are fetched by root comment and status. Moderation queues sort cases by stage, risk, and submission time. A user profile reads contributions by author and time. Useful indexes might include `(target_type, target_id, status, created_at)`, `(root_id, status, created_at)`, and `(stage, risk_level, created_at)`. Add a unique constraint on `(user_id, target_type, target_id, reaction_type)` to stop retries from creating duplicate likes. Counters can be maintained from an event stream or a transactional projection and reconciled periodically. Even when a counter is briefly stale, it must not determine whether a comment is visible.

The deliverable for modeling is more than an ER diagram. It includes field and state definitions, uniqueness and ownership constraints, API contracts for target types, common read paths and indexes, and reference-handling rules for edits, merges, and deletion. The model diagram brings those boundaries together: content owns comments, users create interactions, moderation cases preserve decisions, and events drive rebuildable statistics and retrieval views.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-model.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comments attach to articles, videos, places, or products; interaction relationships hold current like and save state; moderation cases preserve governance decisions; events drive rebuildable projections.">
    <img src="/images/writing/comment-101/comment-101-model.svg" alt="Comments attach to articles, videos, places, or products. Interaction relationships store current like and save state; moderation cases preserve decisions; events drive rebuildable projections." width="960" />
  </a>
  </div>
  <figcaption>Figure: Comments hold current state, moderation cases retain the decision trail, and events drive counters, retrieval, and recommendation features. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

In the diagram, `TARGET REFERENCE` is a unified logical reference, not necessarily one physical table. Dashed lines indicate polymorphic relationships: the target can be an article, video, place, or product, but the database needs a separate strategy to maintain referential integrity. `parent_id` and `root_id` represent reply relationships; the product still allows only one reply level. Current state controls display, moderation cases preserve the basis for decisions, and events drive rebuildable projections. These are three different things, not one “universal comment record.”

## 2. The comment pipeline: from submission to downstream withdrawal

Once the object model is clear, define a comment’s path from submission through withdrawal from the system. The main engineering task is not to build separate comment pipelines for videos, articles, and POIs. It is to define reusable state flows and event contracts, then let each business connect its target identity, permissions, moderation rules, and downstream consumers.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-system-architecture.svg" target="_blank" rel="noopener" aria-label="View the full diagram: client requests pass permission and version checks, write comment state and an outbox, and events drive moderation, comment reads, search, and algorithmic feature projections.">
    <img src="/images/writing/comment-101/comment-101-system-architecture.svg" alt="Client requests pass permission and version checks, write comment state and an outbox, and events drive moderation, comment reads, search, and algorithmic feature projections." width="960" />
  </a>
  </div>
  <figcaption>Figure: The engineering pipeline sends comment state and interaction events to their respective downstream systems. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

### 2.1 A submission first becomes a traceable write

The client does not command the system to “make this text public.” It sends a contextual submission request. The server should check the actor, whether the target exists and allows comments, user permissions, whether the reply depth is still within the one-level limit, and whether the body and media references are valid. The request should also carry an idempotency key or client event ID. If a weak connection triggers a retry, the server can recognize the same submission and avoid creating two comments.

On write, save the comment ID, target ID, author, parent and root comment, submission time, content version, source entry point, and idempotency token together. Fields such as a POI’s `visited_at`, or an SKU and verification source on a product review, belong in extension data only when that context applies. A general comment API should not make every business-specific field mandatory. Store the raw submission in a pending state; a successful database write should not immediately make it readable from a public list.

Exposure and interaction need to be linkable. If a comment expansion, like, save, or reply follows an impression in a list or content view, include a linkable `impression_id` where possible, along with the entry point, comment position, sort mode, session stage, and organic or paid source. Not every action needs the same large context payload, but the system should be able to answer: did the user see this comment, where was it, and which task brought them here? Without an exposure denominator, like and save rates are hard to interpret. Mixing paid exposure, author pins, and organic popularity also contaminates ranking training. Chapter 3 covers normalization, deduplication, and cleaning for these events.

The comment object, its current state, and its pending events need a reliable handoff. The implementation can use a transactional event table, an outbox, or an equivalent mechanism. The key is that if the process crashes after saving the business record but before publishing a message, the event can still be replayed from durable storage. Consumers process events idempotently by event ID, so redelivery does not duplicate counters or notifications. At a minimum, an event needs `event_id`, object ID, object version, event type, event time, and source context. These fields tell downstream systems what happened to which version of which object.

### 2.2 Moderation decisions drive visibility state

After persistence, a comment enters automated and, where needed, human review. The engineering model should store the comment’s current state separately from the moderation case. A comment can be `pending_review`, `visible`, `held`, `rejected`, `removed`, or `deleted`; the case separately stores machine decisions, human workflow stages, policy and model versions, match evidence, and appeal outcomes. A moderation decision creates a new version of the comment state; it should not overwrite the prior decision.

How automated screening, first human review, secondary review, and AI sampling are divided is a governance policy. Engineering must make the policy configurable and traceable. Each transition should validate the allowed source state and object version so a delayed, old approval cannot republish a comment that has since been deleted or overturned. After human review, the comment service updates the authoritative state and emits a new versioned event. Downstream consumers accept only a change newer than the version they have.

Separate the moderation decision from user visibility where the product needs to. A comment may become visible after passing automated review; in a higher-risk case, it may pass moderation but remain hidden by the author or rate-limited under community rules. A simple product can combine these into one state field. Once appeals, author hides, folded display, and internal holds are needed, one enum should not carry independent dimensions. At minimum, define the allowed state transitions and return a diagnosable error for an invalid one:

| Current state | Allowed action | Example next state | Downstream meaning |
| --- | --- | --- | --- |
| `pending_review` | Automated approval, hold, or rejection | `visible` / `held` / `rejected` | Only `visible` creates a public-list and search projection |
| `visible` | Edit, author deletion, platform hide, report escalation | New version pending review / `deleted` / `held` | Stop exposing the old version; deletion or hiding triggers withdrawal |
| `held` | Human approval, continued hold, or rejection | `visible` / `held` / `rejected` | Preserve the review result and operator for audit |
| `rejected` | Appeal or administrator correction | `pending_review` / `visible` | Re-review links to the original case instead of rewriting its history |

This is an implementation example, not a required enum for every product. The important part is to define which actions create a new content version, which only change display policy, and which must immediately withdraw a public index. Retain the operator, reason, time, and policy version for every transition.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-lifecycle.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comment visibility state is separate from moderation workflow; automated review, first review, secondary review or appeal, and AI sampling create versioned state events that update or withdraw downstream data.">
    <img src="/images/writing/comment-101/comment-101-lifecycle.svg" alt="Comment visibility state and moderation workflow are modeled separately. Versioned events from automated review, human review, appeals, and AI sampling update or withdraw downstream data." width="960" />
  </a>
  </div>
  <figcaption>Figure: The state flow defines when a comment is visible and how edits, review, and withdrawal affect downstream systems. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

### 2.3 Update each read view after publication

Once a comment becomes visible, the comment list, author inbox, reply notifications, counters, search index, and algorithmic features may all need updating. They do not need to share one read table. The comment service holds the authoritative object and state; downstream consumers build projections for their own queries from events. A comment list needs visibility, reply relationships, and sort fields. Search needs searchable text, entities, dates, and moderation state. Recommendations need exposure-adjusted interactions, content semantics, and governance labels.

Each projection should expose its event-processing progress, ignore duplicate messages, and allow failed messages to be retried or replayed manually. If a non-critical projection is late, comments can still be safely displayed according to their authoritative state. Safety withdrawals and permission changes need an explicit priority and maximum propagation time. Counters can lag briefly and be reconciled; search and recommendation features can refresh asynchronously. None of them should continue to treat an invisible comment as a public answer.

The engineering contract includes event names, field versions, state-transition rules, consumer idempotency, acceptable delay, and compensation methods. Event-field changes must remain compatible with existing consumers; a new field must not silently change the interpretation of historical events. The data-cleaning section below covers how to build training and retrieval views from raw events. The online-failure section covers queue backlogs, replays, and observability.

### 2.4 Edits, deletions, and appeals must withdraw old versions

A comment does not stay still after it is written. An author’s edit creates a new version and requires another review. The product must decide whether to keep the old version visible during review or hide it temporarily. User deletion, platform enforcement, an appeal reversal, removal of the parent content, and a POI merge should all produce versioned state events, not just flip a display flag.

After a downstream consumer receives a withdrawal event, it should remove or replace the comment-list cache entry, counter contribution, notification preview, search document, vector-index entry, recommendation feature, and summary source by comment ID and version. A late consumer must not overwrite a newer state with an old version. If an index service is down, withdrawal jobs need durable queuing, alerting, and catch-up after recovery. If an AI summary cites an old comment, the system should locate that citation and recompute or hide the summary. Whether training snapshots and historical audit data are physically erased depends on privacy, law, and retention policy. At a minimum, a withdrawn comment should no longer be a currently visible answer or positive distribution signal.

A successful API response is not enough to validate the pipeline. From submission to publication, the system should be able to trace the author, target, moderation basis, content version, event ID, and processing version of each downstream consumer. After an edit or deletion, it should confirm that comment lists, notifications, search, and recommendations no longer serve the old content. Cleaning and ranking need trustworthy inputs.

## 3. How comments are cleaned as they enter the data stream

A comment is user content, but also behavior that occurred under a piece of content, in a reply tree, and after an exposure. Cleaning must preserve those relationships and states. Otherwise, “the author answered a specific question” and “a user repeated a phrase in an argument” may look similar as text but mean very different things for recommendation.

<figure class="comment-diagram" style="--comment-diagram-width: 1280px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-data-flow.svg" target="_blank" rel="noopener" aria-label="View the full diagram: comments move from submission, moderation, and enrichment into event storage and feature retrieval, then serve comment ranking, recommendations, commerce, and search; exposure and task outcomes feed the next event cycle.">
    <img src="/images/writing/comment-101/comment-101-data-flow.svg" alt="Comments flow from submission, moderation, and enrichment into event storage and feature retrieval, then serve comment ranking, recommendations, commerce, and search. Exposure and task outcomes feed the next cycle." width="960" />
  </a>
  </div>
  <figcaption>Figure: Moderation state controls visibility; governed data views are what downstream ranking, recommendation, and search consume. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

First collect the original submission and enough context: comment body, author, parent and root comments, parent content, submission time, language, edit version, exposure source, and client event ID. Then validate format and length, normalize encoding, and deduplicate idempotently. Full-width and half-width characters, capitalization, or whitespace can be normalized into a matching copy. Preserve the original text according to privacy and retention policy; a normalized result must not overwrite it. Keep structural markers for mentions, links, emoji, quotations, and deliberately obfuscated sensitive words. These may be moderation evidence or part of the sentence’s meaning, so do not strip them automatically.

Next run abuse and safety checks separately. Spam detection looks for promotional flooding, copy-paste content, coordinated accounts, link farms, and abnormal frequency. Safety review looks for policy violations, harassment, threats, and privacy exposure. Preserve the category, confidence, model and rule versions, and action for each hit. Rejected, held, or unpublished comments do not belong in public comment ranking or positive-interest training. With access controls, they can still serve as moderation examples for risk models. A report is not a label that “this sentence is a violation”; it is a user-provided risk signal.

After text review, add structured and semantic annotations: topic, entities, product/place/model, question, recommendation, experience steps, author reply, sentiment, and the object being discussed. Sentiment classification needs an “uncertain” option. Sarcasm, irony, and quotations should not be treated as attacks just because they contain negative words. Automated labels need a source, version, and confidence. Send low-confidence labels for sampled review instead of quietly writing them into factual fields. Model the comment alongside its parent comment and main content; mark which comment a reply answers instead of embedding each body as an isolated text vector.

Deduplication does not mean deleting every copy until one remains. A user sending the same text repeatedly in a short period can be blocked or collapsed as a retry. Identical text from different users might be spam, but it might also be an event slogan, a common answer, or a quotation. Near-duplicate clustering should produce a cluster and anomaly score, preserve each original comment and its account, time, and thread relationship, and let moderation policy decide whether to hide, downrank, or use it only for abuse detection. The same text can carry different meaning under different questions; global deduplication should not remove a useful answer.

Only then build clean views for each task. Comment ranking uses visibility, valid likes, reply relationships, time, and risk features. Recommendations can use exposure-adjusted interactions, problem resolution, author replies, and content topics. Search indexes consume reviewed text, entities, dates, and provenance. AI search also needs a traceable link to the source comment and parent content so it can cite and withdraw the source. Edits, deletions, appeal reversals, and parent-content removal must emit change events that update indexes, caches, analytics, and training data under their respective policies. Offline features need a time window, snapshot version, and backfill strategy; their definitions should match those used online.

Downstream systems need to know who wrote the comment, in what context, whether it is currently visible, what it says, and how reliable its signals are. Preserving the original and its processing history makes it possible to find out whether a cleaning rule has harmed dialect, irony, minority views, or new forms of expression.

### 3.1 Cleaning should preserve detail needed for retrieval and verification

Preserving the original and context does not mean treating every raw comment as trusted knowledge. “It started overheating after three days,” “only on this OS version,” and “my experience was the opposite” may be awkwardly written, but can contain the conditions, time anchors, and counterexamples that retrieval and fact-checking need. Build separate retrieval views and structured fields for product or place, version, experience date, conditions, uncertainty, corrections, and reply target, while keeping a citation path to the original comment. Do not filter out verifiable details just because the prose is rough.

The original and its context also have retrieval value, which can make them an attack surface. A 2026 study of three open-source deep-research agents showed how user-generated content can be used for retrieval poisoning: pages retrieved frequently can carry manipulated text into an answer. The study examined three open-source agents and does not represent every commercial AI search product. [Deep-Research Agents Can Be Poisoned via User-Generated Content](https://arxiv.org/abs/2605.24245) Downstream systems should preserve provenance, moderation state, time, exposure, and interaction context; check corroboration and freshness; require multiple sources for high-impact answers; and keep sampling retrieval, citations, and withdrawal of deleted content.

### 3.2 Three uses of comments in models, three sets of eligibility rules

Comments enter “models” for at least three distinct purposes. Permissions and cleaning rules should not be conflated:

- **Online retrieval and AI search:** Retrieve only comments currently allowed to appear and in a valid state. Retain `comment_id`, original content, date, parent content or place, provenance, and moderation version. Answers must link back to the source comment; edits and deletions must withdraw indexes and caches. Retrieval is not the same as handing comments over to train a large language model.
- **On-site ranking, recommendation, and moderation models:** Use training samples authorized for the intended purpose. Record exposure, position, authorship method, moderation and abuse state, and subsequent behavior. A like, report, or “helpful” vote is a biased behavioral label and still needs sampling and review. Rejected, held, and unpublished comments should not enter positive ranking examples for public content, though they may be used for the corresponding risk-governance task under separate access controls.
- **General-purpose LLM training or fine-tuning:** This is a different data use. Public visibility does not automatically grant training permission. Check terms of service, user notice and choice, content rights, personal information, and the intended model use. Reddit’s Data API terms are one concrete example: API access does not automatically include AI or machine-learning training without explicit permission from the rights holder. Rights need to be checked by platform and source; one platform’s terms do not establish a universal rule. [Reddit Data API terms](https://redditinc.com/policies/data-api-terms)

Training sets should retain provenance and authorship-method labels, deduplicate, and filter personal information, unpublished content, and spam. When a comment is edited, deleted, or withdrawn, the system should be able to locate the relevant training snapshot, derived set, and evaluation set according to policy. Model-generated summaries, recommendation copy, and AI comments should be labeled as synthetic, not fed back as new “user facts.” A study observed loss of long-tail distributions when models were repeatedly trained on their own generated data in a particular setup. This does not make all synthetic data unusable; it does mean synthetic sources, sampling, and human-written corpora should be tracked and evaluated separately. [Study of model collapse from recursively using synthetic data](https://www.nature.com/articles/s41586-024-07566-y)

Store separate fields for each comment and derived annotation, such as `authorship_mode`, `experience_evidence`, `provenance_source`, `label_confidence`, `policy_version`, and `training_eligibility`. They answer different questions: a provenance label is not a moderation state; passing moderation does not establish factual accuracy; factual accuracy does not mean the user authorized general-purpose model training.

## 4. Online systems must handle popular comments and failures

Product rules eventually become read and write paths. Comment creation needs an idempotency key so a retry on a weak connection does not create duplicates. Likes need a unique relationship or versioned state so repeated requests do not double-count. Moderation and publication need explicit state transitions so a delayed event cannot make a deleted comment visible again. Counters may update asynchronously, but the comment body and current visibility need a clear source of truth. If an async projection briefly lags, the interface can show a counter that will reconcile later; it cannot miss a withdrawal or governance action.

The read path has its own constraints. Comments on popular content create hot keys. Writing every like back to one counter row can concentrate database writes; counters can instead be sharded or aggregated from events and merged asynchronously. Use stable sort keys and cursor pagination so changing ranking scores do not cause a user to see duplicates or skip a block of comments while paging. Cache keys should include sort mode, content version, and any necessary user state. Edits, deletions, blocks, moderation reversals, and expiration of author pins should invalidate affected caches. Search, recommendations, and comment lists rarely update at exactly the same moment, so define acceptable delays and failure recovery instead of assuming strong consistency across every system.

Operational governance also needs clear ownership. Safety and algorithm teams maintain automated moderation policies and models. First and secondary review need classification standards, escalation paths, and appeal rechecks. Community operations explains rules, communicates with creators, and runs community programs. Engineering ensures state propagation and audit trails. High-risk events should support temporary rate limits, comment closure, or a more conservative display policy, with a path to restore normal operation. If moderation is down, decide in advance by risk tier which low-risk comments can wait and which surfaces must block everything. Comment quality should not depend on one moderator or a one-off manual rescue.

## 5. From events to features, retrieval, and ranking

Build traceable features from canonical events before candidate retrieval, multi-objective prediction, and constrained re-ranking. After exposure, a user may click, read, save, comment, follow, hide, or report. These are labels for different tasks, not one “engagement score.” Adjust video views for length and autoplay; distinguish foreground reading from background tabs and quick bounces for articles. Longer time spent does not always mean satisfaction, especially when short content or a direct answer does the job.

### 5.1 Feature vectors should retain behavior source and context

Features can be grouped into user interests over short and long horizons (topics, authors, formats, time of day); content quality and semantics (topic vectors, entities, readability, freshness, source quality); interaction relationships (exposure, click, useful read, save, comment, follow, negative feedback); context (entry point, query, location, device, session stage); and governance signals (moderation state, report rate, suspicious interaction risk, author trust). Online features should be traceable to their computation time, window, and model version, with shared definitions between training and serving. A like rate without exposure is especially dangerous because the system does not know whether the user had a chance to see the content.

User features must distinguish **consumption interests** from **expression and contribution behavior**. A user commenting on a topic may be asking a question, correcting an error, disagreeing, answering for a friend, or creating content. A comment topic is not automatically a stable consumption preference. Model interactions in context: lightweight feedback, identity expression, help-seeking, correction, or discussion contribution. Treat these as intent hypotheses to validate, not labels inferred from a single like or save. Google research has modeled user interest in topics separately by behavior source, including posts, comments, and likes, to create a cleaner behavioral profile. [Factorizing user topic interests by behavior source](https://research.google/pubs/improving-user-topic-interest-profiles-by-behavior-factorization/)

A practical user model can keep several vectors or feature groups: recent consumption interests, long-term explicit preferences, search-session intent, comment participation role, creation topics, social relationships, and negative signals such as hide or “not interested.” Each feature needs its behavior source, exposure context, time window, confidence, and decay policy. “I asked a question under this comment” is highly relevant to the current content and task; it should not automatically become a global interest. Let users view, correct, or reset interest preferences, and avoid inferring unnecessary sensitive attributes from comment text. If the user model cannot explain where a feature came from, when it expires, and how to withdraw it, it is hard to use safely in recommendations, advertising, and personalized search. [Transparent, scrutable, and explainable user models for personalized recommendation](https://research.google/pubs/transparent-scrutable-and-explainable-user-models-for-personalized-recommendation/)

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-feature-serving.svg" target="_blank" rel="noopener" aria-label="View the full diagram: user, content, interaction, context, and governance features feed retrieval and multi-objective ranking; feeds, commerce, ads, search, and AI search use separate business objectives.">
    <img src="/images/writing/comment-101/comment-101-feature-serving.svg" alt="User, content, interaction, context, and governance features feed retrieval and multi-objective ranking, with separate business objectives for feeds, commerce, ads, search, and AI search." width="960" />
  </a>
  </div>
  <figcaption>Figure: How comment features serve recommendations and search. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

### 5.2 Retrieval and multi-objective ranking

A retrieval layer can generate candidates first: collaborative filtering finds similar users or content, content vectors find semantic matches, follow graphs and subscriptions add relationship-based content, and search retrieves against the query. A ranking layer predicts outcomes such as clicks, useful consumption, saves, satisfied comments, and follows, then applies constraints for diversity, freshness, safety, and frequency. A final score can be abstracted as a combination of multi-task predictions:

```text
score(user, item, context) =
  w_read · P(meaningful read) + w_save · P(save) + w_like · P(like)
  + w_comment · P(valuable comment) + w_follow · P(follow)
  - w_hide · P(hide) - w_report · P(report)
```

Weights are not constants shared across products. Set them from product goals, experiments, and constraints. Safety and compliance can be hard gates instead of negative weights that can be “offset.” Make exploration quotas and diversity re-ranking explicit parts of the policy too.

### 5.3 Usefulness, follows, and commercial signals

Xiaohongshu, a Chinese lifestyle and shopping platform, publicly describes its recommendation goal as helping users discover lifestyles and explore interests through personalized, high-quality content. Its public disclosures mention note content and user interactions, alongside deduplication, interleaving, and interest discovery. Its privacy disclosures list follows, views, clicks, searches, likes, saves, shares, and comments among recommendation-related behaviors. They publish neither an internal model called a “usefulness model” nor signal weights. “Usefulness platform” is a product interpretation of Xiaohongshu’s experience, search, and save scenarios, not a stated model objective.

To make “useful” an engineering objective, a save is only an intent signal. Also check whether the user later reopens the note, finds it through on-site search, completes an action discussed in the comments, or explicitly marks the question resolved. Record the exposure and time window associated with these behaviors. One save does not prove usefulness; repeated opens may mean the user still has not found an answer.

Follows have their own meaning. Following an author means the user wants to keep receiving that person’s content. It can raise priority in a following feed, add a relationship-based retrieval candidate, and become an interest feature. It cannot answer whether one note fits the current search. When someone is looking for a particular model, following the author should not outrank whether the content matches the model, use conditions, and question.

Communities built around useful information also carry advertising and commerce. Engineering and algorithms should preserve commercial provenance, placement, and objective, keeping paid exposure and organic interaction in separate ledgers. Otherwise, clicks bought through advertising can be mistaken for organic content quality and feed back into recommendations, search, or usefulness evaluation.

### 5.4 Search, recommendations, and business objectives

Search ranking and recommendation ranking can share user, content, and interaction features, but their task labels should remain distinct. Businesses can share a content-understanding foundation while optimizing separate goals:

- **Feed:** Retrieve using a mix of topic similarity, follow relationships, recent interactions, and exploration of new content. Rank for useful consumption, satisfying interaction, and negative feedback, then constrain diversity, freshness, and frequency.
- **E-commerce recommendations:** In addition to content consumption, model product clicks, detailed product-page reads, add-to-cart, saves, orders, and returns as separate stages. Clicks alone are not purchase intent, and ad conversion is not long-term customer satisfaction. Recommendations, store and product search, and advertising can share product entities and context features while keeping organic distribution separate from paid auctions.
- **Advertising:** Match the advertiser’s goal, user need, creative quality, budget, and frequency cap. Optimize contracted outcomes such as impressions, clicks, or conversion while respecting ad experience, relevance, and privacy choices. A commercial model’s conversion probability should not become an organic recommendation quality score.

Search is responsible first for satisfying the current query, not for re-serving what a user liked in the past. Query terms, rewrites, filters, and click or bounce behavior can add session intent. Content supplies titles and text, topic vectors, entities, places, brands or models, dates, author credibility, and answer evidence. Personalization can refine results that are already relevant, but should not override an explicit query with a follow relationship. Traditional search can rank by relevance, freshness, authority or experience fit, and behavioral feedback. Related-content recommendations can combine topic similarity, shared entities, co-consumption, and useful interaction, then apply time decay and diversity so results do not all come from one author or topic.

AI search adds another question: did the answer solve the task? Retrieval uses query intent and content vectors to find candidates. Re-ranking assesses relevance, freshness, source quality, complementary viewpoints, and citeable evidence. After generation, the product can observe follow-up questions, query rewrites, source opens, saves, corrections, or an explicit resolution signal. A long session may indicate deep exploration, or that the answer was unclear; time spent alone is not success. Comments, saves, and shares can add user language, experience detail, and entity relationships, but comments still need trust and moderation controls. An AI summary needs a source trail; a highly engaged reply is not automatically a fact.

AI search also has to handle conflicts, stale information, and manipulation among comments. A high like count shows recognition under a particular exposure pattern, not factual correctness. A popular old answer may no longer apply to a new version. Retrieval and generation should retain comment ID, parent content, publication date, edit version, moderation state, and quoted passage so the answer can be checked against the source. Conflicting experiences should be presented with their conditions and dates rather than compressed into one apparently uniform conclusion. Deletion, appeal reversals, and author updates need to trigger withdrawal or recomputation in vector indexes, caches, and generated summaries. In evaluation, check answer resolution, citation accuracy, source visibility, retrieval of stale answers, and whether the system corrects itself after a user report.

### 5.5 SEO, GEO, and crawl boundaries

SEO and GEO can share the engineering foundation for content discovery, but they measure different outcomes. SEO generally asks whether a page can be crawled and indexed and whether it earns relevant exposure in traditional search results. Generative Engine Optimization (GEO) asks whether content enters generative search retrieval candidates and whether the answer uses or cites it. GEO research has proposed visibility-optimization frameworks for generative engines, but retrieval and citation mechanisms vary by product; a result from one experiment is not a universal operating formula. [GEO: Generative Engine Optimization research](https://doi.org/10.1145/3637528.3671900)

For a comment system, comment volume is not itself a GEO signal. First-hand experience with a clear object and conditions can add useful evidence: which branch, product, or version the comment concerns; when it was experienced; what conditions applied; whether it is still public and governed; and whether a reader can trace it back to the source comment and parent content. A short review, templated praise, repeated greeting, or high-like sentence without context may not be citeable evidence. Do not prompt users to stuff keywords, manufacture a false consensus, or package like counts as factual authority so an AI summary will cite the page.

Engineering should make these comments discoverable where permitted. Render the body as readable text, keep stable links between the comment and its POI, product, or main content, and make authorship method, experience date, version, and moderation state available. Retrieval results should preserve `comment_id`, source page, and original passage; generated answers should link back and show the necessary context. Google’s current webmaster guidance for AI Overviews and AI Mode continues to rely on foundational SEO, crawlability, visible text, and useful content. It does not require a separate set of special structured data for AI features. Meeting technical requirements also does not guarantee crawling, indexing, or citation. [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features); [Google: Guidance for websites in generative AI search](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

Being crawlable does not mean every comment should be publicly searchable. Filter out unreviewed, hidden, deleted, login-only, or privacy-restricted comments according to their visibility. Edits, appeal reversals, POI merges, and product-version updates must refresh indexes, caches, and summary citations. Do not casually mark comments beneath an ordinary article as `DiscussionForumPosting`. Google uses that structured-data type for pages where discussion is the main content, such as forums and social sites; it does not recommend it for reader comments below an editorial article. Structured data must match the content users can actually see, and does not guarantee a rich result. [Google guidance on discussion-forum structured data](https://developers.google.com/search/docs/appearance/structured-data/discussion-forum)

UGC links and low-quality comments are also part of search-spam governance. Google recommends `rel="ugc"` for user-generated links, with `nofollow` where appropriate. Low-quality or spam content that remains indexable can affect a site’s search performance. For SEO, track crawling, indexing, long-tail exposure, and useful reads. For GEO, use a fixed query set and time window to observe whether source pages are retrieved, whether citations are accurate, whether answers retain conditions and dates, and whether withdrawn comments continue to appear. Outputs vary across engines; one mention does not prove an optimization worked. Also check source clicks, answer corrections, stale citations, and exposure of highly liked but incorrect content.

Back to the restaurant POI: the value of comments in external search depends on the context. Their value in on-site search and AI search is easier to validate because the product knows the place entity, moderation state, experience date, and subsequent user feedback. Whether the surface is SEO or GEO, the engineering goal is not to accumulate more comments. It is to make useful experience findable and verifiable, and to withdraw stale material when its state changes.

---

Series: **Comment Systems 101** | [Series guide](/en/writing/2026/10/comment-101/) · [Metrics and experiments](/en/writing/2026/10/comment-101-metrics/) · [Product forms and supply](/en/writing/2026/10/comment-101-product/) · [Ranking and governance](/en/writing/2026/10/comment-101-governance/) · [Data and algorithms](/en/writing/2026/10/comment-101-architecture/)
