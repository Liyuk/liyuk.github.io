---
title: 从能跑到可维护：我开发 DSH 插件时遇到的架构与稳定性问题
description: 基于 ChatLab、Agent Suite 与 Quota Router 的实际开发和调试，整理 DSH 插件机制、preview 版本的常见稳定性问题，以及自己开发插件时最容易踩到的边界。
locale: zh-CN
createdAt: 2026-08-19
publishedAt: 2026-08-20
draft: false
type: case-study
tags: [technology, agent-systems, developer-productivity]
translationKey: 2026/08/dsh-plugin-architecture-stability
---

> 本文是一份阶段性工程总结，不是 DSH 的官方 API 规范。例子来自我在 2026 年 8 月开发和验收的三组插件：`dsh-skin-chatlab`、`dsh-agent-suite` 和 `dsh-quota-router`，也参考了 DSH preview 版本的源码、运行日志和相关修复。DSH 仍在快速演进；升级后，事件名、payload、DOM 语义锚点和加载行为都必须重新核对。

我前一篇文章写过 [DSH 工作台里的九个插件](/writing/2026/08/dsh-plugin-toolbox/)：它们分别补上记忆、浏览器、状态行、侧边栏和皮肤等能力。真正开始自己开发以后，问题很快从“还能加什么功能”变成了另一组问题：为什么插件有时加载很慢？为什么改了代码却没有生效？为什么只改了样式，整个页面却崩了？为什么配置页面显示了候选模型，却不能证明运行时真的用了它？

这三组插件正好对应三种不同的插件工程：

| 插件 | 主要工作 | 最容易出问题的边界 |
| --- | --- | --- |
| `dsh-skin-chatlab` | 用 Feishu 风格表达会话、头像、未读和运行状态 | React 管理的 DOM、host/client 双端状态、CSS 兼容性 |
| `dsh-agent-suite` | 用本地账本记录成本，再由 monitor 和 archive 消费 | 事件归一化、持久化、依赖可见性、设置入口 |
| `dsh-quota-router` | 按任务选择模型，并沿候选链做有界 fallback | DSH 事件语义、同轮身份、原生模型校验、失败分类 |

它们最后都指向同一个结论：**DSH 插件不是一段挂在页面上的 JavaScript，而是跨越宿主进程、浏览器、事件流、配置和持久化数据的小型分布式系统。**稳定性来自边界清楚，而不是来自“这次启动成功了”。

## 第一部分：DSH 插件的注册、加载与生效原理

先把机制讲清楚，再看实际开发中的故障。一个 DSH 插件从“安装”到“用户看到效果”，并不是一次 import，而是一条由 profile、bundle、host、client 和生命周期共同组成的链路：

```text
npm 包安装
  → profile / bundle 注册
  → patch 注入 host/client 入口
  → ModuleLoader 加载入口
  → 创建 Cordis fiber，解析 inject 依赖
  → host 注册服务、事件和 RPC
  → client bundle 加载并挂载 slot/装饰节点
  → 事件或状态快照驱动 UI 更新
```

其中任何一环失败，最终表现都可能只是“插件没生效”。因此排查时要区分：包有没有安装、入口有没有加载、fiber 有没有启动、依赖有没有 ready，以及 client 有没有真正挂载。

### 1. profile、bundle 和 patch

DSH 的插件不是简单地把一个 npm 包 import 进页面。安装命令会把包加入某个 profile，例如：

```sh
dsh plugin --profile web add <package-name>
```

profile 里保存了插件 bundle 的加载关系。插件包还可以带一份 `cordis.patch.yml`，把自己的 host 入口、client 入口或依赖插入加载树。这个机制的好处是插件不需要直接修改 DSH 的源码；坏处是“包已经装上”不等于“所有入口都按预期加载”。profile、bundle 顺序、包的 `exports`、构建产物和目标 DSH 版本必须同时成立。

我在 ChatLab 的 monorepo 拆分中就遇到过这个问题。`core`、`skin-feishu` 和 `chatlab` 聚合包各自有不同职责：皮肤包需要通过 `inject: ["chatlab"]` 获取 core 暴露的服务，而不是直接 import core 的内部模块；聚合包则负责让用户安装一套可用组合。直接 import 看似简单，却会把两个独立 bundle 重新耦合，升级和加载顺序都会变得不可预测。

