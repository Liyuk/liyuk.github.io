---
title: "dsh-skin-chatlab 2.x：把 DSH Web 变成可切换的聊天工作台"
description: 从一套飞书视觉适配扩展到六套独立皮肤，并补齐聚合加载、头像身份收敛、部分安装回退和可卸载边界。
locale: zh-CN
translationStatus: original
createdAt: 2026-08-21
publishedAt: 2026-08-21
updatedAt: 2026-08-21
status: active
repositoryUrl: https://github.com/Liyuk/dsh-skin-chatlab
hero:
  src: /images/projects/dsh-skin-chatlab/overview-light.webp
  alt: DSH Web 在飞书皮肤下的聊天工作台截图
  caption: 飞书皮肤下的项目组、联系人会话列表和聊天输入区。
draft: false
tags: [technology, agent-systems, developer-productivity]
---

[在 GitHub 查看项目与安装说明 ↗](https://github.com/Liyuk/dsh-skin-chatlab)

这次升级解决的不是“换一套颜色”，而是把 dsh-skin-chatlab 从一套飞书适配，推进成一个真正可扩展的聊天皮肤系统：同一个 DSH Web 工作台，现在可以切换飞书、Slack、企业微信、钉钉、Telegram 和 WhatsApp 六套视觉语言。

## 现在具备什么能力

- 基座与皮肤包分离：core 负责注册、切换、DOM 装饰、预览和未读状态；皮肤包只负责 token、CSS 和品牌标记。
- 六个独立 npm 皮肤包：可以全部安装，也可以只安装需要的几套。
- 聚合包自动加载全部 bundle：`@liyuk/dsh-skin-chatlab` 现在带有 bundle patch，会把 core 和六套皮肤一起加入 `dsh.profile.bundles`。
- 项目组和联系人化：左侧项目文件夹改成各皮肤自己的项目图标，会话行拥有头像、最近回复预览、未读提示和运行状态。
- 聊天输入区品牌化：输入框外框、工具栏、发送按钮、focus、hover 和 active 动效按品牌分别表达，且不覆盖宿主原有尺寸与 padding。
- 可卸载：选择“无皮肤”会清理样式、头像、预览、状态节点和 HTML 标记，恢复 DSH 默认外观。
- 部分加载有边界保护：偏好指向尚未安装的皮肤时，core 会回退到已经 ready 的皮肤；皮肤晚于 core 注册也会自动激活。

这次升级把“皮肤”从一组页面样式变成了一个有生命周期的插件：注册、激活、刷新、切换和卸载都有明确的边界。core 不拥有任何品牌视觉，皮肤也不直接接管 DSH Web 的 React 状态；两者通过 registry、session snapshot 和少量由 core 创建的 DOM 节点协作。

![当前运行中的飞书皮肤：项目组、联系人、未读点和输入区](/images/projects/dsh-skin-chatlab/runtime-feishu.png)

## 六套皮肤不是六份复制品

六个包共享相同的 DSH 数据边界，但不共享同一套产品语汇：

| 皮肤 | 视觉方向 | 输入区动作 |
| --- | --- | --- |
| 飞书 | 克制的蓝色、8px 编辑器、轻 focus ring | 发送按钮轻微上浮 |
| Slack | 方角、紫色、紧凑工作区 | hover 提亮，不做明显位移 |
| 企业微信 | 绿色、企业通讯录密度 | hover 出现绿色柔和阴影 |
| 钉钉 | 蓝色、卡片式层级 | active 时轻微缩放 |
| Telegram | 大圆角、圆形工具按钮 | 发送按钮向右滑入 |
| WhatsApp | 暖灰背景、绿色注意力 | 发送按钮上浮并带绿色阴影 |

![设置面板中已加载的六套皮肤](/images/projects/dsh-skin-chatlab/settings-all-skins.png)

这些差异是 CSS projection，不伪造频道、线程、反应、在线状态、真实送达或通话能力。数据仍然来自 DSH 已有的 session、turn 和 loopback RPC。

## 头像为什么曾经会“点击后换一张”

这是一个身份收敛问题，而不是头像组件随机失控。

某些 blank 会话行第一次还没有可靠的 session id，只能用标题生成临时头像；用户点击它之后，React 加上 selected 状态，core 才能把这行认领到当前 session id。如果这时直接用 id 重新生成 URL，头像就会跳变。

现在的处理是：当 blank 行第一次绑定到真实 session id 时，沿用当前已经显示的图片 URL，并把它迁移到 `sessionId → avatar URL` 的持久化映射表。之后侧栏和聊天顶栏都从这张表取同一张头像，点击不会再换脸；如果 React 复用了一行到另一个会话，则会先清理旧身份状态，避免串头像。

这也修掉了两个容易一起出现的边界问题：重新渲染时不会把旧会话的头像带到新行，卸载皮肤后也不会留下头像节点、状态 class 或品牌属性。换句话说，皮肤可以改变视觉投影，但不能把一次临时识别结果变成永久的错误身份。

## 一次刷新里发生了什么

当前的刷新路径可以压缩成四步：

1. core 读取 registry 和 DSH 的 session snapshot，确认当前可用的皮肤与会话边界。
2. 根据偏好选择 ready 皮肤；如果偏好对应的包尚未安装，则回退到可用皮肤，而不是留下半套样式。
3. 皮肤为项目组、会话行和 composer 做 CSS projection，并把预览、未读和运行状态写入自己拥有的节点。
4. refresh 结束后批量保存头像映射，下一轮刷新复用稳定身份。

这个顺序很重要：先确认身份和可用能力，再做视觉更新。否则就会出现“样式已经切过去了，但数据还属于上一行”或“偏好存在，但对应 CSS 尚未加载”的中间态。

## React 边界和性能

DSH Web 是 React 应用，皮肤没有使用全局 MutationObserver，也不移动 React 管理的节点。core 只 append 自己的节点，布局由 CSS Grid 和皮肤 CSS 完成。

性能上，当前实现有三个约束：

1. 只注入当前选中的一份皮肤 CSS；不会把六套规则同时挂到页面。
2. registry 和 session 列表刷新通过 300ms timer 合并；预览 RPC 使用 single-flight 和 8 秒超时，避免轮询叠加请求。
3. 头像映射延迟到一轮 refresh 结束后批量写入 localStorage，并限制最多 200 条。

当前测试覆盖 101 个断言，包括 core-only、只加载部分皮肤、未安装皮肤 fallback、皮肤晚注册、React 行复用和头像身份收敛；六套 client bundle 和聚合 bundle patch 均通过构建检查。

## 这次没有做什么

项目刻意没有模拟真实 IM 的能力：不会凭空增加频道、线程、反应、在线状态、送达回执或通话，也不会为了让界面“更像”某个平台而改写 DSH 的 session、turn 和 loopback RPC。这样做让升级可以独立部署，也让卸载后恢复默认外观变得可验证。

## 安装

推荐安装聚合包：

```sh
dsh plugin --profile web add @liyuk/dsh-skin-chatlab
```

它会安装并加载 core 与六套皮肤。开发本地版本时，也可以把各个包以 `link:` 加到 profile；修改源码后执行 `npm run build`，再重启 `dsh web`。

如果只想加载部分皮肤：

```sh
dsh plugin --profile web add \
  @liyuk/dsh-skin-chatlab-core \
  @liyuk/dsh-skin-feishu \
  @liyuk/dsh-skin-slack
```

## 发布顺序

包之间有明确依赖，发布顺序是：

```text
core → feishu → slack → wecom → dingtalk → telegram → whatsapp → chatlab
```

发布前先构建和 dry-run，确认无误后再执行正式发布。仓库里的 `scripts/publish.mjs` 已按这个顺序批量执行。

这套项目最重要的能力，不是把 DSH 伪装成某一个 IM，而是在不修改 React 宿主和已有插件的前提下，把“数据能力”和“视觉表达”拆开：同一份会话、预览、未读和运行状态，可以被多个皮肤安全地重新解释。
