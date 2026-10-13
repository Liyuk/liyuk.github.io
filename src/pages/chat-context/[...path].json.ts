import { getPublishedContentCorpus, type ContentLocale } from '../../lib/published-content-corpus.ts';
import { cleanArticleMarkdown } from '../../lib/site-chat.mjs';

export const prerender = true;

export async function getStaticPaths() {
  const paths = [];
  for (const locale of ['zh-CN', 'en'] as const) {
    const entries = await getPublishedContentCorpus(locale);

    for (const entry of entries) {
      const url = entry.url;
      paths.push({
        params: { path: url.replace(/^\/+|\/+$/gu, '') },
        props: { title: entry.title, url, locale, body: entry.body },
      });
    }
  }
  return paths;
}

export function GET({ props }: { props: { title: string; url: string; locale: ContentLocale; body: string } }) {
  return Response.json({
    title: props.title,
    url: props.url,
    locale: props.locale,
    text: cleanArticleMarkdown(props.body),
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