### 2. 一个插件通常有 host 半和 client 半

这三组插件虽然功能不同，但都可以拆成同一个基本结构：

```text
DSH profile / bundle
        │
        ├── host：Cordis service、事件监听、工具、设置、loopback RPC
        │
        └── client：浏览器 bundle、UI slot、装饰节点、设置页、样式
```

host 运行在 Node 侧，适合保存事实、订阅 DSH 生命周期、访问本地文件和提供受控 RPC。client 运行在浏览器侧，适合渲染 UI、订阅客户端状态和挂载自己的界面。两边不能靠“恰好共享了一份内存”来通信；应该使用 DSH service、事件、settings provider 或 loopback RPC 等明确接口。

三个项目的边界分别是：

- ChatLab 的 host 负责会话预览、未读判断和头像映射，client 负责皮肤注册、DOM 装饰和 CSS。皮肤本身不接管聊天逻辑。
- Agent Suite 让 ledger 成为唯一计量事实源；monitor 只读 ledger，archive 只读已结算账本。monitor 不重新计算成本，archive 也不应该直接改账本。
- Quota Router 只负责 profile 匹配、来源优先级、模型映射、失败分类和候选前进；provider 注册、凭据、模型目录、adapter retry 和上下文压缩属于 DSH 原生层。

### 3. slot、service 和 DOM 装饰是三种不同能力

优先级大致是：有合适的原生 slot 就使用 slot；需要跨进程读取事实就使用 service/RPC；只有视觉装饰没有 slot 时，才在明确语义锚点上追加自己的节点。

ChatLab 的会话行没有逐行 slot，因此它不能安全地把 React 节点搬出来重新排列。最后采用的是“只 append 自己的节点，再用 CSS Grid/flex 排位”的方式。右侧工作台也采用 portal，但 portal 是插件自己的根节点，不是去移动 React 正在管理的节点。

这条区别很重要：

```text
安全：React 节点 + 插件 append 的装饰节点 + CSS 排位
危险：清空 React 容器、移动 React child、insertBefore React 节点
```

后者往往不是立即报错，而是在下一次 React reconcile 时才出现 `removeChild`、节点不存在或页面白屏。因此“刷新后看起来正常”不能作为安全证明。

### 4. “注册成功”不等于“已经生效”

注册解决的是“让 DSH 知道有这个插件”，生效还需要完成几件事：patch 找到正确的入口，入口产物存在且 `exports` 可解析，host fiber 成功启动，`inject` 声明的服务已经 ready，client bundle 被浏览器加载，最后 UI 或事件 handler 才能接上宿主。

这也解释了几种常见现象：只有 host 没有 UI，通常是 client 入口、bundle 或 CSS 没进加载树；页面出现了但功能不工作，可能是 host service 没 ready；安装命令成功但启动后完全没有日志，则应先检查 profile、patch 和构建产物，而不是先改组件代码。

### 5. 热更新到底更新了什么

DSH 的热更新也不是“所有代码同时刷新”。client HMR 主要替换浏览器 bundle；host 热更新则需要让 Node 侧的入口 fiber 失效、重新加载并重新注册资源。一个完整的开发链路通常是：

```text
修改 src
  → watch 重新生成 lib
  → client HMR 替换浏览器模块
  → host hot-reload 发现入口变化
  → 释放旧 fiber 的资源
  → 加载新入口并重新注册
```

如果只改了被入口间接 import 的兄弟模块，入口没有变化，host 热更新可能不会递归失效；如果旧的 listener、watcher、RPC 服务或端口没有 disposer，重新注册后就会出现重复事件、端口占用和内存增长。因此“改完页面变了”只是 HMR 成功的表象，资源是否被正确释放同样属于生效条件。

## 第二部分：preview 版本的稳定性问题与处理

### 1. 版本号不是一个整体

