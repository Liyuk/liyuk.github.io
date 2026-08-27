import { getTag } from './taxonomy.ts';

export type SeoPage =
  | 'home'
  | 'writing'
  | 'projects'
  | 'research'
  | 'photos'
  | 'about'
  | 'consulting'
  | 'links'
  | 'start'
  | 'columns'
  | 'tags';

export interface PageSeo {
  description: string;
  keywords: string[];
}

type LocalizedSeo = Record<'zh-CN' | 'en', Record<SeoPage, PageSeo>>;

const seo: LocalizedSeo = {
  'zh-CN': {
    home: {
      description: 'Liyuk 的个人网站，记录 AI 工程、软件系统、技术管理、职业发展、研究、写作与咨询实践。',
      keywords: ['AI 工程', '软件工程', '技术管理', '职业发展', '技术写作', '工程咨询'],
    },
    writing: {
      description: '关于 AI、软件工程、技术管理、职业发展、组织协作与日常观察的原创写作和现场笔记。',
      keywords: ['AI', '软件工程', '技术管理', '职业发展', '组织协作', '开发者生产力'],
    },
    projects: {
      description: '公开的开源项目、AI 工具、系统设计、开发者工具和产品实验，记录问题、过程、判断与结果。',
      keywords: ['开源项目', 'AI 工具', '系统设计', '开发者工具', '产品实验', '工程原型'],
    },
    research: {
      description: '关于数据研究、机器学习、AI 工程与组织系统的研究笔记、论文、方法和可复现工作。',
      keywords: ['数据研究', '机器学习', '可复现研究', 'AI 工程', '研究方法', '组织研究'],
    },
    photos: {
      description: 'Liyuk 的摄影作品与现场笔记，记录城市、日常、旅行和屏幕之外的观察、行走与思考。',
      keywords: ['摄影', '现场笔记', '旅行摄影', '城市观察', '日常记录'],
    },
    about: {
      description: '了解 Liyuk：工程师、技术管理者、AI 研究者与独立写作者，分享系统、领导力和工作判断。',
      keywords: ['Liyuk', '工程师', '技术管理者', 'AI 研究', '独立写作者', '工程领导力'],
    },
    consulting: {
      description: '面向学生、工程师和管理者的职业发展、面试辅导、技术管理、AI 工程与 FDE 咨询。',
      keywords: ['职业发展咨询', '面试辅导', '技术管理咨询', 'AI 工程咨询', 'FDE', '晋升与转管理'],
    },
    links: {
      description: 'Liyuk 常读并愿意推荐的独立博客、技术站点和持续写作的个人空间。',
      keywords: ['独立博客', '技术博客', '个人网站', '阅读推荐', '友链'],
    },
    start: {
      description: '从技术、管理、职业发展、AI 工程和数据研究等问题出发，找到适合你的站内阅读路径。',
      keywords: ['阅读路径', '技术学习', '管理成长', 'AI 工程', '职业发展', '数据研究'],
    },
    columns: {
      description: '按主题和推荐顺序整理的技术、管理、职业发展、AI 工程与咨询专栏。',
      keywords: ['主题专栏', '技术管理', '职业发展', 'AI 工程', '咨询案例', '系统化阅读'],
    },
    tags: {
      description: '按 AI、工程、管理、职业发展、研究和摄影等主题浏览站内文章、项目与作品。',
      keywords: ['文章标签', 'AI', '软件工程', '技术管理', '职业发展', '研究'],
    },
  },
  en: {
    home: {
      description: 'Liyuk’s personal site for AI engineering, software systems, technical leadership, career development, research, writing, and consulting.',
      keywords: ['AI engineering', 'software engineering', 'technical leadership', 'career development', 'technical writing', 'engineering consulting'],
    },
    writing: {
      description: 'Original writing and field notes on AI, software engineering, technical leadership, career development, organizational collaboration, and everyday work.',
      keywords: ['AI', 'software engineering', 'technical leadership', 'career development', 'organizational collaboration', 'developer productivity'],
    },
    projects: {
      description: 'Open-source projects, AI tools, system designs, developer tools, and product experiments with their problems, process, judgment, and outcomes.',
      keywords: ['open-source projects', 'AI tools', 'system design', 'developer tools', 'product experiments', 'engineering prototypes'],
    },
    research: {
      description: 'Research notes, papers, methods, and reproducible work on data, machine learning, AI engineering, and organizational systems.',
      keywords: ['data research', 'machine learning', 'reproducible research', 'AI engineering', 'research methods', 'organizational research'],
    },
    photos: {
      description: 'Liyuk’s photography and field notes about cities, everyday life, travel, and observations beyond the screen.',
      keywords: ['photography', 'field notes', 'travel photography', 'city observation', 'everyday life'],
    },
    about: {
      description: 'About Liyuk: an engineer, technical leader, AI researcher, and independent writer sharing judgment about systems, leadership, and work.',
      keywords: ['Liyuk', 'engineer', 'technical leader', 'AI research', 'independent writer', 'engineering leadership'],
    },
    consulting: {
      description: 'Career development, interview coaching, technical management, AI engineering, and FDE consulting for students, engineers, and managers.',
      keywords: ['career consulting', 'interview coaching', 'technical management consulting', 'AI engineering consulting', 'FDE', 'promotion and management transition'],
    },
    links: {
      description: 'Independent blogs, technical sites, and personal spaces that Liyuk reads regularly and recommends.',
      keywords: ['independent blogs', 'technical blogs', 'personal websites', 'reading recommendations', 'blogroll'],
    },
    start: {
      description: 'Find a reading path through technical work, management, career development, AI engineering, and data research.',
      keywords: ['reading paths', 'technical learning', 'management growth', 'AI engineering', 'career development', 'data research'],
    },
    columns: {
      description: 'Curated reading paths covering technology, management, career development, AI engineering, and consulting cases.',
      keywords: ['curated columns', 'technical leadership', 'career development', 'AI engineering', 'consulting cases', 'structured reading'],
    },
    tags: {
      description: 'Browse site content by AI, engineering, management, career development, research, photography, and related topics.',
      keywords: ['content tags', 'AI', 'software engineering', 'technical leadership', 'career development', 'research'],
    },
  },
};

export function getPageSeo(locale: string, page: SeoPage): PageSeo {
  const localized = locale === 'en' ? seo.en : seo['zh-CN'];
  const value = localized[page];
  return { description: value.description, keywords: [...value.keywords] };
}

export function contentKeywords(tags: string[], locale: string): string[] {
  return [...new Set(tags.map((tag) => {
    try {
      return getTag(tag, locale).label;
    } catch {
      return tag;
    }
  }))];
}
