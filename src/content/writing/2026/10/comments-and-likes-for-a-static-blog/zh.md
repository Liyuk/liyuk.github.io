---
title: 给静态博客补上评论和点赞
description: 记录一个低流量 Astro 博客如何在静态页面旁加入可审核的评论、回复和点赞，以及这套方案的成本与边界。
createdAt: 2026-10-29
draft: true
tags: [technology, community]
publishedAt: 2026-10-29
type: case-study
citationUrls:
  - https://developers.cloudflare.com/pages/functions/bindings/
  - https://developers.cloudflare.com/d1/platform/pricing/
  - https://developers.cloudflare.com/pages/functions/pricing/
  - https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion
  - https://wordpress.org/documentation/article/settings-discussion-screen/
---

# 给静态博客补上评论和点赞

我在整理博客的评论方案时，先问的是一个很实际的问题：浏览量不大，Pages Function 接一个数据库能不能够用，免费的额度会不会很快见底？另一个问题更接近使用体验：GitHub Discussions 虽然省去了自己做存储，但读者要先理解 GitHub 的讨论页面和账号体系，写一条普通评论也有些绕。

这两个问题最后落在同一个取舍上：博客需要一套足够轻的反馈入口，也需要作者能决定什么内容出现在页面上。这里做的不是一个完整社区。评论、回复和点赞都附着在文章页，文章本身仍由 Astro 生成静态页面；只有读者打开互动区域或提交操作时，才请求 Pages Function。

## 页面仍然是静态的，互动才走 API

静态站点不意味着每个功能都必须静态。Cloudflare Pages Functions 可以用 binding 访问 D1；页面继续由 Astro 构建，Function 负责少量读写请求。这样不用把整个博客改成长期运行的应用服务器，也不用额外部署一个独立 Worker 来转发同一批请求。[Cloudflare 的 Pages Functions 文档](https://developers.cloudflare.com/pages/functions/bindings/)把 D1 列为可绑定的资源，开发时 Wrangler 也能在本地提供 D1 binding。

评论组件等到互动区接近视口时再加载列表，避免每篇文章初始渲染都请求评论。API 按文章路径读写数据，中文和英文页面折叠到同一文章键，因此两种语言看到同一组评论和点赞。评论正文在页面端作为文本插入，不解析成 HTML；读者输入的内容不会因为带有标签就被当作页面代码执行。

D1 的免费额度对这个量级看起来相当宽裕。Cloudflare 当前列出的 Workers Free 额度是每天五百万行读取、十万行写入和总计五 GB 存储；Pages Function 请求本身也计入 Workers 请求额度。额度是按行读写等用量核算，并非数据库连接数，所以最终仍应看 dashboard 中这个数据库的实际指标，而不是只数评论条数。[D1 定价说明](https://developers.cloudflare.com/d1/platform/pricing/)和[Pages Functions 定价说明](https://developers.cloudflare.com/pages/functions/pricing/)给出了这些限制。达到免费额度后，D1 的查询会失败；这对小站不是立即要付费的理由，却意味着要留意用量并保留降级路径。

## 先审核，再公开

评论提交后进入 `pending`，公开列表只读取 `approved`。这让站点拥有一个很小但明确的审核边界：陌生人可以留下内容，内容不会自动出现在读者面前。当前审核通过或拒绝是在 D1 里手动操作，没有给作者额外造一个带登录系统的管理后台。小流量阶段，这比先搭一套管理员认证、密码找回和后台权限更省；代价是审核需要查看数据库，而且暂时没有新评论通知。

空昵称会由服务端随机挑一个固定英文名。中文页展示为“匿名 · Alex”一类形式，英文页则是“Anonymous Alex”。名字只用于展示，并不能证明不同评论来自不同的人。喜欢匿名也可以直接留空，不需要额外注册；如果填了昵称，则保留读者输入的昵称。

这套设计把容易惹来垃圾内容的公开入口收紧了一点：正文和昵称有长度限制，评论和点赞按来源 IP 做简单速率限制，跨来源写入请求会被拒绝。数据库只存经过服务端盐值哈希的 IP 标识，用来做限流，不保存原始地址。限流不是身份系统，也抵不住分布式刷量；访客清理浏览器状态后，还可以换一个用于点赞的匿名 token。因此，点赞数是轻量反馈信号，不能当作独立用户数或严肃投票结果。

## 回复可以重复，但只保留一层

社区产品常把回复组织成线程。GitHub Discussions 支持在讨论中回复评论；WordPress 则允许站点配置嵌套评论的层级，最高可以到十层。[GitHub Discussions 的参与说明](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/participating-in-a-discussion)和[WordPress 讨论设置](https://wordpress.org/documentation/article/settings-discussion-screen/)展示了两种常见做法：对话线程，以及可配置深度的嵌套。

博客文章里的讨论通常围绕文章和作者展开。如果每个回复都能继续回复，几轮之后就会出现很多缩进层级，手机上尤其难扫读。于是这里选了一个中间形态：一条已审核的主评论可以有任意多条回复，但回复只能指向主评论，不能回复另一条回复。这样允许围绕一个观点补充或澄清，也把页面结构限制在两层。回复本身同样需要审核；审核后按时间顺序显示在原评论下面。

前端的回复按钮把表单切换成“回复某人”的状态，提交成功只提示等待审核，不乐观地把未审核内容插进公开列表。用户可以取消回复并回到普通评论。这个规则也由 API 校验，而不是只依赖界面：直接构造请求去回复一条回复，会被拒绝。否则隐藏按钮只是视觉约束，不是数据约束。

## 点赞按目标分别记录

点赞有两个目标：文章本身和单条评论。数据表用文章键、目标类型、目标 ID 和浏览器 token 组成唯一键。文章点赞的目标 ID 为空；评论点赞的目标 ID 是评论 ID。唯一约束让同一浏览器对同一目标重复点“喜欢”不会重复计数，取消时删除该行。每条评论的点赞数和文章总点赞数分别查询。

浏览器 token 是随机生成并保存在本地存储的随机值，不携带姓名或账号。它让按钮能显示当前浏览器是否点过赞，也让数据库能够去重；它不是可靠的用户身份。换设备、清理本地数据或主动伪造请求都能绕过这一层，所以这里的点赞目标是降低误触重复和表达轻量认可，而不是抵抗有意作弊。

## 边界要留在设计里

目前生产站点仍保留 Giscus，新的 D1 评论实现只在独立预览环境接入。这样可以先检验界面、回复规则、审核流程和读者路径，不把一个尚未跑过真实生产周期的互动系统直接切换给所有访客。以后若要替换，迁移数据、通知作者、删除垃圾评论、备份恢复和故障时如何隐藏入口都需要单独决定。

这套实现适合评论量低、作者愿意手动审核、并且可以接受匿名点赞弱校验的个人博客。它不提供用户账号、邮件提醒、举报队列、封禁名单、搜索或完整的版主管理界面。评论量变大时，人工审核会先于 D1 的免费额度成为瓶颈；出现骚扰或垃圾内容时，简单的 IP 限流也不足以应付。那时应先补审核和治理流程，再考虑换数据库或扩容。

对这类站点来说，免费的数据库额度解决的是“能不能存”的问题，互动规则解决的才是“存下来的东西如何公开”。页面保持静态、写入默认待审核、回复不无限嵌套、点赞只作为弱信号，这几条合在一起，才构成一个可以先小规模运行的评论系统。
