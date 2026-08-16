// Giscus (GitHub Discussions 驱动的评论区) 配置。
//
// 启用步骤：
//   1. 在 GitHub 仓库 Settings → General → Features 里开启 Discussions。
//   2. 访问 https://giscus.app 按提示填仓库名，选择「Announcements」或新建一个
//      Discussion 分类，生成下面这组 id。
//   3. 把 repo / repoId / categoryId 填进来，把 enabled 设为 true。
//
// 数据说明：评论以 Discussion 形式存进你的 GitHub 仓库，可用 GitHub GraphQL API
// 完整导出，之后迁移到自建方案（如 Supabase 段落级评论）不会丢数据。
export const comments = {
  enabled: true,
  repo: 'Liyuk/liyuk.github.io',
  repoId: 'MDEwOlJlcG9zaXRvcnkxMjc1MzY3MzQ=',
  category: 'Announcements',
  categoryId: 'DIC_kwDOB5oOXs4DDfX8',
  // 主题跟随站点明暗：站点浅色映射到 giscus 的 light，深色映射到 dark_dimmed
  //（偏灰绿，最贴近站点 --paper #1d211e）。可在组件里改映射。
  lightTheme: 'light',
  darkTheme: 'dark_dimmed',
  // 按当前页面路径关联评论区（同 url 的中英文页会各自独立）。
  mapping: 'pathname',
};
