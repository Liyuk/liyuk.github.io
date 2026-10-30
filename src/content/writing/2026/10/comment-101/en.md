---
title: "Comment Systems 101 (1): A Guide to the Series"
description: "A guide to five articles on comment systems, and how metrics, product design, governance, and technology fit together."
locale: en
translationStatus: reviewed
translationKey: 2026/10/comment-101
createdAt: 2026-10-29
publishedAt: 2026-10-29
draft: false
type: case-study
tags: [product, technology, algorithms, data, metrics, governance]
column: { slug: comment-systems-guide, order: 1 }
citationUrls: []
---
While revising the comment system on my blog, I found myself thinking about work I had done across publishing, video, communities, maps, e-commerce, and local services. A comment may look like a small interaction layer beneath a piece of content. In practice, it can serve at once as self-expression, discussion, a record of experience, decision support, and a source of data for downstream systems.

The series follows four questions: **What should a comment system measure? What should the product let people do? How should voices be ranked and governed? How should the resulting data enter engineering and algorithmic systems?** A restaurant review on a point-of-interest (POI) page runs through the series: one person records the wait and facilities when dining with a child; later, another searches for a place that is family-friendly and less crowded on a weekend. This first piece lays out the map. The next four cover metrics, product design, governance, and engineering and algorithms. Read them in order, or jump to the question you have.

<figure class="comment-diagram" style="--comment-diagram-width: 960px">
  <div class="comment-diagram-scroll">
  <a href="/images/writing/comment-101/comment-101-map.svg" target="_blank" rel="noopener" aria-label="View the full diagram: the five-part Comment Systems 101 reading path, from the overview through metrics, product design, governance, data models, and algorithms.">
    <img src="/images/writing/comment-101/comment-101-map.svg" alt="The five-part Comment Systems 101 reading path: an overview followed by metrics, product design, governance, data models, and algorithms." width="960" />
  </a>
  </div>
  <figcaption>Figure: Start with the whole system, then move through metrics, product design, governance, and engineering and algorithms. <span class="zoom-hint">(Click to enlarge)</span></figcaption>
</figure>

## A guide to the series

Comments are user expression, decision information, community conversation, and data for downstream systems. No single engagement score can capture all of that. This series starts with product outcomes, then looks at participation, visibility, and governance before reaching the data objects and algorithmic pipeline. Metrics define what the system is trying to achieve; product design determines what people can do; governance shapes which voices remain and how they are seen; engineering and algorithms carry those signals into search, recommendations, and commercial products.

### Reading order

1. **Comment Systems 101 (1): A Guide to the Series** lays out the system and shows how its four questions connect.
2. [Comment Systems 101 (2): Metrics, North Stars, and Experiments](/en/writing/2026/10/comment-101-metrics/) starts from the user task, defines a North Star, builds a metric tree, and tests whether experimental proxies hold up.
3. [Comment Systems 101 (3): Product Forms, Supply, and Community](/en/writing/2026/10/comment-101-product/) looks at the work comments do, how contributions continue, and how to design community, multilingual support, and product stages.
4. [Comment Systems 101 (4): Ranking, Moderation, and Governance](/en/writing/2026/10/comment-101-governance/) covers visibility, moderation, manipulation, permissions, appeals, corrections, and propagating deletions.
5. [Comment Systems 101 (5): Data Models, Cleaning, and Algorithmic Integration](/en/writing/2026/10/comment-101-architecture/) follows comments from event models through cleaning and indexing into recommendations, search, AI search, and SEO.

Read in order, or go straight to the subject you need: the second article is about metrics and experiments; the third about contribution and interaction design; the fourth about moderation, permissions, and abuse; and the fifth about storing comments and connecting them to search and recommendations. Public product disclosures can reveal features and stated goals, while research findings need to be read in light of their samples and methods. Neither provides a platform’s full internal ranking logic.
