---
title: Quota Router：给 DSH 一条可解释的多源模型 fallback 链
description: DeepSeek Harness 的纯策略插件：按任务选择有序、可解释、可审计的模型候选链，并在配额、限流或传输失败时沿链有界前进。
createdAt: 2026-08-19
publishedAt: 2026-08-19
updatedAt: 2026-08-19
status: active
draft: false
repositoryUrl: https://github.com/Liyuk/dsh-quota-router
paperUrl: https://www.npmjs.com/package/@liyuk/dsh-quota-router
hero:
  src: /images/projects/quota-router/architecture.svg
  alt: Quota Router 在 DSH 中的位置：用户回合进入纯策略层，经过来源优先级、任务模型映射与保障机制后回到 DSH 原生层。
  caption: Quota Router 的架构边界：只负责可解释的模型选择与 fallback，不拥有 provider、凭据或模型目录。
tags: [agent, routing, algorithms, explainability, reliability, observability, typescript]
---

[在 GitHub 查看 Quota Router ↗](https://github.com/Liyuk/dsh-quota-router)　·　[在 npm 查看已发布的包 ↗](https://www.npmjs.com/package/@liyuk/dsh-quota-router)

> `@liyuk/dsh-quota-router` 是 DeepSeek Harness（DSH）的一个**纯策略插件**：它不注册 provider、不保存凭据、不猜模型能力，只在 DSH 已经知道的路由里，为每个任务选出一条有序、可解释、可审计的候选链，并在失败时沿链有界前进。

## 要解决的问题

同时使用订阅、免费共享池和付费 API 时，常见的问题是：订阅额度用完后回合直接报错；简单任务误用昂贵模型；限流时反复重试同一个坏路由；出了问题又说不清这一轮到底用了哪个模型、为什么。

根因是两个应该分开的选择被混在了一起：

1. **先用哪个来源？** 这是全局的成本与风险排序问题，例如订阅 → 免费 → 付费。
2. **到了这个来源，这个任务该用哪个模型？** 这是按任务质量分层的问题，例如简单任务用 mini，复杂编码用更强的模型。

Quota Router 把这两个维度正交化：来源有全局优先级，任务 profile 决定每个来源对应的模型。

## 来源优先级 × 任务模型

![Quota Router 在 DSH 中的架构边界](/images/projects/quota-router/architecture.svg)

配置只需要表达两个核心概念：

```yaml
sources:            # 全局来源顺序
  - { id: opencode-go, provider: opencode-go, tier: subscription, priority: 1 }
  - { id: token-share, provider: token-share, tier: free, priority: 2 }
  - { id: starchasing, provider: starchasing, tier: paid, priority: 3 }

profiles:           # 每个任务在每个来源使用的模型
  - id: coding
    keywords: ["写代码", "修复", "bug", "fix"]
    modelBySource: { opencode-go: mimo-v2.5, token-share: gpt-5.6-luna }
  - id: hard-coding
    keywords: ["死锁", "并发", "deadlock", "concurrency"]
    modelBySource: { opencode-go: mimo-v2.5, token-share: gpt-5.6-terra }
```

运行时，用户消息先按 first-match 命中 profile，再把 profile 的模型映射与全局来源顺序展开成自己的候选链。`coding` 和 `hard-coding` 可以共享同一个便宜 primary，但在配额失败后分别走向 Luna 和更强的 Terra。为此，路由器会为每个 DSH 回合保存 `profileId + candidateIndex`，不会只记住当前的 provider/model。

## 失败时如何前进

失败分类是保守的：稳定失败（配额耗尽、余额不足、401/403）立即前进到下一个健康候选；瞬态失败（限流、5xx、超时）先交给 DSH 正常重试，超过阈值才进入 cooldown 并前进；上下文超限这类问题不动，因为换模型解决不了。候选只前进不回头，`paid` 来源默认跳过，选择和 cooldown 记录在内存 ledger 里可查。完整的失败分类表、四条不变规则和实现细节，写在[工程设计与路由算法](/projects/2026/08/quota-router-engineering/)里，这里不重复。

## Settings 页面

插件带有 DSH Web 设置页（Settings → Quota Router），把策略编辑变成可见的界面：

- 首屏展示每个任务展开后的候选链，并明确标记自动候选、跳过和付费保护；
- 来源可以拖动排序，provider 从 DSH 本地目录选择，模型输入支持目录补全；
- 重复 ID、缺关键词、引用不存在的来源等错误会在保存前提示并禁用保存；
- 页面明确区分三方职责：用户配置优先级与映射，插件保证 first-match/forward-only/cooldown，DSH 管理 provider、凭据和模型目录。

配置通过 revision 乐观锁写回 DSH Settings，保存后实时重新校验候选，无需重启。

## task-aware 子任务路由与省钱核算

v0.2+ 还提供独立导出的 `SubtaskRouter`，让 Agent/Planner 拆好的子任务在多轮执行中保持稳定的模型租约；路由器也能审计 primary 使用比例、fallback 恢复比例和各 tier 的 token 用量，区分"选了便宜模型"和"真的省了钱"。这两部分的接口示例、幂等规则和省钱公式，同样写在[工程设计与路由算法](/projects/2026/08/quota-router-engineering/)里。

## 安全模型与边界

| 区域 | 归属 |
| --- | --- |
| 来源顺序、任务映射、阈值、冷却 | 用户配置 |
| first-match、forward-only、cooldown 算法 | 插件固定实现 |
| provider 注册、凭据、模型目录、adapter retry | DSH 原生层 |

`tier` 只是成本和用途标签，不查价格、不查余额、不改变排序。插件不伪造消息、不注入事件，也不修改上下文压缩。

## 快速开始

```bash
npm install @liyuk/dsh-quota-router
```

在 DSH 的 `quota-router` 命名空间配置策略，或打开 Settings → Quota Router 可视化编辑。运行期使用 `quota_router_status` 查看决策、cooldown 与用量。

项目当前发布为 npm `v0.1.3`，开发验证包括 `pnpm test`（44 项单测/集成）、真实 DSH AgentLoop 验收、类型检查和构建。
