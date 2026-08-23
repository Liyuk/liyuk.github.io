import type { ColumnableEntry } from './types.ts';

export const tags: Record<string, [string, string]> = {
  technology: ['技术', 'Technology'],
  product: ['产品', 'Product'],
  'work-leadership': ['工作与领导力', 'Work & Leadership'],
  'field-notes': ['现场笔记', 'Field Notes'],
  career: ['职业成长', 'Career Growth'],
  engineering: ['工程实践', 'Engineering'],
  'decision-making': ['决策', 'Decision Making'],
  data: ['数据', 'Data'],
  metrics: ['指标', 'Metrics'],
  'data-metrics-guide': ['数据度量工作指南', 'Data Metrics Guide'],
  leadership: ['领导力', 'Leadership'],
  archive: ['旧文归档', 'Archive'],
  travel: ['旅行', 'Travel'],
  reflection: ['复盘与反思', 'Reflection'],
  measurement: ['度量', 'Measurement'],
  growth: ['成长', 'Growth'],
  communication: ['沟通', 'Communication'],
  thinking: ['思维训练', 'Thinking'],
  team: ['团队', 'Team'],
  'self-reflection': ['自我反思', 'Self Reflection'],
  'product-thinking': ['产品思维', 'Product Thinking'],
  prioritization: ['优先级', 'Prioritization'],
  operations: ['运营', 'Operations'],
  network: ['网络', 'Networking'],
  interview: ['面试', 'Interviewing'],
  frontend: ['前端', 'Frontend'],
  feedback: ['反馈', 'Feedback'],
  'everyday-life': ['日常生活', 'Everyday Life'],
  'career-development': ['职业发展', 'Career Development'],
  writing: ['写作', 'Writing'],
  'west-coast': ['西海岸', 'West Coast'],
  'united-states': ['美国', 'United States'],
  tokyo: ['东京', 'Tokyo'],
  'systems-thinking': ['系统思维', 'Systems Thinking'],
  systems: ['系统', 'Systems'],
  'site-notes': ['建站笔记', 'Site Notes'],
  'sing-box': ['sing-box', 'sing-box'],
  retrospective: ['复盘', 'Retrospective'],
  relationships: ['关系', 'Relationships'],
  promotion: ['晋升', 'Promotion'],
  'problem-framing': ['问题定义', 'Problem Framing'],
  observability: ['可观测性', 'Observability'],
  motivation: ['动力', 'Motivation'],
  learning: ['学习', 'Learning'],
  japan: ['日本', 'Japan'],
  jakarta: ['雅加达', 'Jakarta'],
  indonesia: ['印度尼西亚', 'Indonesia'],
  guide: ['指南', 'Guide'],
  gifts: ['送礼', 'Gifting'],
  fiction: ['小说', 'Fiction'],
  'engineering-management': ['技术管理', 'Engineering Management'],
  documentation: ['文档', 'Documentation'],
  cooking: ['烹饪', 'Cooking'],
  collaboration: ['协作', 'Collaboration'],
  'campus-recruitment': ['校招', 'Campus Recruitment'],
  vless: ['VLESS', 'VLESS'],
  reality: ['Reality', 'Reality'],
  ai: ['AI', 'AI'],
  astro: ['Astro', 'Astro'],
  architecture: ['Architecture', 'Architecture'],
  algorithms: ['算法', 'Algorithms'],
  beauty: ['Beauty', 'Beauty'],
  books: ['Books', 'Books'],
  'capacity-planning': ['Capacity Planning', 'Capacity Planning'],
  'code-quality': ['Code Quality', 'Code Quality'],
  delivery: ['Delivery', 'Delivery'],
  'developer-experience': ['Developer Experience', 'Developer Experience'],
  'distributed-work': ['Distributed Work', 'Distributed Work'],
  hiring: ['Hiring', 'Hiring'],
  'information-architecture': ['Information Architecture', 'Information Architecture'],
  judgment: ['Judgment', 'Judgment'],
  'knowledge-management': ['Knowledge Management', 'Knowledge Management'],
  management: ['Management', 'Management'],
  mentoring: ['Mentoring', 'Mentoring'],
  mentorship: ['Mentorship', 'Mentorship'],
  notes: ['Notes', 'Notes'],
  onboarding: ['Onboarding', 'Onboarding'],
  organization: ['Organization', 'Organization'],
  'organization-design': ['Organization Design', 'Organization Design'],
  'organizational-change': ['Organizational Change', 'Organizational Change'],
  ownership: ['Ownership', 'Ownership'],
  planning: ['Planning', 'Planning'],
  'platform-engineering': ['Platform Engineering', 'Platform Engineering'],
  'problem-solving': ['Problem Solving', 'Problem Solving'],
  process: ['Process', 'Process'],
  'project-management': ['Project Management', 'Project Management'],
  quality: ['Quality', 'Quality'],
  reading: ['Reading', 'Reading'],
  reliability: ['Reliability', 'Reliability'],
  research: ['Research', 'Research'],
  'risk-management': ['Risk Management', 'Risk Management'],
  skincare: ['Skincare', 'Skincare'],
  strategy: ['Strategy', 'Strategy'],
  'systems-design': ['Systems Design', 'Systems Design'],
  'team-building': ['Team Building', 'Team Building'],
  'technical-planning': ['Technical Planning', 'Technical Planning'],
  'technical-sharing': ['Technical Sharing', 'Technical Sharing'],
  'technical-writing': ['Technical Writing', 'Technical Writing'],
  'time-management': ['Time Management', 'Time Management'],
  trust: ['Trust', 'Trust'],
  // research collection 使用的标签
  'developer-productivity': ['开发者生产力', 'Developer Productivity'],
  'feedback-loops': ['反馈回路', 'Feedback Loops'],
  'software-engineering': ['软件工程', 'Software Engineering'],
  'agent-systems': ['智能体系统', 'Agent Systems'],
  governance: ['治理', 'Governance'],
  'human-ai-collaboration': ['人机协作', 'Human-AI Collaboration'],
  'machine-learning': ['机器学习', 'Machine Learning'],
  housing: ['住房', 'Housing'],
  reproducibility: ['可复现性', 'Reproducibility'],
  'functional-teams': ['职能团队', 'Functional Teams'],
  'business-lines': ['业务线', 'Business Lines'],
  narrative: ['叙事', 'Narrative'],
  auditability: ['可审计性', 'Auditability'],
  'interpersonal-analysis': ['人际分析', 'Interpersonal Analysis'],
  'anti-scam': ['反诈', 'Anti-Scam'],
  psychology: ['心理学', 'Psychology'],
  behavior: ['行为', 'Behavior'],
  workplace: ['职场', 'Workplace'],
  power: ['权力', 'Power'],
  'professional-relationships': ['职业关系', 'Professional Relationships'],
  'risk-analysis': ['风险分析', 'Risk Analysis'],
  // Project and search-growth tags are registered here so tag pages and
  // repository-wide content audits use one bilingual vocabulary.
  agency: ['主体性', 'Agency'],
  agent: ['智能体', 'Agents'],
  'ai-relay': ['AI 中继', 'AI Relay'],
  'api-key': ['API 密钥', 'API Key'],
  authorization: ['授权', 'Authorization'],
  backlinks: ['反向链接', 'Backlinks'],
  china: ['中国', 'China'],
  'coding-agent': ['编程智能体', 'Coding Agents'],
  'cognitive-offloading': ['认知卸载', 'Cognitive Offloading'],
  community: ['社区', 'Community'],
  'computer-vision': ['计算机视觉', 'Computer Vision'],
  'creative-writing': ['创意写作', 'Creative Writing'],
  deskilling: ['去技能化', 'Deskilling'],
  education: ['教育', 'Education'],
  emotion: ['情绪', 'Emotion'],
  explainability: ['可解释性', 'Explainability'],
  forecasting: ['预测', 'Forecasting'],
  hci: ['人机交互', 'Human-Computer Interaction'],
  'image-seo': ['图片 SEO', 'Image SEO'],
  novel: ['小说', 'Novel'],
  'open-source': ['开源', 'Open Source'],
  'personal-publication': ['个人出版物', 'Personal Publication'],
  privacy: ['隐私', 'Privacy'],
  provenance: ['溯源', 'Provenance'],
  'public-good': ['公共利益', 'Public Good'],
  python: ['Python', 'Python'],
  recoverability: ['可恢复性', 'Recoverability'],
  'revenue-sharing': ['收益分成', 'Revenue Sharing'],
  routing: ['路由', 'Routing'],
  seo: ['SEO', 'SEO'],
  settlement: ['结算', 'Settlement'],
  'static-site': ['静态站点', 'Static Site'],
  'technical-management': ['技术管理', 'Technical Management'],
  'technical-seo': ['技术 SEO', 'Technical SEO'],
  'time-series': ['时间序列', 'Time Series'],
  'trust-calibration': ['信任校准', 'Trust Calibration'],
  typescript: ['TypeScript', 'TypeScript'],
  'video-seo': ['视频 SEO', 'Video SEO'],
  vuepress: ['VuePress', 'VuePress'],
  workflow: ['工作流', 'Workflow'],
};

