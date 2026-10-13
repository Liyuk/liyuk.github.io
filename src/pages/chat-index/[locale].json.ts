import { getPublishedContentCorpus, type ContentLocale } from '../../lib/published-content-corpus.ts';
import { createChatSearchIndex } from '../../lib/site-chat.mjs';

export const prerender = true;

export function getStaticPaths() {
  return ['zh-CN', 'en'].map((locale) => ({
    params: { locale },
    props: { locale: locale as ContentLocale },
  }));
}

export async function GET({ props }: { props: { locale: ContentLocale } }) {
  const { locale } = props;
  const documents = await getPublishedContentCorpus(locale);

  return Response.json(createChatSearchIndex(documents, { maxExcerptsPerDocument: 3 }), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
