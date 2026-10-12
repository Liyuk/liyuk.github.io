---
title: 从站内搜索到 RAG：给博客问答机器人做一次检索实验
description: 从站内搜索和问答机器人的差异出发，记录 RAG、中文关键词检索、切段、embedding 和 benchmark 的实验过程，并对照论文与公司的实践理解哪些方法值得继续试。
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

我最早看到的一个问题是，机器人把“有什么推荐吗”和“你能聊什么”都回成了同一句“本站没有足够信息”。它不是单纯回答得不好，前面的检索也没有理解这种宽泛问法。后来我把测试题扩成了几种社区里常见的提问方式：“研发团队一直等 CI，瓶颈是不是反馈太慢？”“工程师应该参与产品决策吗？”“怎么让经验在团队里传下来？”有时正确文章能进前三，有时却被只碰巧共享了几个词的文章挤掉；问上个月的访问量，检索又照样给出站内链接。

我最初也想过，是不是 Gemini 不够聪明。但后来觉得这问题问错了。模型只看得到检索阶段交给它的文章片段。材料没找对，模型越会组织语言，错误答案反而越像真的。于是我开始把问答拆开测：先测文章和段落有没有被找对，再看模型能不能依据这些段落回答。这是我想通过这个项目弄明白的事：内容召回究竟在做什么，又该怎么知道它有没有变好。

## RAG 接入的是资料，不是训练集

