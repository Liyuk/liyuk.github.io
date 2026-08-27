// Central i18n for the site. `i18n(locale)` returns the language pack for the
// given locale, spread flat alongside a `locale` code:
//
//   const ui = i18n(locale);                 // locale: 'en' | 'zh'
//   ui.navigation.writing                    // plain string
//   ui.entry.readingMinutes(5)               // function interpolation
//   ui.page.home.title                       // nested page copy
//
// Language packs are keyed by short code ('zh', 'en'). A pack holds both UI
// chrome (navigation, theme, entry labels) and page copy (titles,
// descriptions, archives) under a `page` namespace. Unknown locales fall back
// to Chinese.
import { site } from '../data/site.mjs';

export const dict = {
  zh: {
    name: site.name,
    brand: site.brand,
    brandShort: '沉默土豆',
    navigation: { writing: '写作', columns: '专栏', projects: '项目', research: '研究', photos: '影像', about: '关于', consulting: '咨询', links: '友链', start: '开始', tags: '标签', search: '搜索', main: '主导航', menu: '菜单', menuOpen: '打开菜单', menuClose: '关闭菜单' },
    language: { current: '中文', alternate: 'EN' },
    theme: { toDark: '切换为深色模式', toLight: '切换为浅色模式' },
    accessibility: { home: 'Liyuk 首页', siteSettings: '站点设置', skipToContent: '跳到正文' },
    footer: { publishedOpenly: '缓慢构建，公开发布。', rss: '订阅 RSS', nameMark: '。', license: 'CC BY-NC-SA 4.0', elsewhere: '在别处', email: '邮箱', github: 'GitHub', x: 'X', linkedin: 'LinkedIn' },
    entry: {
      updatedAt: '更新于',
      publishedAt: '发布于',
      readingMinutes: (n) => `约 ${n} 分钟阅读`,
      readFull: '阅读全文',
      columnIn: (label, order) => `收录于专栏 ${label} · 第 ${order} 篇`,
      tagsAria: '标签',
      columnChaptersAria: '专栏章节导航',
    },
    column: { eyebrow: '专栏', count: (n) => `${n} 篇`, current: '本篇' },
    pagination: { label: '列表分页', prev: '← 上一页', next: '下一页 →', status: (page, total) => `第 ${page} 页 · 共 ${total} 页`, pageTitleSuffix: (page) => ` · 第 ${page} 页` },
    postNav: { prev: '← 上一篇', next: '下一篇 →' },
    share: { shareLabel: '分享', shareTo: '分享到', saveLabel: '收藏', system: '系统分享', x: 'X', linkedin: 'LinkedIn', facebook: 'Facebook', telegram: 'Telegram', whatsapp: 'WhatsApp', weibo: '微博', wechat: '微信', favorite: '收藏', favorited: '已收藏', favoriteAdded: '已收藏，可在收藏页查看', favoriteRemoved: '已取消收藏', copy: '复制链接', copied: '已复制', wechatModalTitle: '用微信扫一扫', wechatModalDesc: '在手机上打开这篇文章，或转发给朋友。', wechatModalClose: '关闭' },
    favorites: { label: '收藏', metaTitle: '收藏 — 沉默土豆的烹饪指南', metaDescription: '收藏起来的文章。', title: ['收起来的，', '慢慢读。'], description: '在这里读回你收藏过的内容。', empty: '还没有收藏任何内容。', emptyHint: '在文章页底部点「收藏」，就会出现在这里。', remove: '移除', clearAll: '清空全部', savedAt: '收藏于', types: { writing: '写作', research: '研究', project: '项目', gallery: '影像' } },
    toc: { label: '目录', aria: '文章目录' },
    subscribe: { prompt: '喜欢这个站？', emailPlaceholder: '你的邮箱', submit: '订阅邮件', or: '或', cta: '订阅 RSS' },
    count: { photos: (n) => `${n} 张照片` },
    photosLoadMore: { label: '加载更多', done: '已全部展示' },
    gallery: {
      carouselAria: (title) => `${title} 图片轮播`,
      previous: '← 上一张',
      next: '下一张 →',
      previousAria: '上一张照片',
      nextAria: '下一张照片',
      selectAria: '选择照片',
      viewPhotoAria: (n, alt) => `查看第 ${n} 张：${alt}`,
    },
    tip: {
      eyebrow: '打赏',
      title: '如果这篇文章对你有帮助',
      action: '请我喝杯咖啡',
      description: '如果这篇文章对你有帮助，请我喝杯咖啡吧——你的支持让我有动力继续写下去。',
      wechat: '微信',
      alipay: '支付宝',
      paypal: 'PayPal',
      note: '感谢支持，量力而行。',
    },
    projectTip: {
      eyebrow: '打赏',
      title: '如果这个项目对你有帮助',
      action: '请我喝杯咖啡',
      description: '如果这个项目对你有帮助，请我喝杯咖啡吧——你的支持能让我把它维护得更久。',
      wechat: '微信',
      alipay: '支付宝',
      paypal: 'PayPal',
      note: '感谢支持，量力而行。',
    },
    page: {
      home: { metaTitle: '沉默土豆的烹饪指南 — Liyuk', eyebrow: '独立工作，持续进行', title: ['沉默土豆的', '烹饪指南。'], byline: 'Liyuk · 关于技术、领导力与日常的现场笔记', description: '这里记录技术、产品、领导力与日常观察；也是项目、研究和摄影慢慢汇合的地方。', aboutLink: '关于我', contact: '联系我', writing: { eyebrow: '01 / 写作', title: ['从工作中来，', '回到清晰的表达。'], link: '查看全部写作', empty: '写作档案正在整理。', featured: '推荐阅读', latest: '最新发布', archiveHint: (n) => `共 ${n} 篇 · 按年归档` }, practices: { projects: { label: '02 / 项目', title: '从问题到可以打开的东西。', description: '产品、工具和正在进行的实验。', count: (n) => `${n} 项` }, research: { label: '03 / 研究', title: '为尚未解决的问题保留空间。', description: '论文、研究笔记与演讲。', count: (n) => `${n} 篇` }, consulting: { label: '04 / 合作', title: '把复杂的职业问题，谈清楚。', description: '一对一咨询与专项顾问，从简历到管理成长。', cta: '查看咨询服务' }, photos: { label: '05 / 影像', title: '在屏幕之外，继续观察。', description: '照片与现场笔记。', count: (n) => `${n} 个图集` } }, start: { eyebrow: '阅读入口', title: '不知道从哪里开始？', description: '按你正在处理的问题，进入一条更短、更有顺序的阅读路径。', link: '从这里开始' }, practiceGridAria: '内容领域' },
      writing: { label: '写作', metaTitle: '写作 — 沉默土豆的烹饪指南', metaDescription: '关于技术、工作与日常的写作。', title: ['把经验变成', '可以分享的判断。'], description: '技术、工作与领导力，以及不急于归类的现场笔记。' },
      projects: { label: '项目', metaTitle: '项目 — 沉默土豆的烹饪指南', metaDescription: '产品、工具和正在进行的实验。', title: ['从想法到', '可以被使用的东西。'], description: '项目案例会随着公开工作逐步加入。这里保留问题、判断、过程与成果，而不只是技术清单。', read: '去阅读', view: '查看项目' },
      research: { label: '研究', metaTitle: '研究 — 沉默土豆的烹饪指南', metaDescription: '研究笔记、论文与公开演讲。', title: ['给问题足够的时间，', '也给答案留下证据。'], description: '论文、研究笔记、演讲和可复现的工作会在这里沉淀。' },
      photos: { label: '影像 / 现场笔记', metaTitle: '影像 — 沉默土豆的烹饪指南', metaDescription: 'Liyuk 的摄影与现场笔记。', title: ['在屏幕之外，', '继续看见。'], description: '这里会是挑选过的摄影系列，而不是一条无限刷新的图片流。', placeholder: '正在整理的摄影系列。', placeholderLabel: '摄影作品即将发布' },
      about: { label: '关于', metaTitle: '关于 — 沉默土豆的烹饪指南', metaDescription: 'Liyuk：工程师、传播者，也用工作流写小说。在这里分享技术、领导力与日常的现场笔记。', title: ['把经验变成', '可以传播的东西。'], description: '我关注系统如何被构建、产品如何被理解、人是如何被理解的，以及复杂经验如何变成更清楚的表达。', intro: '我是一名工程师，做过技术管理、带过团队，也在研究和实践 AI 如何改变工程。这个站点是我分享这些经验、观察与创作的地方——只发自己真正想承担的内容。', stats: (writing, research, projects, zh, en) => `写作 ${writing} 篇 · 研究 ${research} 篇 · 项目 ${projects} 项 · 全站中文约 ${zh} 字 / 英文约 ${en} 词`, mapEyebrow: '站内导览', mapTitle: '四类内容，四个入口', map: { writing: { title: '写作', desc: '对经验的整理——技术、领导力与现场笔记。', url: '/writing/' }, projects: { title: '项目', desc: '从问题到产物——工具、实验与正在做的事。', url: '/projects/' }, research: { title: '研究', desc: '尚未收束的问题——论文、研究笔记与协议。', url: '/research/' }, consulting: { title: '咨询', desc: '面向个人的职业与管理判断咨询。', url: '/consulting/' } }, fictionEyebrow: '小说创作', fictionTitle: '两本小说，公开连载', fictionDesc: '我也写小说，笔名「盗火的魔法师」。用一套可审计的工作流在真实平台连载。', fictionNovels: [{ title: '《愿望之后》', desc: '沙海、商路与一群各怀心愿的旅伴——愿望从不保证幸福。', url: '/projects/2026/08/novel-yuanwang-zhihou/' }, { title: '《盼东归》', desc: '长命锁、潼关与一场东行——普通人能不能不被命运决定。', url: '/projects/2026/08/novel-pandonggui/' }], boundaryEyebrow: '边界', boundary: '公开分享的写作和作品都已脱敏；涉及具体业务、内部数据或个人隐私的部分会留在私档，不在这里展开。', contactEyebrow: '联系', contactTitle: '找到我', guestbookEyebrow: '留言', guestbookTitle: '给我留言', guestbookDesc: '有什么想说的，或想交流的，可以留在这里。需要 GitHub 账号登录。', cooperateEyebrow: '合作', cooperateTitle: '专业合作', cooperateDesc: '我可以提供以下专业合作，通常以邮件开始沟通：', cooperateItems: [{ title: '工程与 AI 咨询', desc: '关于 AI 如何改变工程、技术团队建设与系统设计的判断与建议。' }, { title: '技术管理顾问', desc: '团队成长、绩效与度量体系、工程管理的一对一或团队顾问。' }, { title: '写作与表达', desc: '把复杂的技术与管理经验整理成清晰、可传播的表达。' }] },
      consulting: { label: '咨询', metaTitle: '职业发展与职场咨询 — 沉默土豆的烹饪指南', metaDescription: '面向学生、工程师和管理者的职业发展、面试、管理与工作决策咨询。', title: ['职业发展与', '职场咨询。'], description: '把复杂的职业经历，整理成更清楚的选择和下一步。', intro: '我提供少量一对一咨询与专项顾问服务。你可以带着一份简历、一个岗位、一场面试，或一个正在犹豫的工作决定来；我们一起把背景、问题、选择和下一步说清楚。', servicesEyebrow: '可以讨论什么', servicesTitle: '从一个具体问题开始', services: [{ title: '校招与早期职业', description: '简历诊断、实习与校招方向、offer 选择，以及进入职场后的第一步。' }, { title: '面试与求职准备', description: '围绕目标岗位拆解 JD，重组项目经历，准备自我介绍、行为问题和技术/管理案例，并进行模拟面试。' }, { title: '职业路径与晋升', description: '梳理当前选择、长期目标、转型成本和下一步可以验证的机会，也可以准备晋升或跳槽。' }, { title: '转管理与管理者成长', description: '讨论从个人贡献者到管理者的角色变化、反馈沟通、团队协作、决策权和工作边界。' }, { title: '工程团队与技术判断', description: '针对团队职责、工程协作、技术规划和产品判断，提供结构化的第二意见。' }], formatEyebrow: '服务方式', formatTitle: '一次解决一个问题，也可以做专项方案', formatDescription: '单次咨询适合一个边界清楚的问题。面试辅导会在会前阅读简历与目标 JD，交流中进行模拟和追问，结束后给出复盘建议；复杂的职业转型、管理成长或团队问题，可以设计多次咨询、90 天计划或书面分析。', pricingEyebrow: '收费', pricingTitle: '按对象和复杂度确认', pricingDescription: '校招与早期职业服务 ¥499 起；3 年以上工程师的面试与职业咨询通常为 ¥1,200–2,000 / 60分钟；高级工程师、Tech Lead 与管理岗位通常为 ¥2,000–3,500 / 60分钟。需要大量材料审阅、书面方案或多次跟进的服务，按项目另行确认。', contactEyebrow: '联系', contactTitle: '如果你正卡在一个具体问题上', contactDescription: '请发送邮件至 hello@liyuk.com，简单介绍你的背景、目标岗位或工作问题，并附上希望讨论的内容和可用时间。我会先确认是否适合，以及应该采用单次咨询还是专项方案。', contactAction: '发送邮件', availabilityNote: '目前仅接受咨询、顾问与交流合作，暂不承接需要建立雇佣关系的全职机会。', locationNote: '旧金山湾区，太平洋时间（PT）。' },
      links: { label: '友链', metaTitle: '友链 — 沉默土豆的烹饪指南', metaDescription: '我常读、也愿意推荐的独立博客与站点。', title: ['我读的人，', '也值得你读。'], description: '这里是我常读、也愿意推荐的独立博客与站点。它们大多是持续写作的个人空间，按自己的节奏生长，而不是一条无限刷新的信息流。', friendsEyebrow: '朋友们的站点', friendsTitle: '常读的站点', visit: '访问', applyEyebrow: '申请友链', applyTitle: '想加进这里？', applyDesc: '如果你也经营一个独立博客，欢迎互换友链。规则很简单：', applyRules: ['原创优先——持续写作的个人站点，不是采集站或纯营销页。', '站点稳定可访问，内容基本原创。', '先在你的站点加上本站（liyuk.com），再来申请。', '留言时附上：站名、链接、一句话介绍（可选头像）。'], applyChannels: '加好后，来留言板留言，或直接发邮件。', applyGuestbook: '去留言板', applyEmail: '发邮件' },
      notFound: { metaTitle: '页面未找到 — 沉默土豆的烹饪指南', metaDescription: '你访问的页面不存在或已被移动。', title: '这个页面还没有出现。', returnHome: '回到首页' },
      rss: { title: '沉默土豆的烹饪指南', description: 'Liyuk 关于技术、工作与日常的写作。' },
      writingArchive: { eyebrow: '写作归档', yearSuffix: '年', monthSuffix: '月', description: '按创作时间整理的文章。', metaTitle: (year, suffix, brand) => `${year}${suffix}写作归档 — ${brand}`, title: (year, suffix) => `${year}${suffix}的写作。`, titleMonth: (year, suffix, month, monthSuffix) => `${year}${suffix}${month}${monthSuffix}的写作。` },
      columns: { eyebrow: '专栏', title: ['把散落的内容，', '读成一套判断。'], description: '专栏是一条由作者编排、按推荐顺序阅读的路径；它与标签索引并行，但提供更完整的阅读体验。', seriesLabel: '系列专栏', count: (n) => `${n} 篇 · 按顺序阅读` },
      columnsDetail: { eyebrow: '专栏', chapterCount: (n) => `第 ${n} 篇`, chaptersAria: (label) => `${label} 章节目录`, title: (label) => `${label} — 专栏 — ${'沉默土豆的烹饪指南'}`, viewDirectory: (label) => `查看专栏《${label}》目录`, prev: (title) => `← 上一篇：${title}`, next: (title) => `下一篇：${title} →`, empty: '这个专栏还没有公开内容，第一篇文章正在整理。', chapterDate: (created, updated) => updated ? `${created} · ${updated}` : created },
      writingDetail: { relatedEyebrow: '继续阅读', relatedTitle: '也许和这篇有关。' },
      tags: { eyebrow: '标签', title: ['沿着一个问题，', '读得更深一点。'], description: '标签把写作、研究、项目与影像放到同一条索引里；只显示至少有三项内容的标签。', count: (n) => `${n} 篇`, detailDescription: (label) => `围绕“${label}”的写作、研究、项目与影像。` },
      projectsDetail: { work: '作品', project: '项目', collectedAt: '收录于', startedAt: '开始于', read: '去阅读', github: 'GitHub', systemDesignPaper: '系统设计论文', coverPlaceholder: '封面待补', coverAlt: (title) => `《${title}》封面`, viewOnGithub: '在 GitHub 查看' },
      researchDetail: { versionDate: '发布于', readPaper: '在 GitHub 阅读完整论文', repo: '项目仓库' },
      projectArchive: { eyebrow: '项目归档', description: '按开始时间整理的项目。', metaTitle: (year, brand) => `${year}年项目归档 — ${brand}`, title: (year) => `${year}年的项目。`, titleMonth: (year, month) => `${year}年${month}月的项目。` },
      researchArchive: { eyebrow: '研究归档', description: '按版本日期整理的研究。', metaTitle: (year, brand) => `${year}年研究归档 — ${brand}`, title: (year) => `${year}年的研究。`, titleMonth: (year, month) => `${year}年${month}月的研究。` },
      search: { eyebrow: '搜索', metaTitle: '搜索 — 沉默土豆的烹饪指南', metaDescription: '搜索站内文章、摘要、正文和标签。', title: ['从已经写下的，', '继续往前找。'], description: '搜索标题、摘要、正文与标签。', label: '搜索文章与标签', placeholder: '例如：职业成长、指标、前端', status: (n) => `找到 ${n} 篇相关内容。`, statusTemplate: '找到 {{n}} 篇相关内容。' },
      start: { eyebrow: '从这里开始', metaTitle: '从这里开始 — 沉默土豆的烹饪指南', metaDescription: '为不同问题准备的阅读入口。', title: ['先找到你正在想的，', '再决定从哪一篇读起。'], description: '这不是内容总目录，而是按目标分组的阅读路径：先找到你面对的问题，再从对应专栏按顺序读起。', howToRead: '这个站有三种读法：想系统地学一个主题，跟着下面的专栏按顺序读；想沿着一个问题横向翻，去标签索引；想直接找某个词，去搜索。', anchor: { eyebrow: '先读这一篇', title: '管理复盘：从执行到系统的八个判断', url: '/writing/2026/08/management-retrospective/' }, moreWays: { label: '其他浏览方式', items: [{ label: '全部专栏', desc: '按顺序读一套判断', url: '/columns/' }, { label: '标签索引', desc: '沿一个问题横向翻', url: '/tags/' }, { label: '搜索', desc: '直接找某个词', url: '/search/' }] }, groups: { method: { title: '建立方法与判断', description: '把经验沉淀成可复用的方法——从度量体系到思维练习。' }, management: { title: '带团队与管理', description: '从一对一对话、团队建设到招聘与成长，按顺序读通管理。' }, engineering: { title: '工程、技术与研究', description: '从技术规划、协作交付到 AI 与系统研究，建立工程判断力。' } } },
      writingIndex: { sortLabel: '排序方式', sortPublished: '发布时间', sortUpdated: '最后更新', sortHint: '“最后更新”优先使用更新日期；未更新文章按发布日期排序。', sortStatusPublished: '已按发布时间排序。', sortStatusUpdated: '已按最后更新排序。', archiveLabel: '按年份归档' },
      tagCards: { writing: { label: '写作', action: '阅读全文' }, research: { label: '研究', action: '阅读摘要' }, project: { label: '项目', action: '查看项目' }, gallery: { label: '影像', action: '查看图集' } },
    },
  },
  en: {
    name: site.nameEn,
    brand: site.brandEn,
    brandShort: 'Silent Potato',
    navigation: { writing: 'Writing', columns: 'Columns', projects: 'Projects', research: 'Research', photos: 'Photos', about: 'About', consulting: 'Work with me', links: 'Links', start: 'Start', tags: 'Tags', search: 'Search', main: 'Main navigation', menu: 'Menu', menuOpen: 'Open menu', menuClose: 'Close menu' },
    language: { current: 'EN', alternate: '中文' },
    theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
    accessibility: { home: 'Liyuk home', siteSettings: 'Site settings', skipToContent: 'Skip to content' },
    footer: { publishedOpenly: 'Built slowly, published openly.', rss: 'RSS', nameMark: '. ', license: 'CC BY-NC-SA 4.0', elsewhere: 'Elsewhere', email: 'Email', github: 'GitHub', x: 'X', linkedin: 'LinkedIn' },
    entry: { updatedAt: 'Updated', publishedAt: 'Published', readingMinutes: (n) => `${n} min read`, readFull: 'Read full post', columnIn: (label, order) => `Part of the column “${label}” · Chapter ${order}`, tagsAria: 'Tags', columnChaptersAria: 'Column chapters' },
    column: { eyebrow: 'Column', count: (n) => `${n} posts`, current: 'This chapter' },
    pagination: { label: 'List pagination', prev: '← Previous', next: 'Next →', status: (page, total) => `Page ${page} of ${total}`, pageTitleSuffix: (page) => ` · Page ${page}` },
    postNav: { prev: '← Previous', next: 'Next →' },
    share: { shareLabel: 'Share', shareTo: 'Share to', saveLabel: 'Save', system: 'System share', x: 'X', linkedin: 'LinkedIn', facebook: 'Facebook', telegram: 'Telegram', whatsapp: 'WhatsApp', weibo: 'Weibo', wechat: 'WeChat', favorite: 'Save', favorited: 'Saved', favoriteAdded: 'Saved — view in your favorites', favoriteRemoved: 'Removed', copy: 'Copy link', copied: 'Copied', wechatModalTitle: 'Scan with WeChat', wechatModalDesc: 'Open this article on your phone, or forward it to a friend.', wechatModalClose: 'Close' },
    favorites: { label: 'Favorites', metaTitle: 'Favorites — Silent Potato’s Cookbook', metaDescription: 'Articles you saved.', title: ['Saved for', 'later.'], description: 'Read back what you saved.', empty: 'Nothing saved yet.', emptyHint: 'Tap “Save” at the bottom of an article to see it here.', remove: 'Remove', clearAll: 'Clear all', savedAt: 'Saved', types: { writing: 'Writing', research: 'Research', project: 'Project', gallery: 'Photos' } },
    toc: { label: 'Contents', aria: 'Table of contents' },
    subscribe: { prompt: 'Enjoy this site?', emailPlaceholder: 'Your email', submit: 'Subscribe', or: 'or', cta: 'Subscribe via RSS' },
    count: { photos: (n) => `${n} photos` },
    photosLoadMore: { label: 'Load more', done: 'Everything shown' },
    gallery: { carouselAria: (title) => `${title} gallery`, previous: '← Previous', next: 'Next →', previousAria: 'Previous photo', nextAria: 'Next photo', selectAria: 'Choose photo', viewPhotoAria: (n, alt) => `View photo ${n}: ${alt}` },
    tip: {
      eyebrow: 'Tip',
      title: 'If this helped',
      action: 'Buy me a coffee',
      description: 'If this landed for you, consider dropping me a coffee — it keeps me writing.',
      wechat: 'WeChat Pay',
      alipay: 'Alipay',
      paypal: 'PayPal',
      note: 'Thanks for reading — only if you feel like it.',
    },
    projectTip: {
      eyebrow: 'Tip',
      title: 'If this project helped',
      action: 'Buy me a coffee',
      description: 'If this project saved you time, consider dropping me a coffee — it keeps me maintaining it.',
      wechat: 'WeChat Pay',
      alipay: 'Alipay',
      paypal: 'PayPal',
      note: 'Thanks for the support — only if you feel like it.',
    },
    page: {
      home: { metaTitle: 'Silent Potato’s Cookbook — Liyuk', eyebrow: 'Independent work, in progress', title: ['Silent Potato’s', 'Cookbook.'], byline: 'Liyuk · Field Notes on Technology, Leadership & Life', description: 'Notes on technology, product, leadership, and everyday observation.', aboutLink: 'About', contact: 'Contact me', writing: { eyebrow: '01 / Writing', title: ['From work,', 'toward clarity.'], link: 'All writing', empty: 'The archive is being prepared.', featured: 'Recommended', latest: 'Latest', archiveHint: (n) => `${n} posts · Browse by year` }, practices: { projects: { label: '02 / Projects', title: 'From questions to things people can use.', description: 'Products, tools, and experiments.', count: (n) => `${n} projects` }, research: { label: '03 / Research', title: 'Making room for unanswered questions.', description: 'Papers, notes, and talks.', count: (n) => `${n} papers` }, consulting: { label: '04 / Work with me', title: 'Turn a hard career problem into a clear next step.', description: '1:1 consulting and advisory — from resumes to management growth.', cta: 'See consulting services' }, photos: { label: '05 / Photos', title: 'Looking beyond the screen.', description: 'Photography and field notes.', count: (n) => `${n} galleries` } }, start: { eyebrow: 'Reading paths', title: 'Not sure where to start?', description: 'Enter a shorter, more ordered reading path based on the problem you’re working on.', link: 'Start here' }, practiceGridAria: 'Areas of content' },
      writing: { label: 'Writing', metaTitle: 'Writing — Silent Potato’s Cookbook', metaDescription: 'Writing on technology, work, and life.', title: ['Turning experience into', 'shareable judgment.'], description: 'Technology, work, leadership, and field notes.' },
      projects: { label: 'Projects', metaTitle: 'Projects — Silent Potato’s Cookbook', metaDescription: 'Products, tools, and experiments.', title: ['From ideas to', 'things people can use.'], description: 'Selected work, judgments, process, and outcomes.', read: 'Read', view: 'View project' },
      research: { label: 'Research', metaTitle: 'Research — Silent Potato’s Cookbook', metaDescription: 'Research notes, papers, and talks.', title: ['Giving questions time,', 'and answers their evidence.'], description: 'Papers, notes, talks, and reproducible work.' },
      photos: { label: 'Photos / Field Notes', metaTitle: 'Photos — Silent Potato’s Cookbook', metaDescription: 'Photography and field notes by Liyuk.', title: ['Beyond the screen,', 'keep seeing.'], description: 'Selected photography series, not an endless image stream.', placeholder: 'Photography series in preparation.', placeholderLabel: 'Photography coming soon' },
      about: { label: 'About', metaTitle: 'About — Silent Potato’s Cookbook', metaDescription: 'Liyuk: engineer, writer, and storyteller who also writes novels with a workflow.', title: ['Turning experience into', 'something shareable.'], description: 'I am interested in how systems are built, products are understood, people are understood, and complex experience becomes clear expression.', intro: 'I am an engineer who has led teams and researched how AI changes engineering. This site is where I share those experiences, observations, and creations — only what I am willing to own.', stats: (writing, research, projects, zh, en) => `${writing} posts · ${research} papers · ${projects} projects · ~${zh} CJK chars · ~${en} English words`, mapEyebrow: 'Site map', mapTitle: 'Four kinds of content, four entries', map: { writing: { title: 'Writing', desc: 'Distilled experience — technology, leadership, field notes.', url: '/writing/' }, projects: { title: 'Projects', desc: 'From questions to things people can use.', url: '/projects/' }, research: { title: 'Research', desc: 'Unanswered questions — papers, notes, protocols.', url: '/research/' }, consulting: { title: 'Consulting', desc: 'One-on-one career and management judgment.', url: '/consulting/' } }, fictionEyebrow: 'Fiction', fictionTitle: 'Two novels, published openly', fictionDesc: 'I also write novels under the pen name “盗火的魔法师” (The Fire-Stealing Magician), published through an auditable workflow.', fictionNovels: [{ title: '《愿望之后》 (After the Wish)', desc: 'Sand, caravan routes, and companions with their own wishes.', url: '/projects/2026/08/novel-yuanwang-zhihou/' }, { title: '《盼东归》 (Yearning East)', desc: 'A long-life lock, Tongguan Pass, and a journey east.', url: '/projects/2026/08/novel-pandonggui/' }], boundaryEyebrow: 'Boundary', boundary: 'Everything published here is de-identified; anything involving specific business, internal data, or personal privacy stays private.', contactEyebrow: 'Contact', contactTitle: 'Find me', guestbookEyebrow: 'Guestbook', guestbookTitle: 'Leave a message', guestbookDesc: 'Anything you want to say or discuss — leave it here. A GitHub account is required to comment.', cooperateEyebrow: 'Work with me', cooperateTitle: 'Professional collaboration', cooperateDesc: 'I offer the following, usually starting over email:', cooperateItems: [{ title: 'Engineering & AI advisory', desc: 'Judgment and advice on how AI changes engineering, team building, and system design.' }, { title: 'Engineering management consulting', desc: 'One-on-one or team advising on growth, metrics, and engineering management.' }, { title: 'Writing & communication', desc: 'Turning complex technical and management experience into clear, shareable expression.' }] },
      consulting: { label: 'Work with me', metaTitle: 'Work with me — Silent Potato’s Cookbook', metaDescription: 'Engineering, AI, technical leadership, product judgment, and clear decision-making.', title: ['Build clearer systems.', 'Make better decisions.'], description: 'I work across engineering, AI, technical leadership, product judgment, and structured communication.', intro: 'Most of my work is building systems, leading engineering work, and turning ambiguous problems into decisions. I am especially interested in future full-time roles in engineering leadership, AI engineering, and technical strategy, and glad to have those conversations early — alongside collaborations, advisory engagements, and conversations about a specific career or workplace question.', servicesEyebrow: 'What I can contribute', servicesTitle: 'Capabilities for complex work', services: [{ title: 'Engineering & AI systems', description: 'Design and evaluate engineering systems, AI workflows, developer tools, and the boundaries between models and people.' }, { title: 'Technical leadership & organizations', description: 'Shape team responsibilities, management practices, decision rights, feedback loops, and sustainable ways of working.' }, { title: 'Product, strategy & decision support', description: 'Connect user problems, business constraints, technical choices, and evidence into a clearer direction.' }, { title: 'Technical writing & knowledge systems', description: 'Turn scattered context into product briefs, technical plans, retrospectives, knowledge bases, and decision documents.' }, { title: 'Career and interview conversations', description: 'Help engineers and technical leaders think through transitions, role choices, resumes/CVs, and interviews.' }], formatEyebrow: 'Ways to work together', formatTitle: 'Roles, collaboration, or consulting', formatDescription: 'I can join a team, contribute to a project, review a difficult decision, facilitate a focused workshop, or provide ongoing advisory support. For individual questions, a single conversation or a focused review may be enough; deeper consulting can become a written plan or a short engagement.', pricingEyebrow: 'Availability', pricingTitle: 'Open to selected opportunities', pricingDescription: 'I am especially interested in future full-time roles involving engineering leadership, AI engineering, technical strategy, or product and engineering decision-making, and welcome those conversations now. At the moment, I can take on consulting, advisory work, and exploratory conversations; scope, deliverables, timing, and consulting fees are discussed after the initial inquiry.', contactEyebrow: 'Contact', contactTitle: 'Start with the problem', contactDescription: 'Email hello@liyuk.com with a brief introduction, what you are building or deciding, and the kind of role or collaboration you have in mind. If consulting is the right fit, we can define the scope together.', contactAction: 'Start a conversation', availabilityNote: 'Currently available for consulting, advisory work, and conversations — not open to roles that require a new employment relationship at this time.', locationNote: 'San Francisco Bay Area, Pacific Time (PT).' },
      links: { label: 'Links', metaTitle: 'Links — Silent Potato’s Cookbook', metaDescription: 'Independent blogs and sites I read and recommend.', title: ['People I read,', 'worth your time.'], description: 'Independent blogs and sites I read and recommend. Mostly personal spaces written at their own pace, not an endless feed.', friendsEyebrow: 'Friends’ sites', friendsTitle: 'Sites I read', visit: 'Visit', applyEyebrow: 'Exchange links', applyTitle: 'Want to be listed here?', applyDesc: 'If you also run an independent blog, I’m glad to exchange links. A few simple rules:', applyRules: ['Original first — a personal site with ongoing writing, not a scraper or pure marketing page.', 'Stable and accessible, with mostly original content.', 'Add this site (liyuk.com) to your links first, then apply.', 'Include your site name, URL, and a one-line description (avatar optional).'], applyChannels: 'Once added, leave a note in the guestbook or send me an email.', applyGuestbook: 'Guestbook', applyEmail: 'Email' },
      notFound: { metaTitle: 'Not found — Silent Potato’s Cookbook', metaDescription: 'The page you requested does not exist or has moved.', title: 'This page has not appeared yet.', returnHome: 'Back home' },
      rss: { title: 'Silent Potato’s Cookbook', description: 'Writing by Liyuk on technology, work, and everyday life.' },
      writingArchive: { eyebrow: 'Writing archive', yearSuffix: '', monthSuffix: '', description: 'Writing organized by creation date.', metaTitle: (year, _suffix, brand) => `${year} Writing — ${brand}`, title: (year, _suffix) => `Writing in ${year}.`, titleMonth: (year, _suffix, month, _monthSuffix) => `Writing in ${year}, ${String(month).padStart(2, '0')}.` },
      columns: { eyebrow: 'Columns', title: ['Bring scattered pieces', 'into a judgment.'], description: 'A column is a path curated by the author and best read in order; it runs alongside the tag index but offers a fuller reading experience.', seriesLabel: 'Featured column', count: (n) => `${n} posts · Read in order` },
      columnsDetail: { eyebrow: 'Columns', chapterCount: (n) => `Chapter ${n}`, chaptersAria: (label) => `${label} chapters`, title: (label) => `${label} — Columns — ${'Silent Potato’s Cookbook'}`, viewDirectory: (label) => `View the column “${label}”`, prev: (title) => `← Previous: ${title}`, next: (title) => `Next: ${title} →`, empty: 'This column has no public entries yet. The first piece is being prepared.', chapterDate: (created, updated) => updated ? `${created} · ${updated}` : created },
      writingDetail: { relatedEyebrow: 'Keep reading', relatedTitle: 'Maybe related to this one.' },
      tags: { eyebrow: 'Tags', title: ['Follow one question,', 'read deeper.'], description: 'Tags put writing, research, projects, and photos into one index; only tags with at least three items are shown.', count: (n) => `${n} posts`, detailDescription: (label) => `Writing, research, projects, and photos around “${label}”.` },
      projectsDetail: { work: 'Work', project: 'Project', collectedAt: 'Collected', startedAt: 'Started', read: 'Read', github: 'GitHub', systemDesignPaper: 'System design paper', coverPlaceholder: 'Cover coming soon', coverAlt: (title) => `Cover of “${title}”`, viewOnGithub: 'View on GitHub' },
      researchDetail: { versionDate: 'Published', readPaper: 'Read the full paper on GitHub', repo: 'Project repository' },
      projectArchive: { eyebrow: 'Project archive', description: 'Projects organized by start date.', metaTitle: (year, brand) => `${year} Projects — ${brand}`, title: (year) => `Projects in ${year}.`, titleMonth: (year, month) => `Projects in ${year}, ${String(month).padStart(2, '0')}.` },
      researchArchive: { eyebrow: 'Research archive', description: 'Research organized by version date.', metaTitle: (year, brand) => `${year} Research — ${brand}`, title: (year) => `Research in ${year}.`, titleMonth: (year, month) => `Research in ${year}, ${String(month).padStart(2, '0')}.` },
      search: { eyebrow: 'Search', metaTitle: 'Search — Silent Potato’s Cookbook', metaDescription: 'Search the site’s posts, excerpts, body text, and tags.', title: ['From what’s already written,', 'keep looking forward.'], description: 'Search titles, excerpts, body text, and tags.', label: 'Search posts and tags', placeholder: 'e.g. career, metrics, frontend', status: (n) => `Found ${n} matching posts.`, statusTemplate: 'Found {{n}} matching posts.' },
      start: { eyebrow: 'Start here', metaTitle: 'Start here — Silent Potato’s Cookbook', metaDescription: 'Reading paths prepared for different questions.', title: ['Find what you’re thinking about,', 'then decide where to begin.'], description: 'Not a full table of contents — reading paths grouped by goal: find the problem you’re facing, then read the matching column in order.', howToRead: 'Three ways to read this site: to learn a topic systematically, follow the columns below in order; to browse sideways across a question, use the tag index; to find a specific word, search.', anchor: { eyebrow: 'Start with this one', title: 'Management Retrospective: Eight Judgments from Execution to System', url: '/writing/2026/08/management-retrospective/' }, moreWays: { label: 'Other ways to browse', items: [{ label: 'All columns', desc: 'Read a judgment in order', url: '/columns/' }, { label: 'Tag index', desc: 'Browse sideways by question', url: '/tags/' }, { label: 'Search', desc: 'Find a specific word', url: '/search/' }] }, groups: { method: { title: 'Method & Judgment', description: 'Turning experience into reusable method — from metrics systems to thinking practice.' }, management: { title: 'Teams & Management', description: 'From one-on-ones and team building to hiring and growth — management, read in order.' }, engineering: { title: 'Engineering, Technology & Research', description: 'From technical planning and delivery to AI and systems research — building engineering judgment.' } } },
      writingIndex: { sortLabel: 'Sort by', sortPublished: 'Date published', sortUpdated: 'Last updated', sortHint: '“Last updated” prefers the update date; posts never updated are sorted by publication date.', sortStatusPublished: 'Sorted by date published.', sortStatusUpdated: 'Sorted by last updated.', archiveLabel: 'Browse by year' },
      tagCards: { writing: { label: 'Writing', action: 'Read on' }, research: { label: 'Research', action: 'Read summary' }, project: { label: 'Project', action: 'View project' }, gallery: { label: 'Photos', action: 'View gallery' } },
    },
  },
};

