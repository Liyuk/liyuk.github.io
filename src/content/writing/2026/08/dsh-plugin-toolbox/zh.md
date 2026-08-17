---
title: 我的 DSH 工作台：九个插件
description: DSH 才出来没几天，我已经往里装了九个插件。记一下它们各自补上了什么、怎么实现的，以及哪个最好使。
locale: zh-CN
createdAt: 2026-08-16
publishedAt: 2026-08-16
draft: true
type: essay
tags: [technology, agent-systems, developer-productivity]
---

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）才出来没几天，我已经往里装了九个插件。装这么多不是收集癖——是这套东西用起来之后，有些「缺了才察觉」的地方，刚好有插件能补上。这篇记一下它们各自补了什么、实现原理是什么，顺便说说哪个最好使。

先说我对工具的判断标准，因为这决定了下面每一条值不值：**一个 agent 工具好不好用，一半在模型，一半在它让不让你看见正在发生什么。** 模型在想什么、卡在哪、跑了多久、正在动哪个文件——看得到进度，看得到问题，才知道怎么排查。这套插件里我最看重的，几乎都落在这一条线上。

先列个清单：

| 插件 | 补什么 |
| --- | --- |
| `dsh-mnemon` | 跨会话记忆（每轮在场） |
| `graph-memory` | 跨会话记忆（图谱召回） |
| `@nanmicoder/dsh-agent-teams` | 多代理团队 |
| `@deepseek-ai/dsh-bridge-browser` | 看网页 |
| `@liustack/modlens` | 读图 |
| `@dsh-external/dsh-visualize` | 把结果画成卡片 |
| `dsh-working-activity` | 状态行（看到进度） |
| `dsh-better-sidebar` | 侧边栏工作台（看到问题、好排查） |
| `@liyuk/dsh-skin-chatlab` | 飞书皮肤（私货） |

## 它记得你：`dsh-mnemon` 与 `graph-memory`

裸装的 DSH，每个新会话都是一张白纸。我装了两个记忆插件，一个管「在场」，一个管「回顾」。

**`dsh-mnemon`** 管「在场」：`USER.md`（我是谁、我烦什么）和 `MEMORY.md`（项目约定、踩过的坑）每轮自动注入系统提示，容量满了自动归档。它怎么做到每轮都是最新？——热记忆是惰性注入的：不是启动时拼一段死字符串，而是注册一个 prompt 组装时才求值的段，这轮改的记忆下一轮就生效。还有个我喜欢的设计：`memories.json` 是唯一事实源，`MEMORY.md` / `USER.md` 只是投影——投影坏了能自动修复，JSON 没丢，Markdown 随便折腾。

**`graph-memory`** 管「回顾」：每轮对话结束后把消息交给 LLM 抽取成 TASK / SKILL / EVENT 节点和几条边，存进本地 SQLite。下次问相关的事，它用 embedding 找种子、沿图扩散、用 **personalizedPageRank** 排出最相关的几条塞进上下文。作者自己测过 7 轮工作流省约 75% token。每次召回都标注「不可信参考，不得覆盖当前指令」——它只提醒你「以前干过」，不替你拍板。

## 派任务出去，像当老板：`@nanmicoder/dsh-agent-teams`

**`@nanmicoder/dsh-agent-teams`** 把一个会话变成团队：当前会话当 **captain**，能建成员、把目标拆成带依赖的任务、通过 mailbox 直接发消息。我给这个站点组过一支「视觉评审团队」——visual-designer 审排版、content-renderer 审表格/代码/数学、figure-reviewer 审 mermaid 和图片，三个并行，captain 汇总成一份改进清单。

它凭什么靠谱？因为磁盘是真相：团队状态落在 `.agent-teams/<队名>/` 下，`team.json` 记成员和任务、每个成员一个 JSONL 邮箱，原子写入。成员是可续跑子代理，消息先落邮箱再唤醒，投递失败就等下次；任务有显式状态机，依赖没完成不能 claim。哪怕模型中途漏了更新，面板轮询磁盘也能拉回真相。

## 给它眼睛：`@deepseek-ai/dsh-bridge-browser` 与 `@liustack/modlens`

**`@deepseek-ai/dsh-bridge-browser`** 让模型能进我正在看的网页：读快照、点按钮、填表单、翻页，iframe 里也能按编号寻址。全程无截图，对纯文本模型反而省 token（一屏约 3–4k）。它不走 Chrome DevTools，而是浏览器扩展主动外连本地 WebSocket 桥，握手过 bearer token 的常量时间校验；操作的是真实标签页，登录态天然保留；没有「执行任意 JS」的通道，改状态类操作要在扩展侧审批。