RAG 是 Retrieval-Augmented Generation，通常译作“检索增强生成”。每次收到问题，系统先从文章索引中找出几段，再把问题、段落和来源一起交给模型。模型依据这次提供的资料回答。RAG 的经典论文把它描述成语言模型与外部可检索知识结合；这份知识在推理时被取出，不等于重新训练模型。[Lewis 等人的 RAG 论文](https://arxiv.org/abs/2005.11401)

我觉得可以把它想成考场上给模型一本开卷资料。文章库像参考书，问题集像考题。考题用来检查模型和检索器会不会，不应该混进参考书里；反复拿同一批考题调权重、补同义词、改切段之后，它们更像练习题，不能再当作完全独立的最终考试。

```text
读者的问题
    ↓
检索器从文章索引找候选段落
    ↓
把问题、段落和来源交给大模型
    ↓
模型生成回答，界面展示文章链接
```

所以“把一套数据集接入大模型”只能算一个粗略类比。准确说，文章是运行时查询的外部知识库；测试问题及其正确来源是评测数据；模型参数没有因为这次接入而改变。RAG 可以让模型在回答时拿到站点的文章和观点，但它不会保证模型一定理解正确，也不会普遍修好计算、逻辑或多步推理问题。它能做的前提是：答案所需的证据存在于内容中，并且检索确实把证据交给了模型。

这不是只有个人项目才会这样做。Slack 的工程团队介绍过，他们在 AI Answers 和企业搜索中使用 RAG，让模型在请求时读取用户有权限访问的内容，而不是用客户消息训练模型。[Slack 的企业搜索实践](https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/) Anthropic 则公开了他们在检索系统中组合上下文、BM25、向量检索和重排的实验。他们报告，在自己的多数据集评估中，给片段补上下文并结合 BM25 后，top-20 检索失败率从 5.7% 降到 2.9%；再加 reranker 后降到 1.9%。这是 Anthropic 的实验结果，语料、模型和候选数量都不同，不能当成我的博客会得到的提升。[Anthropic 的 Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)

## 站内搜索、RAG 和向量检索，分别在哪一层

我后来又卡在“向量化”这个词上。站内搜索、机器人召回和 Gemini 都会处理文字，听起来像一套东西，实际各在不同层。先看这个站点现在的实现：

| 功能 | 做什么 | 返回什么 |
| --- | --- | --- |
| 站内搜索 | Pagefind 在静态站点构建后，从生成的页面制作全文索引；读者输入词语后，按词频、页面长度、标题和元数据权重等因素排序 | 一组相关页面，供读者自己打开和阅读 |
| 机器人当前的召回 | 读取单独构建的文章段落索引，用双字词、字段权重和 IDF 等词面信号给文章和段落打分 | 少量候选文章段落，交给生成模型作答 |
| 向量召回 | embedding 模型把文章段落和问题编码成向量，再按向量相似度找候选段落 | 少量语义相近的文章段落；它本身不写回答 |
| RAG | 把一个检索器和生成模型连起来：检索器提供证据，生成模型依据证据组织回答 | 一段带文章来源的自然语言回答 |

Pagefind 是给读者使用的站内全文搜索；机器人有自己的召回流程，因为它需要把具体段落作为上下文发给 Gemini。当前机器人已经属于 RAG：它用的是词面检索器。把检索器换成向量检索，或把两种检索结果合并，才是后续可以比较的实现方案。[Pagefind 的索引说明](https://pagefind.app/docs/)、[排序说明](https://pagefind.app/docs/ranking/)

这里的 embedding 也要和大模型内部处理文字时形成的表示分开。Gemini 收到问题和段落后，会在模型内部把输入转换成适合计算的表示，再生成回答；这些内部表示不会自动成为一个可供网站搜索的文章向量库。显式的 embedding 接口会为每篇文章段落生成可保存、可比较的向量，用户提问时也要生成查询向量，再由检索系统计算相似度。之后，系统仍要把检索到的原文段落交给 Gemini 的生成接口。换句话说，**向量检索负责找材料，生成模型负责根据材料写回答；RAG 描述的是两者如何配合。** Gemini 的 embedding 文档也把嵌入和生成回答作为不同任务说明。[Gemini embeddings 文档](https://ai.google.dev/gemini-api/docs/embeddings) Transformer 论文讨论的是模型处理序列时的表示与注意力机制，可帮助理解模型内部处理，但它不意味着每个使用模型的应用都自动建好了外部向量索引。[Transformer 论文](https://arxiv.org/abs/1706.03762)

如果这个站点以后加入向量召回，流程会多出一个明确的索引步骤：

```text
建索引时：文章段落 → embedding 接口 → 保存段落向量
提问时：读者问题 → embedding 接口 → 查询向量
         查询向量 → 相似度排序 → 相关原文段落 → Gemini 生成回答
```

这是备选方案的流程，不是当前线上实现。现在的 Pagefind 搜索和机器人段落召回都没有调用 Gemini embedding，也没有保存文章向量。理解这条边界后，“从站内搜索到 RAG”就不是把搜索框接上 Gemini：需要先确定搜索要返回页面还是证据段落，再决定用词面、向量还是混合检索找到证据，最后才由生成模型组织答案。

## 先把问题定位在检索，而不是模型

站点索引按中英文分别构建。当前实现清理 Markdown，保留文章标题和简介，并为正文段落附上所在章节标题。它会按段落边界拼接内容；太长的段落再按句子边界切分，单句过长时才按字符切开。默认上限是 1,200 个字符。当前实现没有做 120 字重叠；我之前用重叠估算向量存储量时，把实验假设和实际代码混到了一起，这里需要分开说。

问句和标题、简介、段落都会转成词项。英文和数字按连续字符串处理，连续汉字则拆成相邻双字词。比如“反馈回路”会产生“反馈”“馈回”“回路”。检索时，标题命中的权重是 5，简介是 2，主题关键词是 2.5，段落是 1；词项还会根据它在多少篇文章中出现计算逆文档频率，因此少见词的贡献更高。主题关键词来自已有的双语标签和专栏说明，也可以为少数主题补充读者常用说法。问句里的常见虚词和问句模板会先过滤，避免“怎么样”“有没有”这类词把无关文章抬上来。排序不是完整的 BM25：当前实现没有按词在同一段中的出现频次做完整 BM25 计算，而是基于词是否出现、字段权重和 IDF 加分，再用得分最高的段落作为全站检索片段。

检索器还会检查候选文章和问题之间是否有足够多的不同词项重合，最多要求 3 个；问题经过过滤后只剩一两个词时，门槛会相应降低。达不到时就按“站内没有找到足够资料”处理，不调用 Gemini。这个门槛不是对答案正确性的判断，只是挡住明显较弱的词面匹配。中文按双字词拆分，所以这里的“3 个词项”不等于三个完整中文词。

这样的算法容易解释。文章标题里有“反馈回路”，它就会得到明显的分数。它也容易漏掉意思相近但措辞不同的问题。读者问“怎么让经验传下来”，原文说的是“团队能力如何积累”，字面词项重合可能很少。中文双字词能保留一些词组线索，却不知道两个不同说法是不是一个意思；而像“效率”这种常见词，命中本身也不足以证明文章能回答问题。

这里向量检索可能有帮助：embedding 把文本编码成数字向量，语义接近的问句和段落可能在向量空间里靠近。但它也可能把主题相似、实际答案不同的内容排到一起。向量分数不是正确性分数。更重要的是，**目前这次本地检索实验没有生成 embedding，也没有测试向量检索**，因此不能拿现有结果宣称“向量比关键词好”。

## 切段长度有影响，但没有一个通用答案

把整篇长文作为一个单元，结果可能太宽；切成较小段落，边界又可能把定义和例子拆开。段落前面附上章节标题，是为了让“它”或“这个做法”之类依赖上下文的文字有机会带上主题。Anthropic 的实验也讨论了片段脱离原章节后丢失背景的问题，并提出给片段补上下文，再结合 BM25、embedding 和 reranker。它报告的召回失败率变化来自 Anthropic 自己的多数据集设置，不能移植成我这个站点的预期收益。[Anthropic 的实验和边界](https://www.anthropic.com/engineering/contextual-retrieval)

我先做了一次“完整正文索引”的离线切段实验：从所有文章正文重新切段，在同一份中英文语料和同一批问题上比较 600、900、1,200 和 1,500 字符上限。每次都重建索引并重新跑检索；不计需要当前页面上下文的 5 个问题，比较 70 个预期能由站内内容回答的问题。结果是：

| 单段长度上限 | 段落数 | Hit@1 | Hit@3 | MRR | Recall@3 | nDCG@3 |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 600 | 6,961 | 33/70 | 45/70（64.3%） | 0.552 | 0.614 | 0.553 |
| 900 | 4,478 | 33/70 | 45/70（64.3%） | 0.543 | 0.621 | 0.551 |
| 1,200 | 3,141 | 33/70 | 46/70（65.7%） | 0.548 | 0.629 | 0.553 |
| 1,500 | 2,451 | 34/70 | 47/70（67.1%） | 0.560 | 0.650 | 0.570 |

1,500 字在这组题里数值略好，Hit@3 比 600 字多命中 2 题；这仍不足以说明它在独立问题集上会更好。完整索引大小约 11.20–11.34 MB，变化约 1.2%；段落数变化明显，压缩后的索引体积变化很小。因此当前生产索引采用 1,200 字作为可读性和片段长度的折中，并且只保留每篇文章最多 3 个代表性片段。这个生产取舍是容量优化，不是实验已经证明 1,200 字检索效果最好。

Hit@1 / Hit@3 看至少一篇正确文章是否出现在第一名或前三名。MRR（Mean Reciprocal Rank，平均倒数排名）只看排名最靠前的正确来源：第一名贡献 1，第二名贡献 1/2，第三名贡献 1/3，没进前三则贡献 0。Recall@3 会把每题标注的全部合理来源都纳入分母；nDCG@3 则把靠前的正确来源权重放得更高。四种切段长度的 Hit@3 完全相同；1,500 字在 Hit@1 上只多命中一题，MRR 也只是略高。这里看不出一个压倒性的最佳值。当前 1,200 字主要是容量和可读性的折中，之后仍可按评测结果调整。

每种设置的段落数差异很大，但完整索引 JSON 的体积差异小得多，约在 11.2–11.3 MB。倒排索引压缩了词项到文章、段落的映射，所以“段落数量翻倍”不等于“文件大小也翻倍”。这组完整索引 sweep 是用于理解切段影响的实验；它不等于当前部署文件。当前部署会按语言分成两个索引，并在构建时每篇文章最多保留 3 个代表性片段，合计约 795 段、5.2 MB。估算资源占用时应直接测构建产物，不要只拿“向量维数 × 段落数”替代整个索引成本。

有关切段的研究支持“要实测”，不支持“某个固定字符数对所有语料都最好”。一篇 2026 年的预印本在 Natural Questions 和特定稀疏检索器、生成模型下比较了句子切分、语义切分、重叠和上下文预算；它的设置里，句子切分和语义切分差距很小，重叠也没有测出稳定收益。作者同时说明结果来自特定英文语料和模型组合，换到中文博客仍需重测。[切段策略系统比较预印本](https://arxiv.org/abs/2601.14123) BEIR 在多个检索数据集上发现，BM25 是很强的稳健基线，稠密检索并不总能胜出；重排等方法平均可能更好，但需要更多计算。[BEIR 论文](https://arxiv.org/abs/2104.08663) 这也是我保留关键词方案作对照的原因：向量看起来更懂语义，不代表它在每个站点、每种问题上都更准。

完整正文索引包含 147 篇中文和 147 篇英文文章、约 3,183 个段落。按每段一个 768 维向量计算，存储约 244 万维，低于 Vectorize Workers Free 标出的每月 500 万存储维度。查询预算更紧：Cloudflare 的计算方式还会把索引中的向量数算进去，所以每次查询约消耗（3,183 个已存向量 + 1 个查询向量）× 768，也就是约 244.5 万查询维度；每月 3,000 万维大约只够 12 次这样的查询。若只把当前压缩索引的 795 段做向量，每次约 61 万查询维度，理论上约 49 次/月，但这会丢掉更多段落，不能先假定召回质量一样。这个估算按每个用户问题只发起一次向量查询，不含其他索引、重试或更新；免费额度也需要在账户里监控。Gemini Embedding 2 的文本输入当前列为免费，但免费层数据可能用于改进 Google 产品。[Gemini API 定价](https://ai.google.dev/gemini-api/docs/pricing) [Vectorize 定价与查询维度公式](https://developers.cloudflare.com/vectorize/platform/pricing/)

## Benchmark 怎么做才不只是自我感觉

目前基础问题集有 85 条：最初写了 50 条，其中 40 条站内可回答、5 条需要当前页面上下文、5 条站外问题；后来又加了 35 条由大模型辅助拟写并人工检查的挑战问题，其中 30 条可回答、5 条问的是站点文章里没有的数据。之后又单独整理了 31 条 Reddit 启发题，25 条站内可回答、6 条无答案或需要站点外信息。提问场景参考了 [r/Blogging 对个人博客读者兴趣的讨论](https://www.reddit.com/r/Blogging/comments/1dnkyo8/question_for_personal_blog_readers/)、[多主题博客定位](https://www.reddit.com/r/Blogging/comments/1ve8tyi/do_multitopic_blogs_work_or_is_focusing_on_one/)和[新博客流量问题](https://www.reddit.com/r/Blogging/comments/1c0cgfe/blog_3_months_old_zero_traffic/)，以及 [r/ExperiencedDevs 的知识交接](https://www.reddit.com/r/ExperiencedDevs/comments/zgwrag/best_practices_for_knowledge_transfer_when_a/)、[新人上手](https://www.reddit.com/r/ExperiencedDevs/comments/1gtonmx/whats_a_great_onboarding_experience_for_new/)和 [r/ProductManagement 的需求优先级](https://www.reddit.com/r/ProductManagement/comments/1e73814/how_do_you_prioritize_feature_requests_when/)讨论。题库里的问句是根据这些讨论重新写的中文或英文场景题，没有复制帖子原文，也没有用 Reddit API 抓取或做词频统计。每题保留来源链接，方便回看它来自哪类讨论。

这批帖子是用来补充问法和场景的便利样本，不是 Reddit 用户或博客读者的代表性抽样。能搜到、仍可访问、标题看起来相关的讨论更容易进入样本；社区本身也有自己的用户构成。更重要的是，个人博客常见的站外问题——“你会订阅这个博客吗”“我该选哪种建站平台”“我上个月有多少访问量”——和站内文章问答不是一回事。前两种要结合读者偏好或最新平台信息，最后一种需要网站分析数据。当前索引没有这些材料，应当拒答或追问，而不是因为找到一篇沾边的文章就开始回答。

更新到当前压缩生产索引后，70 条全站可回答问题的 Hit@1 是 37/70，Hit@3 是 49/70（70.0%），MRR 是 0.605，Recall@3 是 0.671，nDCG@3 是 0.607。40 条社区式改写问题的 Hit@3 是 26/40（65.0%）。10 条站外或站内无答案的问题中，6 条仍会召回文章（60%）。另外 5 条需要当前页面上下文的问题不计入普通检索分数；现在机器人会在这类提问里读取当前文章正文，单篇来源测试已覆盖这条路径，但这 5 题还没有单独跑完回答质量评估。这些是同一套合成问题上迭代后的诊断结果，题量小，不能代表真实读者效果。

在独立于原始 85 题结构之外，我又按 Reddit 讨论里常见的“具体处境 + 卡点 + 想要建议”写了 31 条启发题。个人博客问题与站内主题分开标注；站内问题允许多个合理来源。当前检索器在 25 条站内题里的 Hit@3 是 16/25（64.0%），MRR 是 0.533，Recall@3 是 0.300，nDCG@3 是 0.330；6 条无答案题里有 5 条仍然召回了文章（83.3%）。分类结果也不平均：新人上手 4/4 命中前三，知识交接 1/3，管理实践 3/4，技术判断 4/7，职业反思 1/2，博客与搜索 3/5。这个结果说明，别名和检索规则能改善一部分说法差异，但目前还不能稳妥地区分“主题沾边”和“文章真的能回答”。

评测过程中，主题别名、权重、拒答门槛和片段抽样都根据这些题反复调整；所以最终的 85 题和 31 题都已经是开发集，不能再称为独立保留集。当前紧凑索引相对先前完整索引的 Reddit Hit@3 从 14/25 到 16/25，但这同时改变了索引表示和资源策略，不能把差值单独归功于某个算法。测试只运行本地静态索引检索，没有调用 Gemini 生成答案，也没有生成 embedding。它能指出这些问法下哪些文章没进前三，不能证明最终回答质量或真实用户满意度。

这个数值首先是一个**诊断结果**，不是读者成功率，也不是独立测试集上的泛化成绩。问题是人工或模型辅助合成的；而且我们已经根据同一套题观察和调整检索实现。它适合指出“哪些题型掉得多”“哪些问题总是被误召回”，但最后报告的分数可能偏乐观。微软研究团队专门研究过用大模型生成检索评测集，实验表明合成评测集可以用于比较检索器，但也分析了对大模型系统的潜在偏差。[Synthetic Test Collections for Retrieval Evaluation](https://www.microsoft.com/en-us/research/publication/synthetic-test-collections-for-retrieval-evaluation/) 另一项 RAG 评测研究发现，合成问题在比较不同检索器配置时和人工基准较一致；拿它比较不同生成模型时则不总可靠，可能受任务差异和表达风格偏好影响。[Can we Evaluate RAGs with Synthetic Data?](https://arxiv.org/abs/2508.11758) 所以这些问题适合做覆盖和调试，不能冒充真实读者数据，也不该同时承担开发集和最终验收集。

更可信的下一轮实验，应该把已经看过、用来调参的问题留在开发集，再留出一批不参与调试的问题做最终检查。真实读者问题如果将来能收集，要先去掉个人信息，和合成题分开标注来源。每个问题最好允许多个合理来源，并标注“可回答 / 需要当前页面 / 站内无答案”。只标正确文章还不够；还要标出答案真正依赖的段落，才能检查检索到的内容是否包含证据。

研究里的 RAG 评测也把系统拆成了多个部分。RAGAS 讨论了检索上下文是否相关、回答是否忠实于上下文、回答是否切题；ARES 则通过自动评审这些维度，并用少量人工标注校准评审结果。[RAGAS 论文](https://arxiv.org/abs/2309.15217) [ARES 论文](https://aclanthology.org/2024.naacl-long.20/) ACL 2025 的 UAEval4RAG 进一步专门评估知识库无法回答的问题，并指出不同知识库下未必有一套配置能同时最好地处理可回答与不可回答问题。[UAEval4RAG 论文](https://aclanthology.org/2025.acl-long.415/) 对我的项目来说，Hit@1、Hit@3 和 MRR 只能回答检索排序问题。还得单独看段落证据覆盖率、来源链接正确率、答案是否超出材料，以及无答案问题是否真的拒答。一次回答听起来流畅，不等于它基于正确文章。

## 哪些优化值得先试

第一步应该是把失败题打印出来，而不是马上换更复杂的向量库。对每条漏题记录正确文章排名、返回的段落和重合词：如果正确文章没进候选，问题在召回；进了候选但排名太低，问题在排序；文章正确但段落不含答案，问题在内容切段或段落选择。只有把这几类失败分开，才知道该调哪个部分。

之后我会按成本从低到高做对照：先保持当前问题集、语料版本和 top-k 不变，试标题与章节标题权重、按句子和段落边界切段、适度查询改写；再试关键词和向量并行召回，用 RRF 按排名合并，而不直接相加量纲不同的原始分数。RRF 是经典的排序融合方法，Microsoft Azure AI Search 的混合搜索也使用它来合并文本与向量结果。[RRF 原始论文](https://cormack.uwaterloo.ca/cormack/cormacksigir09-rrf.pdf) [Microsoft 对混合搜索和 RRF 的说明](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking) 每次只改一个关键变量，再跑同一组开发题；最后用没参与调参的保留题复查。如果向量只改善训练过的题型，不能算稳定提升。

拒答也要有独立实验。基础题和挑战题合并后，10 条无答案问题仍有 6 条召回文章；Reddit 启发集里的 6 条则有 5 条误召回。说明“有候选文章”不能直接当成“有答案”。后续要比较更严格的证据门槛、问题意图分类和澄清提问是否能降低误召回，同时记录它们会不会把本来可回答的问题也拒掉。对个人博客来说，读者问的是站点分析数据或个人偏好时，明确说明索引里没有这些信息，比拿主题相近的文章拼答案更可靠。

## 生产里的检索通常分成两条流程

看公司公开的实现，RAG 往往不是“每次用户提问时现做 embedding”。它通常有离线和在线两条流程。离线流程把文档解析、切段、附上标题或权限等元数据、生成或更新索引；在线流程把问题做同样的查询预处理，召回候选，必要时再重排，然后把少量证据交给模型。Anthropic 的 Contextual Retrieval 把片段补上文档上下文，再分别建立 BM25 和向量索引，查询时合并候选并用 reranker 排序；Slack 的生产搜索强调在检索阶段遵守用户权限。微软的 Azure AI Search 也把关键词与向量结果用 RRF 合并。这些资料能说明常见架构形状，不能证明所有公司都采用同一套实现。[Anthropic 的检索流程](https://www.anthropic.com/engineering/contextual-retrieval) [Slack 的权限感知搜索](https://slack.engineering/how-we-built-enterprise-search-to-be-secure-and-private/) [Microsoft 混合搜索与 RRF](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking)

效率优化通常沿着几个具体位置做：增量处理未变化的文档，避免每次重新嵌入全库；先用便宜的召回方法找几十个候选，再让较贵的重排模型只看候选；缓存解析后的索引；把延迟、token 用量和检索质量一起记录。Anthropic 报告的上下文增强、BM25、向量和重排是这种分层思路的例子。对我这个站点，文章总量还小，先用构建时生成的紧凑倒排索引，在线按词项查找，再把少量片段给 Gemini，成本和故障面都更小。是否加向量，应该由保留题上的质量提升来决定，而不是因为生产系统里常见就先买一套。

评估也要分层。检索层看 Hit@k、Recall@k、MRR 或 nDCG；回答层抽查引用是否正确、答案是否被引用段落支持、无答案时是否拒答；系统层再看延迟、索引大小、模型 token 和错误率。RAGAS、ARES 等工作提供了检索相关性、忠实度、答案相关性等维度；ARES 还讨论用少量人工标签校准自动评审。自动评审适合筛查大量样本，仍需要人工抽检，尤其是分数靠近阈值或涉及事实判断的回答。[RAGAS](https://arxiv.org/abs/2309.15217) [ARES](https://aclanthology.org/2024.naacl-long.20/)

对这份小型博客评测，我会先把 85 题当开发集：失败时看预期文章是否进前三，再看返回片段是否含证据，最后检查模型答案和来源。每次改一个变量。等检索器和提示词不再按这批题调整后，再另外准备一批问题作为保留集；最好由人从真实问题中抽样并去除个人信息。当前合成题并非独立保留集，所以上面的分数用来找问题和比较实验配置，不是对真实读者效果的承诺。未来还可以按问题类型、中文和英文、可回答和不可回答分别报告，避免总体均值遮住某个类别的退化。

## 发布新文章时要更新什么

现在每次构建都会从已发布内容重新生成中英文静态关键词索引，直接包含在站点产物里。新文章发布后随下一次构建进入索引；编辑已发布文章也会更新；标成草稿或删除的文章不会进生产索引。这里没有生成向量，所以不需要 Gemini embedding 调用，也没有 Cloudflare Vectorize 写入。这个规则来自当前构建实现，不是 RAG 的硬性规定。

如果以后加向量，更新应发生在内容发布或索引部署阶段，而不是每个读者提问时重新处理全部文章。可以为每个已发布段落保存稳定 ID 和内容哈希：新增或哈希变化的段落才调用 embedding 并 upsert，未变化的跳过；文章被撤稿、删除或改成草稿时删除对应向量。语言、模型版本、维数或切段规则变化时，需要新建版本并全量重算，再切换到新索引。若只有四五篇中文文章加对应英文译文每月更新，这种差异更新工作量很小；但首次建库、切段规则变化或 embedding 模型升级仍可能需要全量处理。

所以未来若采用向量，建议把索引生成做成可重复运行的 CI 步骤，并记录内容哈希、索引版本和成功状态；失败时不能让半新半旧的索引悄悄上线。Cloudflare Pages 负责部署静态站点，向 Vectorize 写数据则需要有写权限的 API token 和独立索引任务；不能把写入凭证放在浏览器可读取的变量里。免费额度也要按已用空间和查询量监控。对当前站点来说，先保持静态关键词索引并在文章发布时自动重建，已经满足内容同步，不需要额外定期人工“清向量”。

## 给这个站点的工程方案

现在的方案继续使用静态倒排索引和检索前后的低成本规则，不需要 embedding API 或向量数据库。问“这篇讲了什么”时，浏览器只传当前站内路径；服务端先用已发布文章索引核对，再从同一次构建生成的静态文章上下文文件里读取正文。普通问题仍走全站关键词检索。当前文章正文只在这类提问时发送给 Gemini，聊天隐私说明也写明了这一点。

全站检索使用双语标签和专栏说明，并为容易出现说法差异的主题加短语别名，例如“研发效率”对应“开发者生产力”，“交接知识”对应“知识管理”。常见问句词会从查询里过滤；问题过滤后最多要求 3 个不同词项匹配，短查询门槛会降低。证据门槛检查候选文章元数据和最佳段落，避免把散落在不同段落的词拼成貌似有证据的结果。之后又补了技术文档、入职辅导、管理、优先级和 SEO 等词面别名。当前紧凑索引在 85 题里的 Hit@3 为 49/70（70.0%），MRR 为 0.605；Reddit 启发题 Hit@3 为 16/25（64.0%），MRR 为 0.533。后者 6 条无答案题仍有 5 条误召回。改善幅度有限，拒答仍不够可靠；两组题都参与过调试，不能代表真实读者效果。没有足够检索证据时不调用 Gemini，避免为明显不足的候选消耗免费层请求。

向量检索先不接。它可以作为后续对照实验，但这 85 道题已经参与检索规则调整，暂时不足以证明向量会带来稳定提升；更不能据此增加一个可能收费的服务。

当前静态关键词索引是构建产物，按语言分成两个文件，总计约 795 个代表性段落、5.2 MB；完整正文检索实验的 3,183 段和 11.3 MB 是离线对照产物，不会随站点部署。每次发布后，静态索引随站点构建自动更新，因此没有云端向量数据要清理。Cloudflare Pages 对单个静态文件有大小上限，Workers/Pages Functions 还有 CPU 和内存约束；Worker 内存中缓存已解析索引，减少同一运行实例后续请求的重复解析。[Pages 限制](https://developers.cloudflare.com/pages/platform/limits/) [Workers 限制](https://developers.cloudflare.com/workers/platform/limits/)。Vectorize 官方列出的 Workers Free 额度是 500 万存储维度和每月 3,000 万查询维度；按 3,183 段、768 维估算，每次就约 244.5 万查询维度，所以免费额度只够约 12 次/月。对外开放的机器人很容易超过这个量，现阶段仍不把向量检索放进运行链路。[Vectorize 定价](https://developers.cloudflare.com/vectorize/platform/pricing/) [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)

如果以后确实要试混合检索，文章向量也应该在发布构建阶段增量更新，而不是在读者提问时重算整库：用稳定段落 ID 和内容哈希跳过未变化的内容，撤稿或转草稿时删除对应记录；模型、维数或切段策略变化时再做版本化重建。这个过程要先确认 embedding 和向量存储都能在不付费的情况下使用，并保留关键词检索作为回退。现在并没有这条向量流水线。

如果以后要判断混合方案值不值得试，先留一组不参与调参的问题，再比较当前关键词检索、向量检索和混合检索。评价要同时看 Recall@3、nDCG@3、答案证据覆盖、来源链接正确率、无答案误答率、响应时间和模型调用量。语义改写题有稳定提升、拒答和引用没有退化，而且两个服务都确认免费，才考虑启用。当前这 85 题已经用于调试，不能充当最终验收集。

这次实际做的改动是让检索用上现成的双语主题元数据、压缩每篇文章保留的片段数，再用词项与证据门槛挡掉一部分弱匹配。关键词索引跟着站点构建更新；没有找到足够词面证据时会直接说明站内资料不足，不调用 Gemini。后来我加了当前文章上下文：读者问“这篇讲了什么”时，机器人会只引用当前文章；其他问题仍从全站检索。向量还没有接入；如果后续仍漏掉语义相近的文章，再用独立保留题评估它值不值得增加。

## 把文章交给 GPT，和把机器人放进站点

把文章文件加到 ChatGPT 的 GPT 知识里，和在网站里做问答，底层都可以包含检索增强生成；两者不一定是“一个用了 RAG，一个没有”。差别更多在交付方式、检索控制和维护过程。OpenAI 的 GPT 文档把 Knowledge 列为 GPT 可使用的参考文件；Retrieval API 则提供向量索引、分块、过滤、查询重写等可配置检索能力。[GPTs 与 Knowledge 说明](https://help.openai.com/en/articles/8554407-memory-in-chatgpt) [OpenAI Retrieval 文档](https://developers.openai.com/api/docs/guides/retrieval)

自定义 GPT 的优点是可以直接利用 ChatGPT 的对话体验和模型能力，做原型很快；限制是资料更新需要维护知识文件，读者也要离开博客去 ChatGPT 使用。站内机器人可以和文章页面、来源链接及当前页面上下文连起来，发布文章时还能随静态构建更新索引；但检索器、提示词、界面和 API 成本都要由站点自己处理。目前这个项目没有做 GPT 知识库和站内机器人的同题对照，不能下结论说哪边回答质量更高。即使要比，也要固定问题、知识版本、回答模型和评分标准，不然测到的可能是模型差异而不是检索差异。

## 这次实验让我知道了什么

现阶段可以确定的是：关键词检索在这组测试题上有可观察的漏召回，站外问题也暴露了拒答缺口；600 到 1,500 字符的切段长度让段落数变化很多，但 Hit@3 没变。文献和公司的工程实践给了我值得试的方向，例如章节上下文、BM25 加向量、重排和分层评测；它们没有替我证明哪种方法适合这批文章。向量检索和 GPT 与站内机器人的质量比较，我都还没有做。

下一轮我想先冻结一份保留问题集，补齐每题的相关文章和证据段落，再分别看检索、拒答和回答引用。之后才比较当前关键词、单独向量、混合召回。这样学到的不只是“某个配置分数变高了”，还会知道是哪一步改变了、哪些问题因此变好、又有哪些问题被牺牲掉。对这个项目来说，这比先搭一套更复杂的向量基础设施更有用。
