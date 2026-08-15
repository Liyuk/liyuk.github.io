import { site } from '../data/site.mjs';

const copy = {
  'zh-CN': {
    name: site.name,
    brand: site.brand,
    brandShort: '沉默土豆',
    tagline: 'Liyuk · 关于技术、领导力与日常的现场笔记',
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
      currentChapter: '本篇',
      tagsAria: '标签',
      columnChaptersAria: '专栏章节导航',
    },
    column: {
      eyebrow: '专栏',
      count: (n) => `${n} 篇`,
      current: '本篇',
    },
    toc: { label: '目录', aria: '文章目录' },
    count: {
      photos: (n) => `${n} 张照片`,
    },
    gallery: {
      carouselAria: (title) => `${title} 图片轮播`,
      previous: '← 上一张',
      next: '下一张 →',
      previousAria: '上一张照片',
      nextAria: '下一张照片',
      selectAria: '选择照片',
      viewPhotoAria: (n, alt) => `查看第 ${n} 张：${alt}`,
    },
  },
  en: {
    name: site.nameEn,
    brand: site.brandEn,
    brandShort: 'Silent Potato',
    tagline: 'Liyuk · Field Notes on Technology, Leadership & Life',
    navigation: { writing: 'Writing', columns: 'Columns', projects: 'Projects', research: 'Research', photos: 'Photos', about: 'About', search: 'Search', main: 'Main navigation' },
    language: { current: 'EN', alternate: '中文' },
    theme: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode' },
    accessibility: { home: 'Liyuk home', siteSettings: 'Site settings', skipToContent: 'Skip to content' },
    footer: { publishedOpenly: 'Built slowly, published openly.', rss: 'RSS', nameMark: '. ' },
    entry: {
      updatedAt: 'Updated',
      publishedAt: 'Published',
      readingMinutes: (n) => `${n} min read`,
      readFull: 'Read full post',
      columnIn: (label, order) => `Part of the column “${label}” · Chapter ${order}`,
      currentChapter: 'This chapter',
      tagsAria: 'Tags',
      columnChaptersAria: 'Column chapters',
    },
    column: {
      eyebrow: 'Column',
      count: (n) => `${n} posts`,
      current: 'This chapter',
    },
    toc: { label: 'Contents', aria: 'Table of contents' },
    count: {
      photos: (n) => `${n} photos`,
    },
    gallery: {
      carouselAria: (title) => `${title} gallery`,
      previous: '← Previous',
      next: 'Next →',
      previousAria: 'Previous photo',
      nextAria: 'Next photo',
      selectAria: 'Choose photo',
      viewPhotoAria: (n, alt) => `View photo ${n}: ${alt}`,
    },
  },
};

export function getUiCopy(locale) {
  return copy[locale] ?? copy['zh-CN'];
}
