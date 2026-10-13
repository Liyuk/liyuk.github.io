---
title: 给博客加 AI 问答：为什么我暂时没上向量检索
description: 给文章多、却不容易找的个人博客增加 AI 问答入口；记录我如何在免费额度下比较关键词检索、切段和向量方案，以及哪些结果还不足以支持升级。
createdAt: 2026-10-11
type: case-study
draft: true
translationStatus: original
tags: [ai, algorithms, reproducibility, static-site, technology]
citationUrls:
  - https://arxiv.org/abs/2005.11401
  - https://arxiv.org/abs/1706.03762
  - https://pagefind.app/docs/
  - https://pagefind.app/docs/ranking/
  - https://arxiv.org/abs/2104.08663
  - https://www.anthropic.com/engineering/contextual-retrieval
  - https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/
  - https://arxiv.org/abs/2309.15217
  - https://aclanthology.org/2024.naacl-long.20/
  - https://aclanthology.org/2025.acl-long.415/
  - https://www.microsoft.com/en-us/research/publication/synthetic-test-collections-for-retrieval-evaluation/
  - https://arxiv.org/abs/2508.11758
  - https://arxiv.org/abs/2601.14123
  - https://cormack.uwaterloo.ca/cormack/cormacksigir09-rrf.pdf
  - https://ai.google.dev/gemini-api/docs/embeddings
  - https://ai.google.dev/gemini-api/docs/pricing
  - https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf
  - https://metr.org/blog/2026-02-24-uplift-update/
  - https://developers.google.com/search/docs/appearance/ai-features
  - https://developers.cloudflare.com/vectorize/platform/pricing/
  - https://developers.cloudflare.com/vectorize/get-started/intro/
  - https://developers.cloudflare.com/workers/platform/pricing/
  - https://developers.openai.com/api/docs/guides/retrieval
  - https://help.openai.com/en/articles/8554407-memory-in-chatgpt
  - https://www.reddit.com/r/Blogging/comments/1dnkyo8/question_for_personal_blog_readers/
  - https://www.reddit.com/r/Blogging/comments/1ve8tyi/do_multitopic_blogs_work_or_is_focusing_on_one/
  - https://www.reddit.com/r/Blogging/comments/1c0cgfe/blog_3_months_old_zero_traffic/
  - https://www.reddit.com/r/Blogging/comments/1hri712/attention_bloggers_ask_your_questions_in_this/
  - https://www.reddit.com/r/Blogging/comments/gbdsgq/
  - https://www.reddit.com/r/ExperiencedDevs/comments/zgwrag/best_practices_for_knowledge_transfer_when_a/
  - https://www.reddit.com/r/ExperiencedDevs/comments/1e2dh98/best_ways_to_handle_knowledge_transfer_from/
  - https://www.reddit.com/r/ExperiencedDevs/comments/1gtonmx/whats_a_great_onboarding_experience_for_new/
  - https://www.reddit.com/r/ExperiencedDevs/comments/ggiuaf/
  - https://www.reddit.com/r/ExperiencedDevs/comments/nepmmt/
  - https://www.reddit.com/r/ExperiencedDevs/comments/1frd8eh/staff_engineers_how_much_decisionmaking_power/
  - https://www.reddit.com/r/ExperiencedDevs/comments/qfubfu/
  - https://www.reddit.com/r/ExperiencedDevs/comments/1p2eyqh/was_told_my_pr_comments_were_unclear/
  - https://www.reddit.com/r/ProductManagement/comments/1e73814/how_do_you_prioritize_feature_requests_when/
  - https://www.reddit.com/r/ExperiencedDevs/comments/1r4u0mo/by_what_real_metrics_has_ai_improved_software/
---


这个站点已经有不少内容了，但读者未必找得到。我有个朋友把站上的文章整理进 AI 工具里，之后可以直接和它聊这些内容。可每个访客都先做一遍整理，显然不现实；外部模型也不一定收录了整站。