export function i18n(locale) {
  const code = locale === 'en' ? 'en' : 'zh';
  return { locale: code, ...dict[code] };
}

export function consultingOffer(locale) {
  return locale === 'en'
    ? { eyebrow: 'What you leave with', title: 'A clearer next move.', description: 'A consultation is not a promise of a perfect answer. It is a focused conversation that turns a vague work problem into a shared diagnosis and an actionable next step.', items: [{ title: 'A problem you can name', description: 'Separate the facts, constraints, relationships, and assumptions that are mixed together in the original worry.' }, { title: 'Options and trade-offs', description: 'See which paths are worth testing, what each path requires, and what should not be promised yet.' }, { title: 'A next conversation or action', description: 'Leave with the person to talk to, the question to ask, the evidence to gather, and a reasonable time to review.' }], note: 'For more complex transitions or team problems, the output can become a written brief, a 30–90 day plan, or a short follow-up engagement.' }
    : { eyebrow: '一次咨询会带走什么', title: '一个更清楚的下一步。', description: '咨询不是承诺给你一个完美答案，而是把一个模糊的工作问题，聊成共同理解的问题和可以开始的行动。', items: [{ title: '一个说得清楚的问题', description: '把混在一起的事实、约束、关系和假设拆开，不再只停留在“我很焦虑”或“我没有方向”。' }, { title: '几条有取舍的路径', description: '看清哪些方向值得验证、每条路径需要什么，以及哪些事情现在还不能承诺。' }, { title: '下一次对话或行动', description: '带走要找的人、要问的问题、要补的证据，以及一个合理的复盘时间。' }], note: '复杂的转型、管理成长或团队问题，可以继续形成书面简报、30–90 天计划，或一次短期跟进。' };
}