export const columns: Record<string, { label: { 'zh-CN': string; en: string }; description: { 'zh-CN': string; en: string } }> = {
  'data-metrics-guide': {
    label: { 'zh-CN': '数据度量工作指南', en: 'Data Metrics Guide' },
    description: { 'zh-CN': '从数据口径到周期复盘，建立一套能支持协作与决策的度量系统。', en: 'A practical system for definitions, metrics, collaboration, and retrospective learning.' },
  },
  'thinking-training': {
    label: { 'zh-CN': '思维训练', en: 'Thinking Practice' },
    description: { 'zh-CN': '从排序和数数开始，把模糊的表达变成可以共同判断的问题。', en: 'Exercises for turning vague expression into questions people can reason about together.' },
  },
  'recruiting-and-professional-relationships': {
    label: { 'zh-CN': '招聘与职业关系', en: 'Recruiting & Professional Relationships' },
    description: { 'zh-CN': '从定义团队需要什么，到帮助彼此相互识别，再到建立长期可信的职业关系。', en: 'From defining team needs to mutual recognition and durable professional relationships.' },
  },
  'one-on-one-conversations': {
    label: { 'zh-CN': '一对一对话', en: 'One-on-One Conversations' },
    description: { 'zh-CN': '从共同定义问题开始，在边界清楚的对话中形成下一次行动。', en: 'Starting with shared problem framing, then turning clear conversations into next actions.' },
  },
  'technical-systems': {
    label: { 'zh-CN': '技术规划与架构', en: 'Technical Systems' },
    description: { 'zh-CN': '技术规划的本质是业务分析与竞品分析：理解要服务的业务与竞争的差距，再连成架构、规范与代码的判断。', en: 'Technical planning as business and competitive analysis: reading the business and the gap to rivals, then turning them into sound architecture, standards, and code.' },
  },
  'team-building': {
    label: { 'zh-CN': '团队建设与管理', en: 'Building Teams' },
    description: { 'zh-CN': '从一线管理到团队设计：如何搭建、培养并延续一个有判断力的梯队。', en: 'From frontline management to team design: building, growing, and sustaining a strong team.' },
  },
  'multi-team-management': {
    label: { 'zh-CN': '管理管理者与多团队结果', en: 'Managing Managers & Multi-Team Outcomes' },
    description: { 'zh-CN': '直接管理多个一线负责人，并设计目标、边界、授权、资源和接班安排，让多个团队不靠逐项介入也能持续作出好判断。', en: 'Managing managers and the systems around them: setting goals, boundaries, authority, resources, and succession so multiple teams can deliver shared outcomes without constant intervention.' },
  },
  'engineering-collaboration': {
    label: { 'zh-CN': '工程协作与交付', en: 'Engineering Collaboration' },
    description: { 'zh-CN': '冲突、容量、资源与动力：在真实约束中让团队稳定交付。', en: 'Conflict, capacity, resources, and motivation: delivering reliably under real constraints.' },
  },
  'documentation': {
    label: { 'zh-CN': '文档与知识', en: 'Documentation & Knowledge' },
    description: { 'zh-CN': '让文档成为协作接口，让知识库可被发现、可被维护。', en: 'Making documents a collaboration interface and knowledge bases findable and maintainable.' },
  },
  'product-judgment': {
    label: { 'zh-CN': '产品判断', en: 'Product Judgment' },
    description: { 'zh-CN': '从用户问题到产品概览：工程师如何参与并练习产品判断。', en: 'From user problems to product overviews: how engineers practice product judgment.' },
  },
  'growth-self-assessment': {
    label: { 'zh-CN': '成长与自我评估', en: 'Growth & Self-Assessment' },
    description: { 'zh-CN': '不靠标签评价自己：从潜力、成长到诚实的自我评估。', en: 'Beyond labels: assessing potential, growth, and honest self-evaluation.' },
  },
  'early-career-start': {
    label: { 'zh-CN': '校招与职业起步', en: 'Early Career & Starting Out' },
    description: { 'zh-CN': '围绕校招、实习、offer 选择和进入职场后第一步的咨询记录。', en: 'Consultation records about internships, campus recruiting, offer choices, and the first step into work.' },
  },
  'interview-job-search': {
    label: { 'zh-CN': '面试与求职准备', en: 'Interview & Job Search Preparation' },
    description: { 'zh-CN': '围绕目标岗位、简历、项目经历、表达和面试案例的咨询记录。', en: 'Consultation records about target roles, resumes, project stories, communication, and interview cases.' },
  },
  'career-management-growth': {
    label: { 'zh-CN': '职业路径与管理成长', en: 'Career Paths & Management Growth' },
    description: { 'zh-CN': '围绕职业选择、晋升、转管理和管理者成长的咨询记录。', en: 'Consultation records about career choices, promotion, management transitions, and manager growth.' },
  },
  'engineering-team-judgment': {
    label: { 'zh-CN': '工程团队与技术判断', en: 'Engineering Teams & Technical Judgment' },
    description: { 'zh-CN': '围绕团队职责、工程协作、技术规划和产品判断的咨询记录。', en: 'Consultation records about team responsibilities, engineering collaboration, technical planning, and product judgment.' },
  },
  'search-engine-growth': {
    label: { 'zh-CN': '搜索引擎增长工程', en: 'Search Engine Growth' },
    description: { 'zh-CN': '从给 Google 爬虫优化到给 AI 引擎优化：一条可观测、可工程的搜索引擎增长线。', en: 'From optimizing for Google crawlers to optimizing for AI engines: an observable, engineerable growth line.' },
  },
  'engineering-ai-judgment': {
    label: { 'zh-CN': '工程与 AI 判断', en: 'Engineering & AI Judgment' },
    description: { 'zh-CN': '从问题定位方法到数据度量协议、AI 工程边界、组织重划与 Agent 协作设计——一组研究论文记录的技术与组织判断路径。', en: 'From a problem-framing method to measurement protocols, AI engineering boundaries, org redesign, and agent collaboration — a research thread on technical and organizational judgment.' },
  },
};

