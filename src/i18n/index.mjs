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
    navigation: { writing: '写作', columns: '专栏', projects: '项目', research: '研究', photos: '影像', about: '关于', search: '搜索', main: '主导航' },
    language: { current: '中文', alternate: 'EN' },
    theme: { toDark: '切换为深色模式', toLight: '切换为浅色模式' },
    accessibility: { home: 'Liyuk 首页', siteSettings: '站点设置', skipToContent: '跳到正文' },
    footer: { publishedOpenly: '缓慢构建，公开发布。', rss: '订阅 RSS', nameMark: '。' },
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
    toc: { label: '目录', aria: '文章目录' },
    count: { photos: (n) => `${n} 张照片` },
    gallery: {
      carouselAria: (title) => `${title} 图片轮播`,
      previous: '← 上一张',
      next: '下一张 →',
      previousAria: '上一张照片',
      nextAria: '下一张照片',
      selectAria: '选择照片',
      viewPhotoAria: (n, alt) => `查看第 ${n} 张：${alt}`,
    },
    page: {
      home: { metaTitle: '沉默土豆的烹饪指南 — Liyuk', eyebrow: '独立工作，持续进行', title: ['沉默土豆的', '烹饪指南。'], byline: 'Liyuk · 关于技术、领导力与日常的现场笔记', description: '这里记录技术、产品、领导力与日常观察；也是项目、研究和摄影慢慢汇合的地方。', aboutLink: '关于我', writing: { eyebrow: '01 / 写作', title: ['从工作中来，', '回到清晰的表达。'], link: '查看全部写作', empty: '写作档案正在整理。' }, practices: { projects: { label: '02 / 项目', title: '从问题到可以打开的东西。', description: '产品、工具和正在进行的实验。' }, research: { label: '03 / 研究', title: '为尚未解决的问题保留空间。', description: '论文、研究笔记与演讲。' }, photos: { label: '04 / 影像', title: '在屏幕之外，继续观察。', description: '照片与现场笔记。' } }, start: { eyebrow: '阅读入口', title: '不知道从哪里开始？', description: '按你正在处理的问题，进入一条更短、更有顺序的阅读路径。', link: '从这里开始' }, practiceGridAria: '内容领域' },
      writing: { label: '写作', metaTitle: '写作 — 沉默土豆的烹饪指南', metaDescription: '关于技术、工作与日常的写作。', title: ['把经验变成', '可以分享的判断。'], description: '技术、工作与领导力，以及不急于归类的现场笔记。' },
      projects: { label: '项目', metaTitle: '项目 — 沉默土豆的烹饪指南', metaDescription: '产品、工具和正在进行的实验。', title: ['从想法到', '可以被使用的东西。'], description: '项目案例会随着公开工作逐步加入。这里保留问题、判断、过程与成果，而不只是技术清单。', read: '去阅读', view: '查看项目' },
      research: { label: '研究', metaTitle: '研究 — 沉默土豆的烹饪指南', metaDescription: '研究笔记、论文与公开演讲。', title: ['给问题足够的时间，', '也给答案留下证据。'], description: '论文、研究笔记、演讲和可复现的工作会在这里沉淀。' },
      photos: { label: '影像 / 现场笔记', metaTitle: '影像 — 沉默土豆的烹饪指南', metaDescription: 'Liyuk 的摄影与现场笔记。', title: ['在屏幕之外，', '继续看见。'], description: '这里会是挑选过的摄影系列，而不是一条无限刷新的图片流。', placeholder: '正在整理的摄影系列。', placeholderLabel: '摄影作品即将发布' },
      about: { label: '关于', metaTitle: '关于 — 沉默土豆的烹饪指南', metaDescription: 'Liyuk：工程师、传播者，也用工作流写小说。在这里分享技术、领导力与日常的现场笔记。', title: ['把经验变成', '可以传播的东西。'], description: '我关注系统如何被构建、产品如何被理解、人是如何被理解的，以及复杂经验如何变成更清楚的表达。', intro: '我是一名工程师，做过技术管理、带过团队，也在研究和实践 AI 如何改变工程。这个站点是我分享这些经验、观察与创作的地方——中文优先，只发自己真正想承担的内容。', mapEyebrow: '这个站里有什么', mapTitle: '四类内容，各自有诚实的入口', map: { writing: { title: '写作', desc: '对经验的整理——技术、领导力与现场笔记。', url: '/writing/' }, projects: { title: '项目', desc: '从问题到产物——工具、实验与正在做的事。', url: '/projects/' }, research: { title: '研究', desc: '尚未收束的问题——论文、研究笔记与协议。', url: '/research/' }, fiction: { title: '小说', desc: '用工作流写的虚构作品。', url: '/projects/' } }, fictionEyebrow: '小说创作', fictionIntro: '我也写小说，笔名「盗火的魔法师」。用一套可审计的工作流在真实平台连载，目前有两本：', fictionNovels: [{ title: '《愿望之后》', desc: '沙海、商路与一群各怀心愿的旅伴——愿望从不保证幸福。', url: '/projects/2026/08/novel-yuanwang-zhihou/' }, { title: '《盼东归》', desc: '长命锁、潼关与一场东行——普通人能不能不被命运决定。', url: '/projects/2026/08/novel-pandonggui/' }], boundaryEyebrow: '边界', boundary: '公开分享的写作和作品都已脱敏；涉及具体业务、内部数据或个人隐私的部分会留在私档，不在这里展开。', note: '这个站点以中文写作为原稿，英文版本将在内容成熟后逐步发布。', contact: '联系我' },
      notFound: { metaTitle: '页面未找到 — 沉默土豆的烹饪指南', metaDescription: '你访问的页面不存在或已被移动。', title: '这个页面还没有出现。', returnHome: '回到首页' },
      rss: { title: '沉默土豆的烹饪指南', description: 'Liyuk 关于技术、工作与日常的写作。' },
      writingArchive: { eyebrow: '写作归档', yearSuffix: '年', monthSuffix: '月', description: '按创作时间整理的文章。', metaTitle: (year, suffix, brand) => `${year}${suffix}写作归档 — ${brand}`, title: (year, suffix) => `${year}${suffix}的写作。`, titleMonth: (year, suffix, month, monthSuffix) => `${year}${suffix}${month}${monthSuffix}的写作。` },
      columns: { eyebrow: '专栏', title: ['把散落的内容，', '读成一套判断。'], description: '专栏是一条由作者编排、按推荐顺序阅读的路径；它与标签索引并行，但提供更完整的阅读体验。', seriesLabel: '系列专栏', count: (n) => `${n} 篇 · 按顺序阅读` },
      columnsDetail: { eyebrow: '专栏', chapterCount: (n) => `第 ${n} 篇`, chaptersAria: (label) => `${label} 章节目录`, title: (label) => `${label} — 专栏 — ${'沉默土豆的烹饪指南'}`, viewDirectory: (label) => `查看专栏《${label}》目录`, prev: (title) => `← 上一篇：${title}`, next: (title) => `下一篇：${title} →`, chapterDate: (created, updated) => updated ? `${created} · ${updated}` : created },
      writingDetail: { relatedEyebrow: '继续阅读', relatedTitle: '也许和这篇有关。' },
      tags: { eyebrow: '标签', title: ['沿着一个问题，', '读得更深一点。'], description: '标签把写作、研究、项目与影像放到同一条索引里；只显示至少有三项内容的标签。', count: (n) => `${n} 篇`, detailDescription: (label) => `围绕“${label}”的写作、研究、项目与影像。` },
      projectsDetail: { work: '作品', project: '项目', collectedAt: '收录于', startedAt: '开始于', read: '去阅读', github: 'GitHub', systemDesignPaper: '系统设计论文', coverPlaceholder: '封面待补', coverAlt: (title) => `《${title}》封面`, viewOnGithub: '在 GitHub 查看' },
      researchDetail: { versionDate: '发布于', readPaper: '在 GitHub 阅读完整论文', repo: '项目仓库' },
      projectArchive: { eyebrow: '项目归档', description: '按开始时间整理的项目。', metaTitle: (year, brand) => `${year}年项目归档 — ${brand}`, title: (year) => `${year}年的项目。`, titleMonth: (year, month) => `${year}年${month}月的项目。` },
      researchArchive: { eyebrow: '研究归档', description: '按版本日期整理的研究。', metaTitle: (year, brand) => `${year}年研究归档 — ${brand}`, title: (year) => `${year}年的研究。`, titleMonth: (year, month) => `${year}年${month}月的研究。` },
      search: { eyebrow: '搜索', metaTitle: '搜索 — 沉默土豆的烹饪指南', metaDescription: '搜索站内文章、摘要、正文和标签。', title: ['从已经写下的，', '继续往前找。'], description: '搜索标题、摘要、正文与标签。', label: '搜索文章与标签', placeholder: '例如：职业成长、指标、前端', status: (n) => `找到 ${n} 篇相关内容。`, statusTemplate: '找到 {{n}} 篇相关内容。' },
      start: { eyebrow: '从这里开始', metaTitle: '从这里开始 — 沉默土豆的烹饪指南', metaDescription: '为不同问题准备的阅读入口。', title: ['先找到你正在想的，', '再决定从哪一篇读起。'], description: '这不是内容总目录，而是几条为不同问题准备的阅读路径。', cards: [{ label: '系统化学习', title: '建立数据度量体系', description: '从口径、指标到复盘，按顺序读完一套完整的方法。', url: '/columns/data-metrics-guide/' }, { label: '练习判断', title: '把模糊的问题说清楚', description: '从排序、数数和复述开始，练习可共同判断的表达。', url: '/columns/thinking-training/' }, { label: '职业与管理', title: '在工作中形成判断', description: '关于成长、团队、协作与领导力的长期记录。', url: '/tags/work-leadership/' }, { label: '工程与系统', title: '从技术问题进入', description: '工程实践、系统判断与可复用的工作方法。', url: '/tags/technology/' }] },
      writingIndex: { sortLabel: '排序方式', sortPublished: '发布时间', sortUpdated: '最后更新', sortHint: '“最后更新”优先使用更新日期；未更新文章按发布日期排序。', sortStatusPublished: '已按发布时间排序。', sortStatusUpdated: '已按最后更新排序。' },
      tagCards: { research: { label: '研究', action: '阅读摘要' }, project: { label: '项目', action: '查看项目' }, gallery: { label: '影像', action: '查看图集' } },
    },
  },
  en: {
    name: site.nameEn,
    brand: site.brandEn,
    brandShort: 'Silent Potato',
    navigation: { writing: 'Writing', columns: 'Columns', projects: 'Projects', research: 'Research', photos: 'Photos', about: 'About', search: 'Search', main: 'Main navigation' },
    language: { current: 'EN', alternate: '中文' },
    theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
    accessibility: { home: 'Liyuk home', siteSettings: 'Site settings', skipToContent: 'Skip to content' },
    footer: { publishedOpenly: 'Built slowly, published openly.', rss: 'RSS', nameMark: '. ' },
    entry: { updatedAt: 'Updated', publishedAt: 'Published', readingMinutes: (n) => `${n} min read`, readFull: 'Read full post', columnIn: (label, order) => `Part of the column “${label}” · Chapter ${order}`, tagsAria: 'Tags', columnChaptersAria: 'Column chapters' },
    column: { eyebrow: 'Column', count: (n) => `${n} posts`, current: 'This chapter' },
    toc: { label: 'Contents', aria: 'Table of contents' },
    count: { photos: (n) => `${n} photos` },
    gallery: { carouselAria: (title) => `${title} gallery`, previous: '← Previous', next: 'Next →', previousAria: 'Previous photo', nextAria: 'Next photo', selectAria: 'Choose photo', viewPhotoAria: (n, alt) => `View photo ${n}: ${alt}` },
    page: {
      home: { metaTitle: 'Silent Potato’s Cookbook — Liyuk', eyebrow: 'Independent work, in progress', title: ['Silent Potato’s', 'Cookbook.'], byline: 'Liyuk · Field Notes on Technology, Leadership & Life', description: 'Notes on technology, product, leadership, and everyday observation.', aboutLink: 'About', writing: { eyebrow: '01 / Writing', title: ['From work,', 'toward clarity.'], link: 'All writing', empty: 'The archive is being prepared.' }, practices: { projects: { label: '02 / Projects', title: 'From questions to things people can use.', description: 'Products, tools, and experiments.' }, research: { label: '03 / Research', title: 'Making room for unanswered questions.', description: 'Papers, notes, and talks.' }, photos: { label: '04 / Photos', title: 'Looking beyond the screen.', description: 'Photography and field notes.' } }, start: { eyebrow: 'Reading paths', title: 'Not sure where to start?', description: 'Enter a shorter, more ordered reading path based on the problem you’re working on.', link: 'Start here' }, practiceGridAria: 'Areas of content' },
      writing: { label: 'Writing', metaTitle: 'Writing — Silent Potato’s Cookbook', metaDescription: 'Writing on technology, work, and life.', title: ['Turning experience into', 'shareable judgment.'], description: 'Technology, work, leadership, and field notes.' },
      projects: { label: 'Projects', metaTitle: 'Projects — Silent Potato’s Cookbook', metaDescription: 'Products, tools, and experiments.', title: ['From ideas to', 'things people can use.'], description: 'Selected work, judgments, process, and outcomes.', read: 'Read', view: 'View project' },
      research: { label: 'Research', metaTitle: 'Research — Silent Potato’s Cookbook', metaDescription: 'Research notes, papers, and talks.', title: ['Giving questions time,', 'and answers their evidence.'], description: 'Papers, notes, talks, and reproducible work.' },
      photos: { label: 'Photos / Field Notes', metaTitle: 'Photos — Silent Potato’s Cookbook', metaDescription: 'Photography and field notes by Liyuk.', title: ['Beyond the screen,', 'keep seeing.'], description: 'Selected photography series, not an endless image stream.', placeholder: 'Photography series in preparation.', placeholderLabel: 'Photography coming soon' },
      about: { label: 'About', metaTitle: 'About — Silent Potato’s Cookbook', metaDescription: 'Liyuk: engineer, writer, and storyteller who also writes novels with a workflow.', title: ['Turning experience into', 'something shareable.'], description: 'I am interested in how systems are built, products are understood, people are understood, and complex experience becomes clear expression.', intro: 'I am an engineer who has led teams and researched how AI changes engineering. This site is where I share those experiences, observations, and creations — Chinese-first, and only what I am willing to own.', mapEyebrow: 'What’s on this site', mapTitle: 'Four kinds of content, each with an honest entry', map: { writing: { title: 'Writing', desc: 'Distilled experience — technology, leadership, field notes.', url: '/writing/' }, projects: { title: 'Projects', desc: 'From questions to things people can use.', url: '/projects/' }, research: { title: 'Research', desc: 'Unanswered questions — papers, notes, protocols.', url: '/research/' }, fiction: { title: 'Fiction', desc: 'Stories written with a workflow.', url: '/projects/' } }, fictionEyebrow: 'Fiction', fictionIntro: 'I also write novels, under the pen name “盗火的魔法师” (The Fire-Stealing Magician), published through an auditable workflow. Two so far:', fictionNovels: [{ title: '《愿望之后》 (After the Wish)', desc: 'Sand, caravan routes, and companions with their own wishes.', url: '/projects/2026/08/novel-yuanwang-zhihou/' }, { title: '《盼东归》 (Yearning East)', desc: 'A long-life lock, Tongguan Pass, and a journey east.', url: '/projects/2026/08/novel-pandonggui/' }], boundaryEyebrow: 'Boundary', boundary: 'Everything published here is de-identified; anything involving specific business, internal data, or personal privacy stays private.', note: 'The site is written in Chinese first. English editions will follow as work matures.', contact: 'Get in touch' },
      notFound: { metaTitle: 'Not found — Silent Potato’s Cookbook', metaDescription: 'The page you requested does not exist or has moved.', title: 'This page has not appeared yet.', returnHome: 'Back home' },
      rss: { title: 'Silent Potato’s Cookbook', description: 'Writing by Liyuk on technology, work, and everyday life.' },
      writingArchive: { eyebrow: 'Writing archive', yearSuffix: '', monthSuffix: '', description: 'Writing organized by creation date.', metaTitle: (year, _suffix, brand) => `${year} Writing — ${brand}`, title: (year, _suffix) => `Writing in ${year}.`, titleMonth: (year, _suffix, month, _monthSuffix) => `Writing in ${year}, ${String(month).padStart(2, '0')}.` },
      columns: { eyebrow: 'Columns', title: ['Bring scattered pieces', 'into a judgment.'], description: 'A column is a path curated by the author and best read in order; it runs alongside the tag index but offers a fuller reading experience.', seriesLabel: 'Featured column', count: (n) => `${n} posts · Read in order` },
      columnsDetail: { eyebrow: 'Columns', chapterCount: (n) => `Chapter ${n}`, chaptersAria: (label) => `${label} chapters`, title: (label) => `${label} — Columns — ${'Silent Potato’s Cookbook'}`, viewDirectory: (label) => `View the column “${label}”`, prev: (title) => `← Previous: ${title}`, next: (title) => `Next: ${title} →`, chapterDate: (created, updated) => updated ? `${created} · ${updated}` : created },
      writingDetail: { relatedEyebrow: 'Keep reading', relatedTitle: 'Maybe related to this one.' },
      tags: { eyebrow: 'Tags', title: ['Follow one question,', 'read deeper.'], description: 'Tags put writing, research, projects, and photos into one index; only tags with at least three items are shown.', count: (n) => `${n} posts`, detailDescription: (label) => `Writing, research, projects, and photos around “${label}”.` },
      projectsDetail: { work: 'Work', project: 'Project', collectedAt: 'Collected', startedAt: 'Started', read: 'Read', github: 'GitHub', systemDesignPaper: 'System design paper', coverPlaceholder: 'Cover coming soon', coverAlt: (title) => `Cover of “${title}”`, viewOnGithub: 'View on GitHub' },
      researchDetail: { versionDate: 'Published', readPaper: 'Read the full paper on GitHub', repo: 'Project repository' },
      projectArchive: { eyebrow: 'Project archive', description: 'Projects organized by start date.', metaTitle: (year, brand) => `${year} Projects — ${brand}`, title: (year) => `Projects in ${year}.`, titleMonth: (year, month) => `Projects in ${year}, ${String(month).padStart(2, '0')}.` },
      researchArchive: { eyebrow: 'Research archive', description: 'Research organized by version date.', metaTitle: (year, brand) => `${year} Research — ${brand}`, title: (year) => `Research in ${year}.`, titleMonth: (year, month) => `Research in ${year}, ${String(month).padStart(2, '0')}.` },
      search: { eyebrow: 'Search', metaTitle: 'Search — Silent Potato’s Cookbook', metaDescription: 'Search the site’s posts, excerpts, body text, and tags.', title: ['From what’s already written,', 'keep looking forward.'], description: 'Search titles, excerpts, body text, and tags.', label: 'Search posts and tags', placeholder: 'e.g. career, metrics, frontend', status: (n) => `Found ${n} matching posts.`, statusTemplate: 'Found {{n}} matching posts.' },
      start: { eyebrow: 'Start here', metaTitle: 'Start here — Silent Potato’s Cookbook', metaDescription: 'Reading paths prepared for different questions.', title: ['Find what you’re thinking about,', 'then decide where to begin.'], description: 'This is not a full table of contents — just a few reading paths prepared for different questions.', cards: [{ label: 'Learn systematically', title: 'Build a data metrics system', description: 'From definitions and metrics to retrospectives — read a complete method in order.', url: '/columns/data-metrics-guide/' }, { label: 'Practice judgment', title: 'Say the vague problem clearly', description: 'Start with sorting, counting, and retelling — practice expression people can judge together.', url: '/columns/thinking-training/' }, { label: 'Career & management', title: 'Form judgment at work', description: 'Long-term notes on growth, teams, collaboration, and leadership.', url: '/tags/work-leadership/' }, { label: 'Engineering & systems', title: 'Enter from a technical problem', description: 'Engineering practice, systems judgment, and reusable ways of working.', url: '/tags/technology/' }] },
      writingIndex: { sortLabel: 'Sort by', sortPublished: 'Date published', sortUpdated: 'Last updated', sortHint: '“Last updated” prefers the update date; posts never updated are sorted by publication date.', sortStatusPublished: 'Sorted by date published.', sortStatusUpdated: 'Sorted by last updated.' },
      tagCards: { research: { label: 'Research', action: 'Read summary' }, project: { label: 'Project', action: 'View project' }, gallery: { label: 'Photos', action: 'View gallery' } },
    },
  },
};

export function i18n(locale) {
  const code = locale === 'en' ? 'en' : 'zh';
  return { locale: code, ...dict[code] };
}