export function consultingColumns(locale) {
  return locale === 'en'
    ? { eyebrow: 'Consultation columns', readMore: 'Read the column', count: (n) => `${n} post${n === 1 ? '' : 's'} · Read in order`, empty: 'No public records in this column yet. The first conversation is being prepared.' }
    : { eyebrow: '咨询专栏', readMore: '阅读专栏', count: (n) => `${n} 篇 · 按顺序阅读`, empty: '这个专栏还没有公开记录，第一篇对谈正在整理。' };
}

export function professionalBackground(locale) {
  return locale === 'en'
    ? {
        consultingEyebrow: 'Why this work',
        consultingTitle: 'Experience behind the conversation.',
        consultingDescription: 'I have more than 10 years of experience in internet and large technology companies, including more than 5 years in senior management. I served as a second-line manager, formally responsible for an engineering organization of 50+ people and directly managing four frontline managers, including teams across regions and time zones. My work has included hiring, promotion coaching, technical planning, coordination across teams, promotion review, and talent assessment. I also served on promotion review committees.',
        consultingTeaching: 'I have also spent years teaching and sharing engineering and management practice inside companies, reaching thousands of colleagues. I delivered multiple focused courses for 200+ frontline leaders and senior technical experts, receiving full-score feedback.',
        consultingMetrics: '1,000+ interviews · 200+ hires within the organizations I led · 40+ senior engineers coached · 10+ frontline managers supported',
        aboutEyebrow: 'Professional background',
        aboutTitle: 'The work behind the writing.',
        aboutDescription: 'I have worked in internet and technology companies across engineering, technical leadership, and management. My experience includes building teams, making technical and organizational decisions, supporting people’s growth, and turning complex work into clearer communication.',
        aboutDetails: 'I have also spent years sharing engineering and management practice inside companies and writing about the work behind the decisions. Some of the more specific business, team, and performance details belong in private conversations rather than on this site.',
      }
    : {
        consultingEyebrow: '为什么是我',
        consultingTitle: '这些经验，构成了对话的背景。',
        consultingDescription: '我有 10 年以上互联网与大型科技公司经验，拥有 5 年以上资深管理经验。曾在全球化互联网平台的技术组织中承担二线管理职责，正式负责一个 50+ 人的工程组织，直接管理 4 位一线管理者，也有跨地域、跨时区团队的管理经验。长期参与招聘、晋升辅导、技术规划、跨团队协作、晋升评审与人才判断，曾担任晋升委员会评委。',
        consultingTeaching: '我也长期在公司内部进行课程与知识分享，累计覆盖数千名同事；曾面向 200+ 位一线 Leader 与资深技术专家开展多次专题课程，并获得满分评价。',
        consultingMetrics: '面试 1000+ 场 · 在所负责的组织范围内招聘并录用 200+ 人 · 辅导 40+ 位资深工程师 · 培养和支持 10+ 位一线管理者',
        aboutEyebrow: '工作背景',
        aboutTitle: '写作背后的工作。',
        aboutDescription: '我在互联网与科技公司从事过工程、技术管理和组织协作相关工作。我的经验包括搭建团队、做技术与组织判断、支持成员成长，以及把复杂工作整理成更清楚的表达。',
        aboutDetails: '我也长期在公司内部分享工程与管理实践，并持续写下这些判断背后的工作经验。更具体的业务、团队和绩效细节，适合留在私下的对话中，而不是全部放在这个网站上。',
      };
}