我想让访客不用先知道文章标题，也能问“我该从哪篇开始看”或“这里有没有讲过团队知识交接”，回答里还能带上来源。刚开始试的时候，机器人把“有什么推荐吗”回成“本站没有足够信息”；我问站点访问量，它又找来一篇主题沾边的文章。一个问题没找到东西，另一个找到了不该用的东西。我这才意识到，得先看它把什么文章交给了模型。

接下来我先查它找到了什么，再看该不该让模型回答。向量检索也先放一放：我想先用已有的关键词索引跑一组对照，看看免费资源下能做到哪一步。

## 站内搜索先解决什么

这个博客的站内搜索由 Pagefind 提供。构建时，它读取生成后的静态页面并生成全文索引；读者输入词语后，系统返回一组排序过的页面链接。它适合“我记得大概写过这个，帮我找出来”，读者打开页面后自己读全文。Pagefind 的排序会参考词项、词频、页面长度和字段等信号。[Pagefind 索引说明](https://pagefind.app/docs/)、[排序说明](https://pagefind.app/docs/ranking/)

问答还要从页面里找出能回答问题的段落，再把问题、段落和来源交给模型组织成回答。搜索给出页面，读者自己判断；问答试着把证据连成解释。读者用词和文章差得太远时，两种检索都可能漏，问答还多了模型把相似内容说成答案的风险。

| 环节 | 负责什么 | 返回什么 |
| --- | --- | --- |
| Pagefind 搜索 | 从静态页面索引里按词项和排序信号找页面 | 页面链接 |
| 当前机器人的召回 | 用双字词、字段权重和 IDF 从文章段落索引里找候选 | 少量证据段落 |
| 向量召回 | 把问题和段落编码成向量，按相似度找候选 | 语义上可能接近的段落；不负责写答案 |
| RAG | 把检索器和生成模型接起来 | 基于检索证据组织、并附来源的回答 |

这个机器人已经是 RAG，目前靠词面检索找段落。Gemini 收到段落后会在模型内部处理文字，但这不会替网站生成一份可搜索的向量库。要做向量检索，还得用 embedding 接口分别处理文章段落和用户问题，再比较两边的向量。[Gemini embeddings 文档](https://ai.google.dev/gemini-api/docs/embeddings)

接入后，文章是在回答时供模型检索的资料，测试问题则用来检查它能不能找对资料。模型参数没有因此改变，每次请求也不用带上全站全文。答案需要的内容如果不在文章里，或者检索没把它找出来，模型就没有可靠依据。

## 测试集会被调参污染

RAG 这个名字听着像一套模型，放到这里其实就是两步：先从文章里找资料，再让模型根据资料回答。模型不会因为读了这些段落就被重新训练。Lewis 等人 2020 年的论文讨论了参数化语言模型如何和外部可检索知识结合。[RAG 论文](https://arxiv.org/abs/2005.11401)

我把它想成给模型一本开卷资料。文章是参考书，问题是考题。我后来发现，自己已经拿这批问题补过别名、调过权重、改过切段；它们现在更像练习题，不能再拿来证明系统通过了独立测试。

Slack 介绍过 AI Answers 怎样在回答时检索用户有权限访问的资料；Anthropic 则分享了上下文补全、BM25、向量召回和重排的组合实验。它们让我看到生产系统会把检索拆成更多环节，但语料和预算都跟个人博客不同，照搬不等于得到同样收益。[Slack 搜索实践](https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/) [Anthropic Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

## 为什么先做低成本的站点版本

我先没加向量库。文章数量和更新速度都还有限，先在构建时生成静态索引，在线由 Cloudflare Pages Function 找少量段落；找到的内容够用，再调用 Gemini。这样可以先把整条问答链路跑起来，也能逐步查清楚问题出在哪。

发布时，Astro 从已发布文章生成 Pagefind 页面索引和问答段落索引，随静态站点部署到 Cloudflare Pages。提问时，Pages Function 校验当前文章路径或检索全站段落；只有“这篇讲了什么”之类的问题会读取当前文章正文。检索证据达到门槛后才调用 Gemini，并返回来源链接。

```mermaid
flowchart TB
    subgraph Build["Build time"]
        Content["Published articles"] --> Git["Git repository"]
        Git --> CI["Build and verification"]
        CI --> Astro["Astro build"]
        Astro --> SearchIndex["Pagefind page index"]
        Astro --> ChatIndex["Chat passage index"]
        Astro --> Site["Static site assets"]
        SearchIndex --> Pages["Cloudflare Pages"]
        ChatIndex --> Pages
        Site --> Pages
    end

    subgraph Request["Reader request"]
        Reader["Reader"] --> Search["Site search"]
        Search --> SearchIndex
        SearchIndex --> Links["Page links"]
        Reader --> Chat["AI question entry"]
        Chat --> Function["Pages Function"]
        CurrentURL["Current article URL"] --> Function
        Function --> Scope{"Current-page intent?"}
        Scope -->|"Yes"| Context["Verified article context"]
        Scope -->|"No"| Retrieve["Lexical passage retrieval"]
        ChatIndex --> Retrieve
        Retrieve --> Evidence{"Enough evidence?"}
        Evidence -->|"No"| Fallback["Explain missing site evidence"]
        Evidence -->|"Yes"| Gemini["Gemini API"]
        Context --> Gemini
        Gemini --> Answer["Stream answer with sources"]
    end
```

这个版本只做了文章索引、段落召回和带来源回答。每次请求只把少量段落交给 Gemini，但词面检索仍会漏掉说法差异；文章里没有的内容，机器人也答不了。

## 当前实现和免费额度的取舍

现在的版本用静态倒排索引、双语标签和少量主题别名；当前页问题会读取已发布文章的正文，全站问题则按段落检索。索引只保留每篇文章最多 3 个代表性片段，构建产物合计约 795 段、5.2 MB。完整正文的离线实验有约 3,183 段、11.3 MB，但这份更大的索引不会部署。

向量方案看起来也装得下：按每段 768 维估算，3,183 段占约 244 万存储维度，低于 Cloudflare Vectorize Workers Free 的 500 万存储维度。限制在查询量：Cloudflare 把索引向量和查询向量都计入查询维度，所以每次查询约消耗 $(3183+1)\times768$，每月 3,000 万查询维度大约只够 12 次。若只存当前 795 段，每月理论上约 49 次。这个估算假设每个问题只查一次、每段 768 维，不含重试或额外查询；它是容量上限估算，不是实际用量预测。[Vectorize 定价和计算方式](https://developers.cloudflare.com/vectorize/platform/pricing/)

Gemini embedding 的免费额度并不能抵消 Vectorize 的查询上限；免费层提交给 Gemini 的内容还可能用于改进 Google 产品。因此当前先不把文章向量接到线上：这个站点的检索质量尚未用独立问题集验证，付出更多索引和维护复杂度之前，应该先证明它能稳定减少语义改写漏召回，同时不提高无答案误答率。[Gemini API 定价与数据使用说明](https://ai.google.dev/gemini-api/docs/pricing)

现在的门槛会过滤常见问句词，并要求候选文章的元数据或最佳段落与问题有一定词项重合；证据不足就不调用 Gemini。它挡不住所有误召回，但能把一部分明显弱匹配拦在模型调用前。

## 先把问题定位在检索，而不是模型

站点索引按中英文分开构建。正文先按段落边界切分，过长段落再按句子边界切；单句仍过长时才按字符切。每段带上文章标题和章节标题，默认上限是 1,200 个字符。当前实现没有 120 字重叠——我之前把估算向量存储时的实验假设和生产代码混在了一起，这里把它们分开。

检索时，连续汉字会拆成相邻双字词。“反馈回路”会变成“反馈”“馈回”“回路”。标题、简介、主题关键词和正文段落各自有权重；较少见的词按 IDF 加分，常见问句词先过滤。它跟 BM25 有相似的词频思想，但当前代码只看词项是否出现，没有做词频饱和或文档长度归一化。

这一套规则便宜、容易解释，也有明确短板。“反馈回路”出现在标题里会加分；“怎么让经验传下来”与“团队能力如何积累”意思接近，却可能没有多少字面重合。为避免几个零散词把文章顶上来，系统还要求候选至少匹配最多三个不同词项；证据不够时拒绝调用模型。这个门槛只能挡一部分弱匹配，不能证明剩下的内容一定能回答。

把打分写出来，能看清当前检索器到底做了什么。$q'$ 是过滤后的问题词项，$N$ 是该语言的文章数，$df(t)$ 是包含词项 $t$ 的文章数；$I$ 表示词项是否出现在字段中：

$$
\operatorname{IDF}(t)=\ln\left(1+\frac{N-df(t)+0.5}{df(t)+0.5}\right)
$$

$$
\begin{aligned}
\operatorname{Score}(d,q) = \sum_{t\in q'} \operatorname{IDF}(t)\Big(&5I_{title}(t,d)+2I_{description}(t,d)+2.5I_{keywords}(t,d)\\
&+\sum_{p\in passages(d)} I_{passage}(t,p)+\max_{p\in passages(d)} I_{passage}(t,p)\Big)
\end{aligned}
$$

向量检索会用另一种信号：问题向量 $q$ 与段落向量 $p$ 的余弦相似度。

$$
\operatorname{cosine}(q,p)=\frac{q\cdot p}{\|q\|\,\|p\|}
$$

向量相似度高，只能说明问题和段落编码后比较接近，不能说明段落里一定有答案。我还没生成过这批文章向量，也没测过它们的召回效果。

## 切段长度有影响，但没有一个通用答案

把整篇长文作为一个单元，结果可能太宽；切成较小段落，边界又可能把定义和例子拆开。段落前面附上章节标题，是为了让“它”或“这个做法”之类依赖上下文的文字有机会带上主题。Anthropic 的实验也讨论了片段脱离原章节后丢失背景的问题，并提出给片段补上下文，再结合 BM25、embedding 和 reranker。它报告的召回失败率变化来自 Anthropic 自己的多数据集设置，不能移植成我这个站点的预期收益。[Anthropic 的实验和边界](https://www.anthropic.com/engineering/contextual-retrieval)

我先做了一次“完整正文索引”的离线切段实验：从所有文章正文重新切段，在同一份中英文语料和同一批问题上比较 600、900、1,200 和 1,500 字符上限。每次都重建索引并重新跑检索；不计需要当前页面上下文的 5 个问题，比较 70 个预期能由站内内容回答的问题。结果是：

| 单段长度上限 | 段落数 | Hit@1 | Hit@3 | MRR | Recall@3 | nDCG@3 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 600 | 6,961 | 33/70 | 45/70（64.3%） | 0.552 | 0.614 | 0.553 |
| 900 | 4,478 | 33/70 | 45/70（64.3%） | 0.543 | 0.621 | 0.551 |
| 1,200 | 3,141 | 33/70 | 46/70（65.7%） | 0.548 | 0.629 | 0.553 |
| 1,500 | 2,451 | 34/70 | 47/70（67.1%） | 0.560 | 0.650 | 0.570 |

1,500 字在这组题里略好，Hit@3 比 600 字多命中 2 题。但这批题参与过检索调整，还不能说明独立问题也会得到同样结果。完整索引大小约 11.20–11.34 MB，只差约 1.2%；段落数差很多，压缩后的文件体积却差不多。生产索引最后还是用 1,200 字，每篇只留最多 3 个代表片段。这是为了控制部署体积和段落长度，不是因为实验已经证明 1,200 字最好。

Hit@1 / Hit@3 看至少一篇正确文章有没有排进第一名或前三名。MRR（Mean Reciprocal Rank，平均倒数排名）看最靠前的正确来源：第一名记 1，第二名记 1/2，第三名记 1/3，没进前三记 0。Recall@3 会把每题标注的所有合理来源都算进去；nDCG@3 则给排得更靠前的正确结果更高权重。不同指标给出的信号不完全一样：900 字的 Recall@3 略高于 600 字，MRR 和 nDCG@3 却略低。单看某一项很容易选错。当前 1,200 字主要是容量和可读性的折中，之后还可以再测。

这些指标的计算式如下。设 $Q$ 是可回答问题数，$r_i$ 是第 $i$ 题第一个正确来源的排名，$R_i$ 是这题所有合理来源，$TopK_i$ 是检索器前 $K$ 条结果：

$$
\operatorname{Hit@K}=\frac{1}{Q}\sum_{i=1}^{Q}\mathbb{1}(r_i\le K)
\qquad
\operatorname{MRR}=\frac{1}{Q}\sum_{i=1}^{Q}\frac{1}{r_i}
$$

没有正确来源时，$r_i$ 视为无穷大，对 Hit 和 MRR 的贡献都是 0。Recall@3 会把多篇合理来源一起算进去：

$$
\operatorname{Recall@3}=\frac{1}{Q}\sum_{i=1}^{Q}\frac{|R_i\cap Top3_i|}{|R_i|}
$$

nDCG@3 则给排在前面的正确结果更高分，再除以“正确结果全排在最前面”时的理想分数。当前相关性只有“合理来源 / 不是合理来源”两档，所以 $rel_{ij}$ 是第 $i$ 题第 $j$ 个结果的 0 或 1 标签：

$$
\operatorname{DCG@3}_i=\sum_{j=1}^{3}\frac{rel_{ij}}{\log_2(j+1)}
\qquad
\operatorname{nDCG@3}=\frac{1}{Q}\sum_{i=1}^{Q}\frac{\operatorname{DCG@3}_i}{\operatorname{IDCG@3}_i}
$$

70 道题里有 49 道命中前三，Hit@3 就是 70%。这个数字只描述这批题，不能当成真实读者的命中率。完整索引的段落数随切段长度明显变化，压缩后的 JSON 却都在 11.2–11.3 MB 左右；线上索引按语言分成两份，合计约 795 段、5.2 MB。文件有多大，最后还是要看实际构建产物。

我查到的切段研究也没有给出一个能直接套用到中文博客的字符数。一篇 2026 年预印本在 Natural Questions、特定稀疏检索器和生成模型下比较句子切分、语义切分、重叠与上下文预算；在那组设置里，句子和语义切分差距很小，重叠也没有稳定收益。换成中文博客，还是得重测。[切段策略系统比较预印本](https://arxiv.org/abs/2601.14123) BEIR 在多个检索数据集上发现，BM25 是很强的基线，稠密检索并不总能胜出；重排平均可能更好，但要多花计算。[BEIR 论文](https://arxiv.org/abs/2104.08663) 所以我没有把关键词检索从对照里拿掉。

## 我拿什么问题测召回

我先列了一批自己会问博客的问题，再去 Reddit 找不同的说法和场景。比如 [个人博客读者会关心什么](https://www.reddit.com/r/Blogging/comments/1dnkyo8/question_for_personal_blog_readers/)、[团队知识如何交接](https://www.reddit.com/r/ExperiencedDevs/comments/zgwrag/best_practices_for_knowledge_transfer_when_a/)和[需求优先级怎么排](https://www.reddit.com/r/ProductManagement/comments/1e73814/how_do_you_prioritize_feature_requests_when/)。我没有抓取帖子做统计，只是照着讨论改写问题。每道题都标了预期文章；有些问题在本站就没有答案。

我用这批题看每次改检索后，正确文章有没有更常出现在前三名。结果如下：

| 题集 | 可回答题 | Hit@3 | MRR | 无答案题误召回 |
| --- | ---: | ---: | ---: | ---: |
| 主问题集与挑战题 | 70 | 49/70（70.0%） | 0.605 | 6/10（60.0%） |
| Reddit 启发题 | 25 | 16/25（64.0%） | 0.533 | 5/6（83.3%） |

主问题集的 Recall@3 为 0.671、nDCG@3 为 0.607；Reddit 启发题分别是 0.300 和 0.330。知识交接只命中 1/3，技术判断命中 4/7。那 40 条社区式改写问题的 Hit@3 是 26/40（65%）。这几个数字能帮我找到薄弱题型，不能拿来预测读者会不会满意。

这批题被我用来改过别名、权重、拒答门槛和片段抽样，现在属于开发集。我没有另留一批题做独立验收。测试也只跑了本地检索，没有调用 Gemini；答案是否忠于文章、来源链接是否正确、读者是否满意，都还不知道。另有 5 道题需要当前页面上下文，也没做完整的回答质量评估。

自己编问题可以补上覆盖不到的问法，但也容易把自己的表达习惯当成读者习惯。我读的几篇评测研究也把检索和回答拆开看：RAGAS、ARES、UAEval4RAG 关注的维度并不一样，Hit@3 只告诉我正确文章有没有出现，不能代替忠实度或拒答质量。[合成检索评测集研究](https://www.microsoft.com/en-us/research/publication/synthetic-test-collections-for-retrieval-evaluation/) [Can we Evaluate RAGs with Synthetic Data?](https://arxiv.org/abs/2508.11758) [RAGAS](https://arxiv.org/abs/2309.15217) [ARES](https://aclanthology.org/2024.naacl-long.20/) [UAEval4RAG](https://aclanthology.org/2025.acl-long.415/)

在这组题上，词面检索会漏掉一部分社区式问法，无答案题也常把相近主题当成答案。下一轮我得留一批没参与调参的问题，并标出每题真正依赖的段落；否则分数再高，也很难判断是检索变好了，还是我把答案调进了题库。

## 哪些优化值得先试

低命中本身没告诉我该调哪里。我会先看文章有没有进前三、段落里有没有答案、Gemini 有没有照着证据回答，再决定改查询、切段还是拒答门槛：

```mermaid
flowchart TD
    Start["Inspect a failed question"] --> HasAnswer{"Answer exists in the site?"}
    HasAnswer -->|"No"| Abstain{"Did system abstain?"}
    Abstain -->|"Yes"| CorrectRefusal["Keep the refusal"]
    Abstain -->|"No"| Threshold["Tighten evidence gate or clarify intent"]
    HasAnswer -->|"Yes"| InTopK{"Expected article in top K?"}
    InTopK -->|"No"| Query["Check query terms and aliases"]
    Query --> QueryFix["Improve candidate recall"]
    InTopK -->|"Yes"| Evidence{"Retrieved passage contains answer evidence?"}
    Evidence -->|"No"| Chunk["Check chunk boundaries and passage selection"]
    Chunk --> ChunkFix["Improve evidence coverage"]
    Evidence -->|"Yes"| Answer{"Answer supported by passage?"}
    Answer -->|"No"| Prompt["Check context assembly and generation rules"]
    Answer -->|"Yes"| Good["Keep as supported result"]
```

下一轮我会先动标题权重、主题别名或段落边界，一次改一处。独立保留题仍然因为说法不同而漏召回，再做关键词和向量的混合对照。RRF 按排名合并两路结果，不用硬把尺度不同的分数相加。[RRF 原始论文](https://cormack.uwaterloo.ca/cormack/cormacksigir09-rrf.pdf) [Microsoft 混合搜索说明](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)

无答案题更麻烦：主问题集有 6/10 仍然召回文章，Reddit 启发题是 5/6。它们多半找到了主题相近的段落，却没有找到答案。个人偏好、本站访问量或站外平台现状都不在文章里；这种问题应该停下来说明资料不足，或者先追问。

## 离线索引和在线回答是两种工作

这类系统可以拆成两条时间线。离线阶段处理内容：筛出已发布文章、清理 Markdown、切段、补上标题和标签等元数据，再把它们变成检索索引。向量方案还要调用 embedding 模型，把每段文字转成向量并写入向量库。在线阶段处理问题：识别语言和当前页面范围，把问题转成检索信号，取回候选段落，判断证据是否够用，再把少量证据交给生成模型。前者回答“资料怎么准备和更新”，后者回答“这次问题应该查什么、模型能依据什么回答”。

在这个站点，离线工作发生在 GitHub Actions 的构建和部署流程里。Astro 分别读取已发布的中文、英文文章，生成两份静态问答索引；每篇文章会清理正文、按段落和句子切分，再保留最多三个代表片段，并把标题、简介、标签和专栏信息一起编码进词项倒排索引。构建还会为每篇已发布文章生成完整正文的静态上下文文件，供“这篇讲了什么”这类当前页问题使用。草稿不会进入生产索引，撤稿或删除也会在下一次构建后从生成文件里消失。站内 Pagefind 搜索另有自己的页面索引。

在线时，Cloudflare Pages Function 根据语言读取对应索引；“本文/这篇”问题先核对当前路径是否对应一篇已发布文章，再取它的完整上下文。其他问题走全站词面检索，最多挑四篇候选的最佳段落；证据门槛通过后才调用 Gemini，回答和来源以流式事件返回。当前路径校验、候选检索、证据门槛和生成是分开的步骤，任何一步都可能让答案失败，因此“模型回答错了”还不足以定位故障。

如果以后接入向量，离线任务就要额外为每个段落生成 embedding，并把向量、文章路径、语言和段落 ID 一起写入 Cloudflare Vectorize；发布流水线还需要受限的写入凭证。在线任务则先为问题生成查询向量，再从 Vectorize 取候选，必要时和现有词面结果合并。向量不会替代生成模型，也不会让新文章自动出现：新内容得先完成 embedding 和写库，撤稿时要删掉旧向量，模型或切段规则变更时还要重建或迁移索引。Anthropic 的检索实践展示了上下文补全、BM25、向量和重排的组合；Slack 的案例则提醒权限要在检索阶段落实。它们说明可选的工程环节，不代表这个小站都需要照搬。[Anthropic](https://www.anthropic.com/engineering/contextual-retrieval) [Slack](https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/)

## 发布新文章时要更新什么

新文章不需要我再手动跑一个索引命令。合并到主分支后，发布工作流会重新构建整站；Astro 从已发布文章生成新的中文、英文索引，再和页面一起部署。每次都是全量重建，不是只往旧索引里加新文章。现在文章量和更新频率都还好，重建整份索引更省事，也不会留下改过的旧段落或已撤稿文章。它只重新计算词项和倒排表，不调用 Gemini，也不需要向量数据库。

加向量后，文章和向量库得保持同步。每次发布都重算全站当然最直接，但没变的段落也会重复生成 embedding。可以给每个段落一个稳定 ID 和内容哈希，只更新新增或改过的段落；文章撤下时删掉对应向量。换 embedding 模型、维数或切段规则时，旧向量就不能和新向量混着查，需要重建一版再切换。这些步骤还要处理凭证、失败重试和删除同步。以现在的更新频率，增量更新做得到；只是我还没证明向量能解决足够多的漏召回，暂时不想先背上这些维护工作。

## 把文章交给 GPT，和把机器人放进站点

之前有个朋友把我的站点内容整理进自己的 AI 知识库，然后直接问它问题。我有时也说“把网站蒸馏了”，但不是在训练模型；朋友做的是把文章交给 AI 工具检索。愿意先花时间整理的人，用起来很方便，可以围绕整批文章问，也可以接着追问。文章更新了，他那边也得重新导入或同步。

站内机器人想解决的是另一件事：访客已经来到博客，但不知道该搜什么，也不会先把整站复制进自己的工具。他也许想知道我反复写过哪些问题、对一个决策有哪些不同看法，或者几篇文章能不能放在一起读。要是机器人只会推荐“相关内容”，这个入口就没多大意思；我更希望它能从站内文章里找到观点之间的联系，再把读者带回原文。个人 AI 知识库是读者把内容带走，站内入口则是内容平台自己帮人读。两种方式都能查文章，更新方式和读者开始使用的成本不一样。

我现在做出来的只是一个低成本入口，还不是能稳定归纳整站观点的机器人。每篇文章最多留下三个片段，在线最多检索四篇文章；如果重要观点没进索引，或相关的文章没被找出来，Gemini 就没法把它们放在一起讲。要比朋友自己导入知识库和站内机器人谁答得更好，得给它们同一批文章、同一组问题，再看答案有没有覆盖关键内容、引用对不对、内容更新是否及时，以及用起来要多几步。这个对照我还没做，所以现在只能说它们解决的是两种使用场景。[GPT Knowledge 说明](https://help.openai.com/en/articles/8554407-memory-in-chatgpt) [OpenAI Retrieval 文档](https://developers.openai.com/api/docs/guides/retrieval)

## 这次做项目时，AI 把什么变容易了

这次我让 AI 帮忙读代码、改检索器、跑切段对照，也让它整理可能的问法和失败案例。它能先把几篇文章里的线索放到一起；有人忘了自己写过什么时，问一句可能比自己翻更快。但前提还是索引找对了文章，段落也确实支持回答。

我一开始怀疑 Gemini 不够聪明。后来把链路拆开，才看到正确文章有时连前三都没进。还有一件事更麻烦：我原本拿来验收的问题，已经被我用来改别名、权重和拒答门槛。现在分数变高了，也不说明换一批问题还会更好。

做下来我更确定一件事：AI 会写代码，不代表它知道什么算答对。它得从代码、项目规则和架构记录里补背景；即使背景都有，也可能只顾着修眼前的测试，没发现测试根本没覆盖目标。目标定错了，它一样能很快做完。题目怎么选、什么算命中、误答能不能接受、要不要为提升多花资源，最后还是得我判断。

METR 2025 年的一项随机对照研究里，16 位有经验的开源开发者在熟悉项目中完成 246 个任务，使用当时的 AI 工具后平均耗时增加 19%。这不能外推成“AI 编程普遍变慢”；METR 对后续实验也说明，选择效应让速度收益难以可靠估计。[METR 2025 研究](https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf) [METR 2026 方法更新](https://metr.org/blog/2026-02-24-uplift-update/)

我没有把问题收集、标注、调参和验收都自动化。Reddit 帖子只是让我想到一些问法，不是用户研究；每道题该对应哪篇文章，也得我自己核对。项目说明和架构记录让 AI 看得到一些原本只在我脑子里的背景，但它们不能替我决定什么算成功，或这点提升值不值得花钱。

## 人和 AI 读者分别能从文章里拿走什么

如果你也在给内容加问答入口，可以先问自己：读者是想找一篇页面，还是想听几篇文章放在一起怎么说？接着再看召回有没有把证据找来，模型有没有超出证据回答。最后再决定要不要加向量。我的做法不一定适合内容量更大、问题更开放的平台。

我也希望这篇文章能被外部 AI 搜索找到，所以保留了清楚的章节、公式和来源链接。Google 的说明是，AI 搜索仍依赖可抓取、可索引的页面；写成这样不等于一定会被引用。[Google Search Central](https://developers.google.com/search/docs/appearance/ai-features)

站内入口已经能读当前文章、检索全站文章、给回答附来源，索引也会随发布更新。但目前的召回和拒答还不稳，我也没测过向量能不能改善它。入口接上了。至于访客是否真的少翻几篇文章，我还没有证据；得等独立测试和真实使用再判断。