DSH preview 的 root、web、agent、session、settings、client runtime 等包可能处在不同的 RC 版本。开发 Quota Router 时，目标事件需要按 DSH RC.6 的源码和真实 payload 验证，但部分依赖已经出现 RC.7；后来官方工作区又推进到了 RC.8。此时“类型能编译”只能证明某一组依赖的类型能编译，不能证明当前运行中的 web profile 会发送同样的事件。

所以插件开发不能只记录“支持 DSH 0.1.0-rc.x”，至少还要记录：

- 依赖锁定的版本组合；
- 实测过的事件名和 payload；
- 使用过的 profile 和安装方式；
- 哪些是公开 API，哪些只是 preview 内部行为；
- 升级后需要重新验收的 DOM 和加载假设。

### 2. 事件名相似，不代表属于同一条事件流

Quota Router 最初的使用量归因就踩过这个坑。assistant message 属于 `session/event` 的会话事件流，不是一个可以随意假设的独立 app event；`agent/inbox/inserted`、`agent/request` 和 `agent/request-error` 则属于 agent runtime 事件。它们的时间、上下文和 payload 结构都不同。

失败对象也不是一段可以从错误字符串里猜的文本，而是类似 `{ message, code, status? }` 的结构。后来按真实 payload 重写集成测试，才把 `QUOTA`、401/403、429、5xx、超时等情况分出不同恢复策略。

调试 preview 事件时，顺序应该是：

1. 先读目标版本源码，确认事件在哪里 emit；
2. 再在真实 DSH 会话中记录脱敏后的 payload；
3. 为每一种事件建立最小 fixture；
4. 最后才把 handler 接到插件主逻辑。

如果反过来先凭事件名字写代码，最容易得到“单测通过、真实运行不触发”的插件。

### 3. 我修过的宿主与生态问题

插件开发还会把问题暴露到 DSH 本体或周边插件。这里要把两类修复分开：一类是我自己的插件适配 DSH 契约，另一类是确认宿主或生态代码本身存在缺陷后，给上游提交最小修复。

我实际修过并留下代码、测试和提交记录的两个例子是：