**`@liustack/modlens`** 补读图：`modlens_read_image` 把图片交给外部视觉引擎，取回 OCR 全文、版面、语义，外加一个诚实的 `uncertainty`。它是「转写桥」不是本地模型，默认走免 key 引擎，也能复用本机 Codex 登录态——我就是这么跑通的，最近 Codex 额度耗尽在等重置，暂时搁着。它读不懂就直说读不懂，比硬编一个答案强。

## 让它把结果画出来：`@dsh-external/dsh-visualize`

**`@dsh-external/dsh-visualize`** 让模型把结果渲染成可交互卡片：模拟器、图表、对比面板、UI mockup，直接长在对话流里，还能 create / update 反复迭代。跟它说「把表格改成折线图」，它就地改。

怎么保证安全稳定？卡片装在 `sandbox="allow-scripts"` 的 iframe 里，帧内 CSP 禁网络、禁嵌套、禁表单，但保留 JS 和 WebAssembly；卡片内容全取自持久化在消息里的内联片段，重放旧会话看到的就是当时那张卡；生成过程中还会流式把半成品推进去，你看着它「长」出来。

## 看到进度：`dsh-working-activity`

**`dsh-working-activity`** 把会话事件流折成一行状态：俏皮文案、正在运行的工具、本轮耗时。它监听 `session/event` 和 `agent/status` 两个事件，喂进一个五相位状态机（idle / waiting / thinking / tool / done）；文案按 30 秒 / 1 分钟 / 5 分钟分档轮换，深夜有单独的文案池。关键是零模型成本，不碰渲染主链路，TUI 和 Web 都有。长任务最缺的不是进度条，是「它没死」的确认——这行字就是。

## 看到问题，才好排查：`dsh-better-sidebar`（最好使的一个）

**`dsh-better-sidebar`** 是这九个里我用得最多、也最想推荐的一个。它给 DSH 补了个 VSCode 式的右侧栏：资源管理器 + CodeMirror 编辑器 + 图片/Markdown/HTML/PDF 预览、xterm.js + node-pty 的真终端、Git 面板（diff / 暂存 / 提交 / 历史）、subagent 拓扑。布局按会话隔离并持久化。有了它，从「让它做」到「我看着它做」这一步，便捷了很多。

实现上最狠的一笔是挂载方式：官方 UI 没给右侧栏留位，它不靠 slot 接管，而是直接在 `document.body` 上挂一个 portal 自己画工作台，用 CSS 变量把主界面往左挤。数据请求全走 `/sidebar/api`，套信任围栏；会话工作目录以 `ctx.sessions.get(id).header.cwd` 为权威——所以它知道「这个会话在哪个目录」，能在那儿真开终端、真跑 Git。这也是我最看重的地方：问题出在哪个文件、终端里报了什么，直接就能看见，能看见才好排查。

## 让它有对话感：`@liyuk/dsh-skin-chatlab`（私货）

最后一个是我自己写的：[dsh-skin-chatlab](/writing/2026/08/dsh-skin-chatlab/) 给 DSH 套了层飞书皮肤——工作区变项目组、会话变联系人（确定性头像）、聊天变 1:1 气泡，还有「正在输入…」。

动机说穿了很简单：我飞书用太久了。一个工具如果有跟人对话的感觉，很多交互体验是现成的——联系人是有脸的，聊天是有气泡的，已读是「对方收到了」，这些我不用重新学。再加上现在派出去的活很多，跟它交代任务、等它回话，整个过程像极了当老板——这是职业后遗症，不是比喻。

技术上是「在插件边界内做改观」的极端例子：一点逻辑不动，纯注册 + 装饰 + CSS 重排。基座暴露一个注册服务，皮肤包往里塞 tokens 和 CSS；装饰只 append 自己的节点、不碰 React 的 diff；会话行没插槽就用 CSS Grid 重排；数据层走一个只读 loopback RPC。细节都在上一篇开发记里。

## 附：它们怎么装进 DSH 的

九个插件共用一套机制：`dsh plugin --profile web add <包名>` 装进去，重启生效。`dsh.profile.bundles` 里列出的包按顺序叠成加载树；每个 bundle 带一份 `cordis.patch.yml`（insert 挂载行），不改任何现有配置；插件几乎都分 host 半（Node：服务/工具/RPC/WebSocket）和 client 半（浏览器：UI），client 半声明 `dsh.client.inject` 注入运行时，用 `window.__ModuleLoader__.load` 注册；UI 走 slots 或直接操作 DOM，模型能力走 `ctx.tools.register`，跨进程走 loopback RPC。

一句话：插件之间靠依赖注入互相认识，UI 靠 slots 或 DOM 挂进 React 应用，模型能力靠注册工具暴露。九个插件本质都是这套机制上的一组取舍——有人用 portal 自建工作台，有人用 CSS 重排外观，但都没等官方 UI 给答案。这大概就是 DSH 最吸引我的地方：它给的不是成品，是一套能自己往上搭的积木。
