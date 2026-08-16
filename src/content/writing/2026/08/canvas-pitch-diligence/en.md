---
title: "Three Lenses on One Project: Canvas, Pitch, Due Diligence"
description: "A note on a distinction: the business model canvas is 'made for yourself,' the startup pitch is 'told to others,' and investor due diligence is 'others scrutinizing you'; the three differ completely in purpose, focus, and framing — don't mix them up."
locale: en
translationStatus: draft
createdAt: 2026-08-15
publishedAt: 2026-08-15
type: note
draft: false
tags: [strategy, product-thinking, decision-making, learning]
translationKey: 2026/08/canvas-pitch-diligence
---

"Looking at a project" is actually three perspectives with completely different purposes, and they are easy to mix up. Note this down: **the business model canvas is "made for yourself," the startup pitch is "told to others," and investor due diligence is "others scrutinizing you."** The first leans toward "how to make it work," the last leans toward "whether it's worth investing," and the pitch in between is an act of expression that packages "make it work" into "worth investing."

## First, the big picture: three lenses, not an assembly line

| Business model canvas | Startup pitch | Investor due diligence |
|---|---|---|
| Made for yourself | Told to others | Others scrutinize you |
| Self-consistency | Persuasion | Verification |
| "Does this business hold up?" | "Why is it worth investing?" | "Is it worth it, and how much?" |

These three are lenses with different purposes — **partly overlapping, partly independent** — not a sequential assembly line (see Section 6).

## 1. Business model canvas: made for yourself

The nine boxes, and the "four on each side with one in the middle" layout — see [Business model canvas: nine boxes](/writing/2026/08/business-model-canvas/).

- Purpose: draw the business logic clearly and check whether any box is empty or any two boxes contradict each other;
- Perspective: **structural self-consistency** (the nine boxes explain each other), but it cannot verify "empirical truth" — whether customers really have this pain and really will pay must be tested by the market;
- Trait: a snapshot that answers "does this business hold up?" — not "how big is the market, are the people reliable, how much is it worth."

## 2. Startup pitch: told to others

Facing investors, in a few minutes you turn "why now, why us, why worth investing" into a story with rhythm. The typical structure is a ten-step pipeline:

```
问题 → 方案 → 市场 → 为什么现在 → 产品 → 商业模式 → 竞争 → 团队 → 牵引力 → 融资请求
```

```mermaid
flowchart LR
    A["Problem"] --> B["Solution"] --> C["Market"] --> D["Why now"] --> E["Product"] --> F["Business model"] --> G["Competition"] --> H["Team"] --> I["Traction"] --> J["Funding ask"]
```

1. **Problem** — what real pain do users have
2. **Solution** — how you solve it
3. **Market** — how big the space is (TAM / SAM / SOM)
4. **Why now** — why the timing is right
5. **Product** — demo / what it looks like
6. **Business model** — how you make money (← the canvas appears on this page as the working draft)
7. **Competition** — who the rivals are, why you're different
8. **Team** — why you are the right people
9. **Traction / data** — validation you already have (revenue, users, growth)
10. **Funding ask** — how much, how you'll spend it, what milestone you'll hit

Key point: the pitch is **expression**, not documentation; the point is persuasion and rhythm. The business model canvas is only the working draft for that one "business model" page, not the whole thing. (These ten pages are a blend of Sequoia's recommended structure and Guy Kawasaki's "10/20/30"; there is no single industry standard.)

## 3. Investor due diligence: others scrutinizing you

It judges "whether it's worth investing, and at what price." Due diligence is done **at every stage**; only the emphasis shifts by stage (financials carry the most weight at maturity; see Section 7). The key things to check:

