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
tags: [agent, routing, explainability, reliability, observability, typescript]
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

失败分类是保守的，稳定失败和瞬态失败有不同待遇：

| 失败类型 | 例子 | 行为 |
| --- | --- | --- |
| 稳定失败 | QUOTA、余额不足、401/403 | 立即前进到下一健康候选，并要求 DSH 同轮重试 |
| 瞬态失败 | 429、5xx、超时、传输中断 | 先交给 DSH 正常重试；达到阈值后进入 cooldown 并前进 |
| 其他 | 上下文超限等 | 不动；这不是换模型能解决的问题 |

四条规则让行为保持可预测：

- **forward-only**：候选只前进不回头，不在坏路由之间震荡。
- **绝不越权**：`paid` 默认跳过，除非显式开启 `allowPaidFallback: true`；`manual`/`emergency` 永不自动选择。
- **先校验后写入**：候选必须通过 DSH 原生 provider/model 目录校验，才会写进请求。
- **可审计**：选择、fallback、cooldown 和用量记录在内存 ledger 中，可通过 `quota_router_status` 查看。

候选耗尽时保留 DSH 原始错误，绝不静默使用未授权来源。

## Settings 页面

插件带有 DSH Web 设置页（Settings → Quota Router），把策略编辑变成可见的界面：

- 首屏展示每个任务展开后的候选链，并明确标记自动候选、跳过和付费保护；
- 来源可以拖动排序，provider 从 DSH 本地目录选择，模型输入支持目录补全；
- 重复 ID、缺关键词、引用不存在的来源等错误会在保存前提示并禁用保存；
- 页面明确区分三方职责：用户配置优先级与映射，插件保证 first-match/forward-only/cooldown，DSH 管理 provider、凭据和模型目录。

配置通过 revision 乐观锁写回 DSH Settings，保存后实时重新校验候选，无需重启。

## task-aware 子任务路由层

v0.2+ 还提供独立导出的 `SubtaskRouter`，面向 Agent/Planner 已经拆好的子任务。它返回一个模型租约，让同一个 subtask 在多轮执行中保持稳定：

```ts
const result = router.route({
  taskId: 'T1', subtaskId: 'S3',
  contractVersion: 'v1', contractHash: 'sha256-…',
  taskClass: 'coding', complexity: 'high', precision: 'high',
  allowedModels: ['opencode-go/mimo-v2.5', 'token-share/gpt-5.6-terra'],
})
```

这一层不做 Planner，也不在每一轮重新猜任务类型。它坚持几个边界：结构化分类优先于关键词；同一 `taskId+subtaskId+contractHash` 幂等；权限只收紧不放大；critical 任务不降级；质量失败交给上层验收器；遥测默认不记录 prompt 全文。

## 怎么衡量是否省钱

“选择了便宜模型”不等于“产生了收益”。路由器可以直接审计 primary 使用比例、primary 直接完成比例、fallback 恢复比例，以及各 tier 的 token 用量；只有上层回传 `RouteOutcome`，才能进一步计算 accepted 率、返工率和有 baseline 支撑的净节省：

```text
saving = baseline_resource_for_accepted_subtasks
       - router_resource_for_accepted_subtasks
```

因此，付费来源是否参与不是一次故障中的隐式副作用，而是一个明确的策略决定。

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
