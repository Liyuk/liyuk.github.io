// Curated hub copy for tag pages that earn a guided entry point.
//
// A hub is editorial: it exists only when a tag has enough published entries
// AND a real search/reader need (see agent notes on keyword tracking). Items
// are referenced by stable content key, never by URL, so routes stay owned by
// `content-paths.ts`. Keys that stop resolving fail the Chinese build.
import { contentUrl, contentSlug } from './content-paths.ts';

export type HubLocale = 'zh-CN' | 'en';

export interface HubItem {
  /** `<collection>:<YYYY/MM/slug>`, with collection in writing|project|research|consulting. */
  key: string;
  why: Record<HubLocale, string>;
}

export interface TopicHub {
  title: Record<HubLocale, string>;
  description: Record<HubLocale, string>;
  intro: Record<HubLocale, string>;
  groups: { heading: Record<HubLocale, string>; items: HubItem[] }[];
  faqs?: { q: Record<HubLocale, string>; a: Record<HubLocale, string>; key: string }[];
  /** Reader wording that should resolve to this hub from site search. */
  searchTerms: Record<HubLocale, string[]>;
}

export const topicHubs: Record<string, TopicHub> = {
  'ai-gateway': {
    title: {
      'zh-CN': 'AI Gateway 是什么：模型路由、限流与故障切换',
      en: 'AI Gateway: Model Routing, Rate Limits, and Fallback',
    },
    description: {
      'zh-CN': '从定义到工程实现：AI Gateway 在应用与模型之间做什么，429 与超时怎样 fallback，以及一个可解释的多源模型路由器如何设计。',
      en: 'From definition to implementation: what an AI gateway does between your app and the models, how to fall back on 429s and timeouts, and how an explainable multi-source router is built.',
    },
    intro: {
      'zh-CN': '这组内容围绕同一个问题：应用调用多个模型时，谁来决定走哪条路、失败后怎么办、成本怎么管。先读概念文章建立全景，再看具体路由器的设计取舍，最后读更上层的任务调度研究。',
      en: 'These pieces share one question: when an application calls several models, who decides which route to take, what happens on failure, and how cost is governed. Start with the overview, then read a concrete router’s design trade-offs, then the broader scheduling research.',
    },
    groups: [
      {
        heading: { 'zh-CN': '先建立全景', en: 'Start with the overview' },
        items: [{ key: 'writing:2026/09/what-ai-gateways-do', why: { 'zh-CN': '定义、核心职责，以及从后端调度到成本治理的演进。', en: 'Definition, core responsibilities, and the path from backend scheduling to cost governance.' } }],
      },
      {
        heading: { 'zh-CN': '看一个具体的实现', en: 'See a concrete implementation' },
        items: [
          { key: 'projects:2026/08/quota-router', why: { 'zh-CN': '为什么需要一条可解释的多源 fallback 链，以及它长什么样。', en: 'Why an explainable multi-source fallback chain is needed, and what it looks like.' } },
          { key: 'projects:2026/08/quota-router-engineering', why: { 'zh-CN': '路由算法、限流与降级的工程细节和取舍。', en: 'Routing algorithm, rate limiting, and degradation: engineering detail and trade-offs.' } },
        ],
      },
      {
        heading: { 'zh-CN': '再往上一层', en: 'One level up' },
        items: [{ key: 'research:2026/08/model-harness-task-scheduling-context-routing', why: { 'zh-CN': '多模型任务拆解、能力切换与子任务路由的研究综述。', en: 'A review of multi-model task decomposition, capability switching, and subtask routing.' } }],
      },
    ],
    faqs: [
      {
        q: { 'zh-CN': 'AI Gateway 和普通 API 网关有什么区别？', en: 'How is an AI gateway different from a regular API gateway?' },
        a: { 'zh-CN': '普通网关转发请求并做鉴权限流；AI Gateway 还要理解模型、令牌与成本，在多个模型之间路由、重试和降级。', en: 'A regular gateway forwards requests with auth and rate limits; an AI gateway also understands models, tokens, and cost, and routes, retries, and degrades across models.' },
        key: 'writing:2026/09/what-ai-gateways-do',
      },
      {
        q: { 'zh-CN': '上游模型返回 429 时应该怎么办？', en: 'What should happen when an upstream model returns 429?' },
        a: { 'zh-CN': '先区分可重试与不可重试的失败，再按有界的 fallback 链切换到下一个来源，并记录每一步的原因。', en: 'Separate retryable from non-retryable failures, then move down a bounded fallback chain and record the reason for each hop.' },
        key: 'projects:2026/08/quota-router-engineering',
      },
    ],
    searchTerms: {
      'zh-CN': ['ai gateway', 'ai 网关', 'llm 网关', 'ai gateway 是什么', '模型路由', '模型 fallback', 'ai api 429'],
      en: ['ai gateway', 'llm gateway', 'llm gateway fallback', 'model routing', 'ai api rate limit retry'],
    },
  },
  interview: {
    title: {
      'zh-CN': '工程师面试准备：自查清单、面试题与系统设计的讲法',
      en: 'Engineer Interview Prep: Checklists, Questions, and Explaining System Design',
    },
    description: {
      'zh-CN': '工程师面试与晋升前的自查清单，面试题背后的成长路径，以及怎样把系统设计的取舍讲清楚。',
      en: 'A self-checklist before interviews and promotion, the growth path behind interview questions, and how to explain system-design trade-offs.',
    },
    intro: {
      'zh-CN': '面试和晋升考的是同一件事：能不能把自己做过的判断讲成别人可以检验的证据。这里按准备顺序排列：先自查，再看常见题背后考什么，最后用一个系统设计案例练习取舍的讲法。',
      en: 'Interviews and promotion test the same thing: can you turn past judgment into evidence others can check. The order below follows preparation: self-check first, then what common questions are really testing, then one system-design case to practise explaining trade-offs.',
    },
    groups: [
      {
        heading: { 'zh-CN': '1. 先自查', en: '1. Self-check first' },
        items: [{ key: 'writing:2023/08/career-growth-ten-questions', why: { 'zh-CN': '面试和晋升前逐条核对的问题清单。', en: 'A question-by-question checklist before interviews and promotion.' } }],
      },
      {
        heading: { 'zh-CN': '2. 用案例和证据准备', en: '2. Prepare with cases and evidence' },
        items: [{ key: 'projects:2026/10/interview-compass', why: { 'zh-CN': '把问题、案例和证据锚点整理成可练习的面试与晋升准备工具。', en: 'Turns questions, cases, and evidence anchors into a practice tool for interviews and promotion.' } }],
      },
      {
        heading: { 'zh-CN': '3. 读懂面试题', en: '3. Read the questions' },
        items: [{ key: 'writing:2018/04/interview-questions-archive', why: { 'zh-CN': '一组面试题背后考察的能力与成长路径。', en: 'The abilities a set of interview questions probes, and the growth path they imply.' } }],
      },
      {
        heading: { 'zh-CN': '4. 练习讲取舍', en: '4. Practise explaining trade-offs' },
        items: [{ key: 'writing:2026/09/what-ai-gateways-do', why: { 'zh-CN': '用 AI Gateway 当案例，练习把系统设计的取舍讲清楚。', en: 'Use the AI gateway as a case for explaining system-design trade-offs clearly.' } }],
      },
    ],
    searchTerms: {
      'zh-CN': ['工程师面试', '面试准备', '系统设计面试', '晋升材料', '晋升面试'],
      en: ['software engineer interview', 'interview preparation', 'system design interview', 'promotion packet'],
    },
  },
};