export function consultingAudience(locale) {
  return locale === 'en'
    ? {
        eyebrow: 'You might be here because',
        title: 'The problem is not always a lack of ability.',
        description: 'You may have work to do but no clear sense of why you are doing it, be expected to create direction without enough context, or want to ask for support before you have the facts to make a credible case.',
        items: [
          'You have joined a new team and are delivering requirements, but cannot yet explain where you can create distinctive value.',
          'Your manager wants stable delivery while you need room to grow, prove yourself, or take on a broader role.',
          'You have been given a broad business or growth problem without enough context, ownership, or a clear starting point.',
          'You want to talk to product or business partners, but worry that asking basic questions will expose what you do not know.',
        ],
      }
    : {
        eyebrow: '你可能正处在这里',
        title: '问题不一定是能力不够。',
        description: '你可能有事情可做，却说不清自己为什么在做；被期待做出方向判断，却还没有足够上下文；或者想争取支持，但手里还没有足够事实去提出一个可信的诉求。',
        items: [
          '刚加入新团队，一直在交付需求，却还说不清自己能在哪里创造独特价值。',
          '主管希望你稳定交付，但你又需要成长、证明自己，或者承担更大的职责。',
          '被交给一个业务或增长方向，却没有足够的上下文、责任边界和明确起点。',
          '想找产品或业务方沟通，又担心一问基础问题，就暴露自己对业务不熟。',
        ],
      };
}