- **People / team**
- **Industry / track**: market size, growth rate, competitive landscape, policy, position in the cycle
- **Business model**: unit economics, moat, gross-margin sustainability — it is the underlying structure behind the numbers (growth, profit, barriers), not a co-equal minor item
- **Scale and growth**: revenue size, growth rate, market share
- **Profit and cash flow**: gross / net profit, EBITDA, operating cash flow
- **Assets**: balance-sheet quality, asset-heavy vs asset-light, debt and contingent liabilities
- **Barriers / moat**: technology, brand, network effects, licenses, switching costs
- **Legal / tax / compliance**: legal affairs, intellectual property, litigation (mature PE often separates legal DD and tax DD)
- **Valuation and exit**: at what price to buy, how to exit, what return multiple

The essence of due diligence is not "fraud-hunting" but **independently verifying the quality of the promises and re-pricing** — fraud is the rare exception; most due diligence conclusions are "no fraud, but it's not worth that price."

## 4. Examples: Luckin Coffee (negative) + Meituan (positive)

Running through Luckin Coffee and Meituan once each shows most directly that the three tools ask completely different things.

### 4.1 Luckin · Canvas: fillable, but unit economics in doubt

| Box | Luckin |
|---|---|
| Customer segments | value-conscious white-collar workers and young people |
| Value proposition | affordable freshly ground coffee, good and cheap, order-on-app quick pickup / delivery |
| Channels | self-operated + franchise stores, App / mini-program, delivery platforms |
| Customer relationships | App membership, coupons, private-domain referral, repeat purchase |
| Revenue streams | freshly made beverages (coffee + tea), light food, franchising |
| Key resources | store network, supply chain (self-built roasting), brand, App data |
| Key activities | store opening, supply chain and products, App operations, marketing and customer acquisition |
| Key partners | suppliers, franchisees, delivery platforms |
| Cost structure | store rent / labor, raw materials, marketing subsidies, fulfillment |

All nine boxes can be filled in, but the one box "can revenue streams cover the cost structure" (unit economics) is actually **in doubt** — low price + subsidies + small-store quick pickup means low revenue and not-low cost. On the canvas this only counts as "fillable," not "passed."

### 4.2 Luckin · Pitch: it tells a coherent story

1. **Problem**: China's per-capita coffee consumption is far below Europe and the US; freshly ground coffee is expensive and inconvenient to buy
2. **Solution**: affordable freshly ground coffee + small-store quick pickup + App omnichannel
3. **Market**: huge room for rising coffee penetration
4. **Why now**: consumption upgrade + mature mobile-payment / delivery infrastructure
5. **Product**: standardized App ordering, quick-pickup stores
6. **Business model**: low-rent small stores + data-driven site selection + scale purchasing to cut costs
7. **Competition**: positioned away from Starbucks, going for "high value-for-money + convenience"
8. **Team**: the UCAR (Shenzhou) camp, with expansion and execution experience
9. **Traction**: store count and transacting users growing fast
10. **Funding ask**: continuous fundraising to fund store openings and subsidies, targeting store scale

This narrative has complete rhythm and a seductive growth story — on the pitch, it **tells a coherent story**.

### 4.3 Luckin · Due diligence: it fell at the financials gate

What investors check is the evidence behind those "stories" above:

- **Revenue authenticity**: do orders, transaction flows, tax records, and invoices reconcile with system data
- **Store-level economics**: daily sales, average order value, sales per square meter — is it really profitable or just propped up by subsidies
- **Supply chain and costs**: is procurement real, are there related-party transactions
- **Cash flow**: burn rate, cash balance, dependence on financing
- **Governance**: ownership structure (the UCAR camp), related-party transactions, audit opinion

First get one thing straight: the fraud was not uncovered by "investor due diligence" but by **a Muddy Waters short-seller report + the company's own admission** — in January 2020 Muddy Waters published a short-seller report, and in April Luckin admitted it had **inflated about RMB 2.2 billion in transaction volume** for Q2–Q4 2019, then delisted from Nasdaq. The point of due diligence is not "can it catch fraud" (fraud is the rare exception), but **independently verifying the quality of the promises and re-pricing** — most due diligence conclusions are "no fraud, but it's not worth that price."

