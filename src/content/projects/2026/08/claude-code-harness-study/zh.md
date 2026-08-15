---
title: Coding Agent Harness Study（一）：架构比较与受限文件执行
description: 从公开资料、可观察行为与可运行的微内核出发，学习怎样把 coding agent 的权限、工具调用和运行轨迹变成可验证的系统边界。
createdAt: 2026-08-13
publishedAt: 2026-08-13
updatedAt: 2026-08-14
status: active
repositoryUrl: https://github.com/Liyuk/claude-code-harness-study
hero:
  src: /images/projects/claude-code-harness-study/editorial-concept.webp
  alt: 一枚任务核心被多层边界包围，并将可审计事件轨迹送入受限文件工作区的概念示意。
  caption: 概念示意：能力由权限、审批与可追溯执行边界约束；并非项目界面截图。
tags: [agent, coding-agent, systems, typescript]
---

[在 GitHub 查看项目与学习记录 ↗](https://github.com/Liyuk/claude-code-harness-study)

很多 coding agent 的起点都很直接：模型读任务，调用 shell 或编辑器，观察输出，再决定下一步。它足以完成演示；但一旦进入真实仓库，更难的问题随之出现：谁决定工具权限？一次修改为什么发生？预算、拒绝、批准和失败怎样留下可复查的记录？中断以后，又如何继续而不重复副作用？

这个项目不是复刻某个产品，也不依赖泄露源码、内部提示词或未发布功能。它以公开文档、公开仓库和可独立验证的行为为证据，逐步实现一个最小的 coding-agent harness：模型可以提出动作，但权限、真实副作用和运行状态必须由系统边界控制。

## 已完成：先画清边界，再实现一条受限链路

学习部分已经完成三份可公开复查的材料：

- [架构基线](https://github.com/Liyuk/claude-code-harness-study/blob/main/learning/architecture-baseline.md)：区分 agent loop、上下文、策略、执行器和状态存储各自的责任；
- [生态与证据地图](https://github.com/Liyuk/claude-code-harness-study/blob/main/learning/landscape-2026-08.md)：整理公开可复现项目、论文、评测和安全资料；
- [四种 Harness 架构对比](https://github.com/Liyuk/claude-code-harness-study/blob/main/learning/harness-comparison-pi-codex-claude-deepseek.md)：比较 Pi、Codex、Claude Code 与 DeepSeek Harness 的公开边界和可吸收设计。

实现部分已经有一条可运行的垂直切片：内存中的 process / budget / policy gate / tool broker / event trace，以及第一个真实 I/O adapter——受限文件执行器。它只允许访问指定 workspace；读取文件不产生副作用，写入文件只生成暂存的 unified diff，绝不直接写回磁盘。写入还需要相应的、可范围限定的 capability，并须经过人工批准。

```text
模型提出写入请求
  → capability / approval 判定
  → tool broker
  → workspace 内的 FileSystemExecutor
  → 暂存 diff + 结构化事件
```

这不是一个“已经能自主开发”的 Agent；它是一条已经可以测试的安全边界。合同测试覆盖越权写入被拒绝、批准前不执行、路径不能越出 workspace 或穿过 symbolic link，以及 executor 不直接落盘。

## 正在学习的完整模型

```text
用户任务 / 工作区
  → Context builder：选择当前轮所需的事实与约束
  → Agent loop：计划、执行、观察、重试与停止
  → Tool broker → Policy gate → Sandboxed executor
  → append-only event store / checkpoint：保存可恢复状态
```

这张图是正在验证的目标模型，不是当前功能清单。关键不在于把每个组件做大，而是让每个边界可见：模型负责判断与生成；系统规定它能读什么、能写什么、哪些调用必须被拒绝或确认，以及何时必须停止。

## 下一步：让运行真的可以恢复

接下来会按已经写入仓库的路线图推进：

1. 将内存事件轨迹替换为持久的 append-only event store，并实现 checkpoint 恢复；
2. 增加独立、可审批的 `apply_staged_write`，让人能先审阅 diff，再决定是否真正写入工作区；
3. 在上述合同稳定后，才考虑受限的测试命令与 context manager；
4. planner、verifier、子 Agent 与插件系统都留到单 Agent 基线可重放、可恢复之后再评估。

项目把学习讨论与实现分开：`learning/` 用于比较架构、记录证据和待决问题；`kernel/` 用合同、代码与测试定义实际行为。每加入一个有副作用的工具，都必须先说明 capability、审批策略、sandbox、事件记录和恢复语义，再写对应测试。

## 当前阶段

项目处在“安全执行边界已跑通、持久化与恢复尚未实现”的阶段。后续学习记录会按实际完成的里程碑展开，而不是预先假定多 Agent、长期记忆或全插件系统必然是答案。

这个项目与 CanonLoom 共享一种立场：Agent 的能力不应建立在隐式记忆与不可解释的自动化上。区别在于，CanonLoom 面向长篇创作的状态生产；Coding Agent Harness Study 面向真实软件仓库中的编码循环。
