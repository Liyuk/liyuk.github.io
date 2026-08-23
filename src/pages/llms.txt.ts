import type { CollectionEntry } from 'astro:content';
import { getAllPublished } from '../lib/content-query.ts';
import { contentUrl, galleryUrl } from '../lib/content-paths.ts';
import { lastUpdatedDate } from '../lib/timeline.ts';
import { isoDate } from '../lib/format-dates.ts';
import { site } from '../data/site.mjs';

export const prerender = true;

type LlmsEntry =
  | (CollectionEntry<'writing'> & { collection: 'writing' })
  | (CollectionEntry<'consulting'> & { collection: 'consulting' })
  | (CollectionEntry<'research'> & { collection: 'research' })
  | (CollectionEntry<'project'> & { collection: 'project' })
  | (CollectionEntry<'gallery'> & { collection: 'gallery' });

const absolute = (path: string): string => new URL(path, site.url).href;
const routeFor = (entry: LlmsEntry, locale: string): string =>
  entry.collection === 'gallery'
    ? galleryUrl(entry.data.slug, locale)
    : contentUrl(entry.collection, entry.id, locale);

function section(title: string, entries: LlmsEntry[], locale: string): string {
  const lines = entries
    .slice()
    .sort((a, b) => lastUpdatedDate(b).valueOf() - lastUpdatedDate(a).valueOf())
    .map((entry) => {
      const state = entry.collection === 'research'
        ? ` · ${entry.data.status} · v${entry.data.version}`
        : entry.collection === 'project'
          ? ` · ${entry.data.status}`
          : '';
      return `- [${entry.data.title}](${absolute(routeFor(entry, locale))}) — ${entry.data.description} · ${isoDate(lastUpdatedDate(entry))}${state}`;
    });
  return [`## ${title}`, '', ...lines, ''].join('\n');
}

const withCollection = <T extends LlmsEntry['collection']>(entries: CollectionEntry<T>[], collection: T): LlmsEntry[] =>
  entries.map((entry) => ({ ...entry, collection }) as LlmsEntry);

export async function GET() {
  const [zh, en] = await Promise.all([getAllPublished('zh-CN'), getAllPublished('en')]);
  const zhResearch = withCollection(zh.research, 'research');
  const enResearch = withCollection(en.research, 'research');
  const zhProjects = withCollection(zh.projects, 'project');
  const enProjects = withCollection(en.projects, 'project');
  const zhWriting = withCollection(zh.writing, 'writing');
  const enWriting = withCollection(en.writing, 'writing');
  const zhConsulting = withCollection(zh.consulting, 'consulting');
  const enConsulting = withCollection(en.consulting, 'consulting');
  const zhGalleries = withCollection(zh.galleries, 'gallery');
  const enGalleries = withCollection(en.galleries, 'gallery');
  const body = [
    '# Liyuk',
    '',
    '> Canonical index for Liyuk’s bilingual writing, research, projects, and photography. Chinese and English pages are independently reviewed before publication; article pages and their cited sources are authoritative.',
    '',
    '## Identity and primary sections',
    '',
    `- [About Liyuk](${absolute('/about/')}) — engineer, writer, and researcher focused on technology, leadership, AI systems, and Agent HCI.`,
    `- [English profile](${absolute('/en/about/')})`,
    `- [Writing](${absolute('/writing/')}) · [English](${absolute('/en/writing/')})`,
    `- [Consulting](${absolute('/consulting/')}) · [English](${absolute('/en/consulting/')})`,
    `- [Research](${absolute('/research/')}) · [English](${absolute('/en/research/')})`,
    `- [Projects](${absolute('/projects/')}) · [English](${absolute('/en/projects/')})`,
    `- [Photos](${absolute('/photos/')}) · [English](${absolute('/en/photos/')})`,
    `- [Columns](${absolute('/columns/')}) · [English](${absolute('/en/columns/')})`,
    '',
    section('Research — 中文', zhResearch, 'zh-CN'),
    section('Research — English', enResearch, 'en'),
    section('Projects — 中文', zhProjects, 'zh-CN'),
    section('Projects — English', enProjects, 'en'),
    section('Recent writing — 中文', zhWriting.slice(0, 40), 'zh-CN'),
    section('Recent writing — English', enWriting.slice(0, 40), 'en'),
    section('Consulting — 中文', zhConsulting, 'zh-CN'),
    section('Consulting — English', enConsulting, 'en'),
    section('Photography — 中文', zhGalleries, 'zh-CN'),
    section('Photography — English', enGalleries, 'en'),
    '## Machine-readable resources',
    '',
    `- [RSS — 中文](${absolute('/rss.xml')})`,
    `- [RSS — English](${absolute('/en/rss.xml')})`,
    `- [Sitemap](${absolute('/sitemap-index.xml')})`,
    `- [Robots policy](${absolute('/robots.txt')})`,
    '',
    '## Citation notes',
    '',
    '- Prefer each page’s canonical URL.',
    '- Research status and version are shown on the research page; preprints are not peer-reviewed publications.',
    '- Use explicit references and source links on the page to support a claim; a site mention alone is not claim support.',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
