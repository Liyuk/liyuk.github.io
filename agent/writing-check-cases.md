# Writing workflow check cases

Manual cases for maintainers editing the writing rules or skills. Apply `editorial-rules.md`'s revision contract and `README.md`'s workflow to each input. Record the proposed edit or reason to preserve it; check the expected boundary. These cases check instruction consistency, not a model's measured performance or a detector score. They do not authorize changes to published content.

| Input or request | Expected behavior |
| --- | --- |
| “值得注意的是，审核还没结束。” | If the opener carries no scope or emphasis needed by context, use “审核还没结束。” Preserve the unfinished state. |
| “这个方法显著缩短了等待。等待时间从两小时降到四十分钟。” | A local repair may state “这个方法把等待时间从两小时缩短到四十分钟。” Keep the stated relationship and values; do not invent cost savings. |
| A paragraph opens “听起来很危险”，after discussing two different proposals | Flag the unclear referent. Supply a subject only if the source makes it unambiguous; do not guess which proposal is meant. |
| “我原来以为是招人太慢。后来才发现，两个人对岗位的理解根本不同。” | Preserve the supported change of mind. A transition that resembles a listed pattern is insufficient reason to edit. |
| “不是所有失败都来自执行。有时目标本身就错了。” | Preserve the qualification and distinction; shortening to “目标错了” changes the claim. |
| “我想知道，这次到底是谁在做决定？” | Preserve the real question. Do not rewrite it merely to remove a question mark. |
| “这件事像修一把旧椅子，换掉一条腿，才发现旁边也松了。” | Preserve the author's explanatory analogy when supplied as source material. Do not invent another experience to make it more human. |
| “先采集、存储、展示，再检查结果。” | Retain every operation. “从采集到展示” can conceal the storage step and is not an acceptable automatic cleanup. |
| “处理时间可能从两小时缩短到四十分钟，还要看流量。” | Preserve the numbers, uncertainty, and traffic condition. Do not turn an estimate into a measured result. |
| “实现了效率的提升。” with no further source material | Do not add saved hours, costs, people, or measured speed. Report missing specifics if relevant; do not substitute a stronger unsupported effect. |
| Several equally long sentences, repeated technical nouns, or one legitimate dash | Preserve unless a concrete clarity or redundancy problem is located. Do not manufacture uneven rhythm or rotate synonyms. |
| A research draft has numbered sections and refers to “第三节” | Preserve numbering and cross-reference. Genre and reference function override generic anti-template advice. |
| A quote contains “综上所述”; code or frontmatter contains a flagged phrase | Preserve the protected span; inspect only editable prose. |
| “帮我看看这篇能不能发”，with an existing Chinese draft | Review the whole piece and report located findings. Do not start an interview, create a new outline, or silently rewrite the draft. |
| A topic and two observations, with no request for a complete essay | Use the matching drafting skill to produce a brief or focused question. Do not invent a full case or pad to a length floor. |
| A short gallery caption needs calibration | Apply caption and gallery requirements; do not impose essay length, a framework, or a conclusion. |
| Chinese source says “可能降低延迟”; English says “reduces latency” | Flag a 信 failure. English cleanup must retain the possibility and the specific effect. |
| Chinese is revised after the English review | Identify affected claims and metadata, repeat relevant translation review, and invalidate final GO until re-reviewed. Owner acceptance remains required for `reviewed`. |
| Final review finds one generic transition after earlier cleanup | Report the specific repair; do not run a new whole-document rewrite. After repair, re-review the affected stage. |

For a new rule, add a local should-change / should-preserve pair and document evidence limits. If evaluating actual agent runs, record the model, inputs, outputs, and observed failures separately; reading these cases alone is not a passing behavioral evaluation.