**The core lesson here**: Luckin's canvas and pitch both made sense; what really collapsed was that "the quality of the promises" couldn't withstand independent verification. (Note: Luckin later restructured, and its stores and performance have recovered, but that doesn't change the lesson.)

### 4.4 Meituan: positive, but not a "clean" sample either

Apply the same three lenses to Meituan and the outcome is different:

- **Canvas**: a multi-sided platform (consumers × merchants × riders); for the nine boxes see "Business model archetypes and examples" in [Business model canvas: nine boxes](/writing/2026/08/business-model-canvas/).
- **Pitch**: a growth story of "high-frequency food delivery builds the user base, low-frequency high-margin in-store / hotel-travel monetizes."
- **Due diligence**: the key checks are rider fulfillment costs, per-order economics, merchant commission rates, and the competitive landscape — these **hold up under scrutiny**, so it passed. But Meituan isn't a "clean" sample either: the 2021 "either-or" (exclusivity) antitrust penalty, disputes over rider employment and social-security compliance, and long-running losses plus huge losses in new businesses are all red flags on the DD checklist under "compliance, cash flow, earnings sustainability."

Don't write the comparison as "the only difference is whether the financials are real" — more accurately: **both companies' canvases and pitches made sense; the real distinction is whether due diligence could independently verify "the quality of the promises"** (Luckin fell on revenue fraud; Meituan stands because its key data hold up under scrutiny; but most failed projects didn't commit fraud — they just overestimated unit economics and the moat).

## 5. Differences among the three lenses

| | Business model canvas | Startup pitch | Investor due diligence |
|---|---|---|---|
| **Purpose** | explain how the business works | persuade "why it's worth investing" | verify "whether it's worth investing, and how much" |
| **Who is looking** | the founder themself | founder → investors | investors → the project |
| **Core focus** | 9-box self-consistency | problem→solution→market→…→funding ask (ten pages) | people, industry, financials, assets, valuation, exit |
| **Where the canvas sits** | everything | one page (working draft) | as the underlying structure running through the rest |
| **Framing** | facts / assumptions | promises + highlights | independent verification + re-pricing |
| **Sense of time** | snapshot | now + future | history + now + future |

## 6. How the three relate: partly overlapping, not nested

The three are neither "one assembly line" nor a nesting-doll "canvas ⊂ pitch ⊂ due diligence" — due diligence doesn't contain the pitch or the canvas (legal affairs, tax, corporate history, and supplier interviews never appear in a pitch), and the canvas isn't a prerequisite step for the pitch (many successful fundraises had no canvas at all). A more accurate way to put it: **three lenses with different purposes, partly overlapping and partly independent**:

- The canvas is one of the working drafts behind the "business model" page of the pitch;
- Both the canvas and the pitch are **one input** to due diligence, but due diligence's scope is broader than either and doesn't depend on them;
- Toward the due-diligence end, the business model doesn't become unimportant — it **changes form**: early on you judge by "story + team," later by "verified unit economics + moat"; financials are the result of the business model, not a substitute for it.

## 7. What investors focus on shifts by stage

| Stage | What they mainly look at |
|---|---|
| Early-stage VC | **people** > industry > product/model (profit and assets barely exist yet) |
| Growth stage | growth + unit economics + whether the model can be replicated |
| Mature / PE | **scale, profit, cash flow, assets** + valuation (financials carry the most weight) |

Note: this table doesn't mean "the business model matters less as you go later" — quite the opposite; "unit economics" and "whether the model can be replicated" are themselves the business model. More accurately: **at each stage you use different forms of evidence to look at the same thing — whether the business can keep making money.**

## Wrapping up

From "business model canvas" to "what investors focus on," the gap isn't just the amount of information — the **purpose changes**: from "make it work" to "persuade" to "verify." The canvas answers "does this business hold up?," the pitch answers "why is it worth investing?," and due diligence answers "is it actually worth it, and how much?" Three lenses — don't mix them up.
