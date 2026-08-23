const brand = '沉默土豆的烹饪指南';
const brandEn = 'Silent Potato’s Cookbook';

export const site = {
  name: 'Liyuk',
  nameEn: 'Liyuk',
  brand,
  brandEn,
  locale: 'zh-CN',
  url: 'https://liyuk.com',
  // 站点首次公开发布年份：Footer 用它渲染版权区间（© 2018–2026）。
  // 起始年保持不变；末年是构建时的当前年（new Date().getFullYear()）。
  since: 2018,
  // 联系邮箱：首页、about、咨询页与 mailto 都指向这里。
  email: 'hello@liyuk.com',
  // 中文咨询入口使用的微信号；英文入口仍以邮箱为主。
  wechat: 'leeyvk',
  // 站外社交链接：Footer「在别处 / Elsewhere」区块与 about 页共用。
  social: {
    github: 'https://github.com/Liyuk',
    x: 'https://x.com/liyukli',
    linkedin: 'https://www.linkedin.com/in/liyuk/',
  },
  // 友链（/links 页）：常读、也愿意推荐的独立站点，按「开放互换」维护。
  // name/url 跨语言一致；description/descriptionEn 分别给中英文一句话介绍。
  // 友链多了以后，可给每条加 group 字段（值用 i18n key）做分组展示。
  friends: [
    {
      name: 'Malash',
      url: 'https://malash.me/',
      // 站点只有 title「Malash's Blog」，无自定义 meta description。
      description: 'Malash 的个人博客。',
      descriptionEn: 'Malash’s personal blog.',
    },
    {
      name: 'Iris Luan',
      url: 'https://www.irisluan.com/',
      // 取自站点 meta description。
      description: '笔记、案例研究、旅行日志与 side projects，写作于上海与纽约之间。',
      descriptionEn: 'Notes, case studies, travel journals, and side products — written between Shanghai and New York City.',
    },
  ],
  title: `${brand} — Liyuk`,
  titleEn: `${brandEn} — Liyuk`,
  description: 'Liyuk 关于技术、领导力与日常的现场笔记。',
  descriptionEn: 'Field notes from Liyuk on technology, leadership, and everyday life.',
  navigation: [
    { href: '/start/', key: 'start' },
    { href: '/writing/', key: 'writing' },
    { href: '/columns/', key: 'columns' },
    { href: '/projects/', key: 'projects' },
    { href: '/research/', key: 'research' },
    { href: '/consulting/', key: 'consulting' },
    { href: '/photos/', key: 'photos' },
    { href: '/about/', key: 'about' },
  ],
  translation: {
    sourceLocale: 'zh-CN',
    targetLocale: 'en',
    mode: 'manual-review',
  },
};