export function hasHub(slug: string): boolean {
  return Object.hasOwn(topicHubs, slug);
}

export function hubTagSlugs(): string[] {
  return Object.keys(topicHubs);
}

const COLLECTION_FOR_KEY: Record<string, string> = { writing: 'writing', projects: 'project', project: 'project', research: 'research', consulting: 'consulting' };

type PublishedLike = { collection: string; id: string; data: { title: string; description?: string } };

function entryFor(key: string, entries: PublishedLike[]) {
  const [rawCollection, id] = key.split(':');
  const collection = COLLECTION_FOR_KEY[rawCollection];
  if (!collection || !id) throw new Error(`Invalid topic hub item key: ${key}`);
  return { collection, entry: entries.find((candidate) => candidate.collection === collection && contentSlug(candidate.id) === id) };
}

/**
 * Resolve a hub for one locale. The Chinese build is the source of truth and
 * fails on an unresolved key; English drops entries that have no English page.
 */
export function resolveHub(slug: string, locale: HubLocale, entries: PublishedLike[]) {
  const hub = topicHubs[slug];
  if (!hub) return undefined;
  const link = (key: string) => {
    const { collection, entry } = entryFor(key, entries);
    if (!entry) {
      if (locale === 'zh-CN') throw new Error(`Topic hub "${slug}" references an unpublished or missing entry: ${key}`);
      return undefined;
    }
    return { entry, url: contentUrl(collection, entry.id, locale) };
  };
  const groups = hub.groups
    .map((group) => ({
      heading: group.heading[locale],
      items: group.items.flatMap((item) => {
        const resolved = link(item.key);
        return resolved ? [{ title: resolved.entry.data.title, url: resolved.url, why: item.why[locale] }] : [];
      }),
    }))
    .filter((group) => group.items.length > 0);
  const faqs = (hub.faqs ?? []).flatMap((faq) => {
    const resolved = link(faq.key);
    return resolved ? [{ q: faq.q[locale], a: faq.a[locale], url: resolved.url, title: resolved.entry.data.title }] : [];
  });
  return { title: hub.title[locale], description: hub.description[locale], intro: hub.intro[locale], groups, faqs };
}
