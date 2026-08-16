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
  // 联系邮箱：about 页「合作/联系」区块与 mailto 都指向这里。
  email: 'likun.liyuk@gmail.com',
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
    { href: '/photos/', key: 'photos' },
    { href: '/about/', key: 'about' },
    { href: '/tags/', key: 'tags' },
  ],
  translation: {
    sourceLocale: 'zh-CN',
    targetLocale: 'en',
    mode: 'manual-review',
  },
};