// start 页把注册过的专栏按「目标」分成几条阅读路径。每个专栏必须恰好落在
// 一个分组里——tests/column-audit.test.mjs 会校验这一点，避免新增专栏时
// 悄悄漏掉 start 页入口。
export const startGroups: { key: 'method' | 'management' | 'engineering'; columns: string[] }[] = [
  { key: 'method', columns: ['data-metrics-guide', 'thinking-training'] },
  {
    key: 'management',
    columns: [
      'one-on-one-conversations',
      'team-building',
      'multi-team-management',
      'recruiting-and-professional-relationships',
      'growth-self-assessment',
      'early-career-start',
      'interview-job-search',
      'career-management-growth',
      'engineering-team-judgment',
    ],
  },
  {
    key: 'engineering',
    columns: [
      'technical-systems',
      'engineering-collaboration',
      'documentation',
      'product-judgment',
      'search-engine-growth',
      'engineering-ai-judgment',
    ],
  },
];

// 相关推荐用简单规则：同专栏优先，其次共享标签数量。
// 有意不引入 IDF 加权、标题分词或时间衰减——对这些启发式没有验证过的
// 收益，简单规则更可预期（设计取舍见 docs）。
const RELATED_SCORING = {
  sameColumn: 50, // 同专栏：强相关但不独占
  sharedTag: 10,  // 每个共享标签的基础分
};