- **DSH Discussion [#3455](https://github.com/deepseek-ai/deepseek-harness/discussions/3455)：Node 24 + `tsx` 下入口判断失效。** DSH 的多个 TypeScript 脚本依赖 `import.meta.main` 判断“当前文件是不是直接执行的入口”。在 Node 24 的 loader 场景里，这个值可能是 `undefined`，于是 `pnpm run build` 看起来成功，实际上没有生成运行时产物，其他 gate 也可能静默跳过。修复不是给某一个 build 脚本打补丁，而是抽出 `isEntryModule()`：优先使用原生结果，没有结果时比较 `process.argv[1]` 和当前模块文件路径，并给入口行为补回归测试。这个问题直接解释了为什么插件包“安装成功”后，web profile 里却缺 client 或 host 产物。
- **`dsh-mnemon` metadata maintenance 修复。** 子 agent 生成一条超长或过短的 title/description 时，旧逻辑会让整个 metadata maintenance 失败，甚至阻止其他合法 Memory Space 的更新。修复后，非法条目被跳过，合法条目继续提交；如果没有合法更新，也不会调用写入接口。对应测试覆盖“一个合法、一个越界”和“全部越界不写入”。这是一条很实用的插件原则：模型输出属于不可信边界，单条坏结果不应该把整个批次变成不可恢复的失败。

这两次修复让我更明确地看到，插件稳定性不只是插件仓库里的事情。宿主的构建入口、工具 schema、事件回放和 provider adapter 都可能决定插件能不能启动。调查 DSH 官方 Discussions 时还记录了几个值得继续关注的候选问题：Bailian 流式工具调用的空字符串增量覆盖已有工具名（[#3464](https://github.com/deepseek-ai/deepseek-harness/discussions/3464)）、MCP 描述里的字面 `{{...}}` 被 prompt 插值器误认为变量（[#3454](https://github.com/deepseek-ai/deepseek-harness/discussions/3454)），以及会话回放中 update 早于 start 导致历史会话无法加载（[#3450](https://github.com/deepseek-ai/deepseek-harness/discussions/3450)）。这些是诊断过的上游问题，不把它们写成已经合并的修复；官方仓库当时也明确说明暂不接受外部 Pull Request，因此更适合先通过 Discussion 和可复现 patch 参与。

### 4. 实际案例：ChatLab 的热更新为什么不生效

ChatLab 开发早期经常遇到“代码明明改了，页面却没变”。原因不是一个缓存，而是两层缓存：

- client 的 `lib/client.js` 需要重新打包，之后由 DSH client HMR 重新加载；
- host 的 `lib/index.js` 被 node_modules 边界保护，不能期待普通 client HMR 让它失效。

后来把开发流程改成 esbuild watch 加 client HMR，host 端使用 `dsh-hot-reload` 通过 lockfile 变化替换 host fiber，并在失败时回滚。这个流程明显减少了手工重启，但也有一个容易被忽略的边界：它只让入口模块失效，不会递归失效入口 import 的兄弟模块。改了被 `index.js` 引入的 `projection`，仍可能需要干净重启。

更早的 `restart-web.sh` 还遇到过旧进程占住端口，第二次启动得到 `EADDRINUSE`。这个问题表面像“插件把 DSH 搞崩”，实际是旧 web 进程、热更新和新进程同时存在。开发时要把“当前端口属于哪个进程”和“当前加载的是哪份 package/lib”作为第一诊断项。

### 5. preview 的 UI 内部结构不是稳定 API

ChatLab 的很多视觉问题都不是设计稿的问题，而是依赖内部 class name 和未承诺的 DOM 结构：聊天列表头像、标题和路径发生垂直挤压，顶部头像与名称/模式标签间距失控，三个点换行，深色模式切换后样式没有真正交给 DSH 管理。

后来保留的策略是：

- 优先用 `data-*`、aria 属性、角色和文本语义找锚点；
- 内部编译 class 只能作为临时适配层；
- 不观察整个 `body`，不在全局 MutationObserver 里做重计算；
- 深色模式交给 DSH 的 theme service，不在皮肤里另建一套主题状态；
- 每次升级都做真实浏览器回归，而不是只看截图或单测。

## 第三部分：实际开发问题——ChatLab 视觉插件

ChatLab 先后出现过几类看起来互不相关的问题，最后都可以归结为“显示层没有明确事实源”。

### 1. 皮肤切换会覆盖无皮肤状态

最初的皮肤切换涉及 CSS、装饰节点和 settings 状态。切回无皮肤后，旧的样式或节点仍然影响页面；未实现的 Slack、微信、iMessage、WhatsApp 也容易被误认为可点击。解决方式不是继续堆 CSS，而是让每套皮肤有稳定 id、`ready` 状态和可清理的装饰生命周期；未完成皮肤明确置灰，`none` 也作为一个正式的可恢复状态。

### 2. “有时有、有时无”的蓝点和红点

早期蓝点使用 `sessions.list` 快照里的 `running`，而 typing/status 帧使用 `session.running` 的实时值。会话刚开始或刚结束时，两者不同步，蓝点就会短暂消失。修复后，运行态优先读实时 `ctx.sessions.get(id).running`，快照只做其他字段的投影。

未读红点也经历过类似问题：运行状态、pending interaction、最后阅读位置和最后消息序号被混在一起计算，导致运行后红点消失，或者等待批准时红点被错误压掉。后来把 `unreadDecision`、`buildRunningSet` 等逻辑拆成纯函数，明确区分“正在运行”和“等待人介入”。

这给我的经验是：**同一个 UI 状态不能同时从两个延迟不同的源推导。**先写清楚状态的事实源、时间语义和优先级，再决定组件怎么画。

### 3. 头像、预览和历史列表的不一致

头像最初由两端各自推导，host 与 browser 得到的结果会分叉。后来以 session id 为 key 持久化映射，头像生成从“每次计算”变成稳定投影。实时会话的预览也不能继续复用陈旧的 `lastActivity`，否则新消息已经来了，列表仍显示旧预览。

“无法渲染数据”“历史列表拉不出来”这类问题，最后都需要拆成三问：

1. host RPC 是否返回了正确的会话事实？
2. client 是否在正确的时机刷新投影？
3. React 是否仍然拥有它正在渲染的节点？

只盯着第三问改 CSS，往往会把真正的 RPC 或状态时序问题掩盖掉。

### 4. UI 对齐问题不是小问题

侧边栏头像与“名称 + 正在输入”错位，顶部头像与名称离得太远，消息气泡颜色不对，输入框和品牌 logo 破坏原 UI，这些问题曾经反复修改。根因通常是把一个有多种状态的区域当成固定高度的图片来调：头像、标题、副标题、时间、typing 和操作按钮实际上需要一个有明确 `flex-shrink`、溢出和对齐规则的布局。

后来改用更小的装饰节点、`flex`/`grid` 明确分栏、文本溢出约束和真实浏览器验收。视觉插件的回归测试至少要覆盖：无皮肤、目标皮肤、深色模式、空列表、长标题、子代理、正在运行、等待批准和新消息到达。

## 第四部分：实际开发问题——Agent Suite 数据与可见性

Agent Suite 的三个包不是三个各自计算成本的功能，而是一条单向数据流：

```text
DSH 生命周期事件
        ↓
ledger：归一化 Receipt，JSONL 持久化，幂等去重
        ↓
monitor：只读汇总、burn rate、预算和诊断
        ↓
archive：只读已结算收据，生成档案和本地游戏化投影
```

### 1. 账本不能只记“成功了多少钱”

流式 chunk 到达时，最终 usage 还没有出现，只能产生 `estimated`；收到最终 assistant message usage 后再合并为 `settled`。没有价格的模型必须显示 `unknown`，不能为了让 UI 好看而伪造成零成本。工具调用也不能简单当作一次 LLM 调用计价；最多只能做有标记的近似归因。

JSONL 追加写入、稳定事件键、幂等合并和重启回放，是为了处理真实开发中会遇到的重复事件、进程中断和 host 重启。账本如果只在内存里看起来正确，一旦重启就丢失，monitor 的漂亮数字没有意义。

### 2. monitor 为什么“装上了却看不到”

Agent Suite 开发中有一段很典型的误解：monitor 一开始被理解成 `dsh-better-sidebar` 的附加插件，安装后找不到数据和入口。后来把它改为独立的 host service + loopback RPC，并通过 DSH 原生 Settings section 和 sidebar tab 暴露。

这里要区分三件事：插件有没有加载、host 有没有数据、client 有没有入口。缺 ledger 时 monitor 应该显示依赖缺失，而不是空白；没有可写的 settings provider 时，页面应该明确显示只读解析值，而不是假装保存成功；不可见的 tab 应暂停轮询，避免为了一个没人看的页面持续触发渲染和 RPC。

### 3. archive 可以有趣，但不能污染账本

archive 的抽卡和积分是本地、不可交易的游戏化投影。它只能读取已结算收据，token 积分有单笔上限，节省策略和对账可以产生额外加成；它不能把账本改成“为了抽卡而记分”的产品。插件的趣味层必须依赖核心事实源，而不是反过来改变核心事实源。

## 第五部分：实际开发问题——Quota Router 路由与 fallback

Quota Router 最初看起来只是“关键词 → 模型 → fallback”。真正实现后，最重要的不是切换模型，而是保存**这一轮为什么选到这里，以及失败后应该沿哪条链继续**。

### 1. 全局来源顺序和任务模型映射必须拆开

同一个便宜模型可能同时是 `coding` 和 `hard-coding` 的第一跳，但两个任务的第二跳不同。如果只记住当前 provider/model，配额失败后无法知道原始任务属于哪条策略。Quota Router 后来把来源 priority 与 `profiles[].modelBySource` 正交化，并为每个 DSH turn 保存 `profileId + candidateIndex`。

这使 fallback 变成一条可审计的有序链，而不是每次失败后重新猜一次：

```text
first-match profile
        ↓
source priority × modelBySource
        ↓
native provider/model validation
        ↓
stable failure：立即前进
transient failure：先重试，达到阈值后 cooldown 再前进
```

### 2. 稳定失败和瞬态失败不能同样处理

配额耗尽、余额不足和 401/403 通常不会靠同一条路的再次重试自行恢复，应立即沿候选链前进。429、5xx、超时和传输中断可能是瞬态问题，应该先交给 DSH 的正常重试；达到阈值后再进入 cooldown 并前进。上下文超限等问题不一定能通过换模型解决，也不能为了“看起来恢复了”而盲目 fallback。

付费、manual 和 emergency 来源默认不自动使用。候选链可以展示它们，但未显式 opt-in 时不能因为前面的免费来源失败就悄悄产生支出。

### 3. 设置页面的预览不是运行时健康检查

Quota Router 的 Settings 页面后来增加了来源排序、profile 映射、模型目录补全和展开后的候选链。这里曾出现过两个方向相反的问题：一方面页面把一些值写死，用户不能真正配置；另一方面页面展示了候选链，容易让人误以为这些 provider/model 当前一定健康。

因此页面必须区分三层：

| 层 | 页面可以说明什么 |
| --- | --- |
| 用户配置 | 来源顺序、profile、模型映射、付费开关、阈值和冷却时间 |
| 插件策略 | first-match、原生校验、失败分类、forward-only、cooldown、ledger |
| DSH 原生层 | provider、凭据、模型目录、能力、adapter retry、上下文压缩 |

配置预览只展示策略展开结果；真实健康状态要由 host 的原生校验、cooldown 和 `quota_router_status` 反馈。保存配置还需要 revision 乐观锁，避免两个页面互相覆盖。

### 4. “真实 fallback”必须在 AgentLoop 里验收

模拟一个函数返回错误，只能证明分类器工作，不能证明 DSH 会在同一轮重新请求。Quota Router 后来补了真实 AgentLoop 验收：检查实际 `agent/request-error` payload、同轮 retry、profile 专属的第二跳和候选耗尽时的原始错误保留。

这也是 preview 插件最容易夸大结果的地方：单测通过、Settings 页面能打开、候选链能显示，都不等于真实 provider failure 下的行为成立。

## 第六部分：自己开发插件时最常见的问题与解决方式

### 1. 把构建产物当成源代码改

ChatLab 和 Agent Suite 都会把 host ESM、client bundle 和包元数据生成到 `lib/`。直接改 `lib/client.js` 可能短暂改变本地页面，却会在下一次 build 消失，也会让 tarball 和源码不一致。正确路径是改 `src/`，执行 build/watch，再做 ModuleLoader 和 npm tarball 预演。

### 2. 只验证开发目录，不验证安装包

monorepo workspace 能解析本地依赖，不代表用户用 `dsh plugin add <tgz>` 安装时也能解析。ChatLab 的 monorepo 启动、skin-feishu host entry、聚合包依赖和 CSS 重建都曾因为这个差异出问题。发布前必须检查 `exports`、patch 文件、bundle 字段、产物清单和干净 profile。

### 3. 把“加载慢”直接归咎于 DSH

插件加载慢可能来自：host 入口等待网络或文件扫描、重复注册、未清理的 watcher、错误的依赖边界、旧进程仍在运行，或者多个插件在启动阶段同步做了太多工作。诊断时先区分：慢在 DSH 加载树、host fiber 初始化、client bundle 下载，还是首屏渲染；不要一看到启动慢就继续往 UI 上加缓存。

### 4. 让错误降级到一条更宽的旧接口

在 provider、凭据和 loopback RPC 这类边界上，明确的 403/权限拒绝不能自动降级到一个权限更宽的旧接口。兼容旧版本可以，但安全错误应该收紧失败，并把原因显示出来。读取接口默认脱敏，含凭证的操作只走受控的本地写端点。

### 5. 没有把状态和资源做成可清理的生命周期

Cordis 管理的 `ctx.effect`、`ctx.on` 等资源可以随 fiber 释放；裸开的 `setInterval`、HTTP/WS 服务、`fs.watch`、子进程和 DOM listener 如果没有 disposer，热更新几次后就会出现重复事件、端口占用、内存增长或一个消息被处理多次。

每个插件都应该能回答：

- 监听器在哪里注册，谁负责取消？
- 定时器和 watcher 在卸载时是否停止？
- client 装饰节点如何删除，重新挂载是否幂等？
- host 重载失败时旧版本是否还能工作？
- 进程重启后哪些状态从文件恢复，哪些状态必须清空？

## 第七部分：Debug 经验与排查顺序

遇到“插件没生效、页面崩了或数据不对”时，我会按下面的顺序排查，而不是先改 CSS：

1. **确认版本和安装来源。** 当前运行的 DSH、profile、包版本、lockfile 和 `lib/` 是否是同一组。
2. **确认加载树。** patch 是否生效，host/client 入口是否都加载，依赖服务是否已经 ready。
3. **确认事实源。** 这是 DSH 原生状态、host 投影、client snapshot，还是插件自己的持久化状态？
4. **确认事件。** 事件从哪条总线来，payload 是否是真实版本的形状，是否重复或乱序。
5. **确认边界。** 是否移动了 React 节点，是否让 client 直接碰了 host 事实，是否绕过了原生 provider/model 校验。
6. **确认生命周期。** 是否有旧进程、旧 bundle、重复 listener、未关闭的 watcher 或旧 RPC 服务。
7. **最后才调样式。** 用无皮肤、空数据、长文本、深色模式、运行中、失败和重载后的真实浏览器状态验收。

测试也应该分层：纯函数锁住状态机和失败分类；fixture 锁住真实 payload；集成测试锁住 host/client/RPC；打包冒烟锁住安装结构；真实 DSH AgentLoop 和浏览器回归才负责证明插件真的接上了宿主。

## 最后：插件的成熟度在失败以后

ChatLab 让我看到，视觉改造也会触及 React 所有权和实时状态源；Agent Suite 让我看到，成本监控必须先建立唯一事实源，UI 只能是投影；Quota Router 让我看到，模型 fallback 的核心不是“换一个模型”，而是保存决策身份、区分失败类型，并把支出边界交还给用户和 DSH 原生层。

所以我现在判断一个 DSH 插件是否成熟，不再只看它能不能显示出来，而看它能不能做到：

- 升级 preview 后知道哪些假设需要重新验证；
- host 和 client 分开更新时不会悄悄混用旧状态；
- 失败时显示原因，而不是静默换路或吞错；
- 重启、热更新和重复事件后仍保持幂等；
- 卸载后不留下 listener、节点、端口和临时文件；
- 页面展示的是可追溯的事实投影，而不是一组看起来合理的数字。

DSH 提供的是一套可组合的积木。自己开发插件真正困难的地方，不是再搭一块 UI，而是让每一块都知道自己从哪里读事实、什么时候可以相信事件、失败时退到哪里，以及离开时如何不留下痕迹。

## 公开资料与关联项目

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
- [dsh-skin-chatlab 源码与安装说明](https://github.com/Liyuk/dsh-skin-chatlab)
- [ChatLab 项目说明](/projects/2026/08/dsh-skin-chatlab/)
- [Quota Router：给 DSH 一条可解释的多源模型 fallback 链](/projects/2026/08/quota-router/)
- [DSH 工作台里的九个插件](/writing/2026/08/dsh-plugin-toolbox/)
- [DSH 的 Cordis 组合与 HMR 教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)
- [Graph Memory 上游仓库](https://github.com/adoresever/graph-memory)（文中的可靠性与预算改动基于本地分叉集成）
- [dsh-model-router 上游仓库](https://github.com/superboy911/dsh-model-router)（文中的 per-rule fallback 基于本地分叉开发）
- [`dsh-mnemon` PR #38：字面 prompt 变量修复](https://github.com/omdsh-dev/dsh-mnemon/pull/38)
- [`dsh-mnemon` PR #32：结构化子代理结果通道加固](https://github.com/omdsh-dev/dsh-mnemon/pull/32)

本文只描述插件架构和工程调试经验，不构成 DSH preview 版本的兼容承诺。发布前仍应以目标版本源码、实际 profile 和真实运行日志为准。