// 相关推荐最多返回几篇（有意取小，避免把详情页尾部塞满）。
export const RELATED_LIMIT = 3;
// 标签至少出现在几篇内容里才进入标签索引。注意：tags 页的文案
// （“至少有三项内容”/“at least three items”）与此值要保持一致。
export const MIN_TAG_ENTRIES = 3;

function localized(copy: [string, string], locale: string): string {
  return copy[locale === 'en' ? 1 : 0];
}

export function getTag(slug: string, locale = 'zh-CN'): { slug: string; label: string } {
  const tag = tags[slug];
  return { slug, label: tag ? localized(tag, locale) : slug };
}

export function getColumn(slug: string, locale = 'zh-CN') {
  const column = columns[slug];
  if (!column) return null;
  const key: 'zh-CN' | 'en' = locale === 'en' ? 'en' : 'zh-CN';
  return {
    slug,
    label: column.label[key],
    description: column.description[key],
  };
}

export function getColumnEntries<T extends ColumnableEntry>(entries: T[], columnSlug: string): T[] {
  return entries
    .filter((entry) => entry.data.column?.slug === columnSlug)
    .sort((a, b) => (a.data.column?.order ?? 0) - (b.data.column?.order ?? 0) || a.id.localeCompare(b.id));
}

export function getRelatedEntries<T extends ColumnableEntry>(
  entries: T[],
  currentEntry: T,
  limit: number = RELATED_LIMIT,
  locale = 'zh-CN',
): { entry: T; reasons: string[] }[] {
  const currentTags = new Set(currentEntry.data.tags ?? []);
  const en = locale === 'en';

  // 排除同专栏相邻篇（已在专栏导航展示，避免推荐重复）
  const columnNeighbors = new Set<string>();
  if (currentEntry.data.column?.slug) {
    const columnEntries = getColumnEntries(entries, currentEntry.data.column.slug)
      .filter((e) => e.collection === currentEntry.collection);
    const idx = columnEntries.findIndex((e) => e.id === currentEntry.id);
    if (idx >= 0) {
      if (columnEntries[idx - 1]) columnNeighbors.add(columnEntries[idx - 1].id);
      if (columnEntries[idx + 1]) columnNeighbors.add(columnEntries[idx + 1].id);
    }
  }

  const scored = entries
    .filter((entry) => entry.id !== currentEntry.id && !columnNeighbors.has(entry.id))
    .map((entry) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. 同专栏：强相关但不独占
      const sameColumn = Boolean(
        currentEntry.data.column?.slug && entry.data.column?.slug === currentEntry.data.column.slug,
      );
      if (sameColumn) {
        score += RELATED_SCORING.sameColumn;
        reasons.push(en ? 'same column' : '同专栏');
      }

      // 2. 共享标签：每个共享标签一个基础分，不按罕见度加权
      const shared = (entry.data.tags ?? []).filter((slug) => currentTags.has(slug));
      score += shared.length * RELATED_SCORING.sharedTag;
      if (shared.length > 0) {
        reasons.push(
          en
            ? `shared ${shared.length} tag${shared.length > 1 ? 's' : ''}`
            : `共享标签 ${shared.length} 个`,
        );
      }

      return { entry, score, reasons, sameColumn };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));

  // 同专栏最多取 1 篇，避免推荐模块被同一专栏占满
  const result: { entry: T; reasons: string[] }[] = [];
  let columnTaken = false;
  for (const item of scored) {
    if (item.sameColumn && columnTaken) continue;
    if (item.sameColumn) columnTaken = true;
    result.push({ entry: item.entry, reasons: item.reasons });
    if (result.length >= limit) break;
  }

  return result;
}

export function getIndexableTags<T extends ColumnableEntry>(
  entries: T[],
  minimumEntries: number = MIN_TAG_ENTRIES,
): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const slug of entry.data.tags ?? []) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count >= minimumEntries)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}
