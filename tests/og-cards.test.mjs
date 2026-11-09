import test from 'node:test';
import assert from 'node:assert/strict';

import { cardHtml, cardSpec } from '../scripts/generate-og-cards.mjs';
import { ogCardUrl } from '../src/lib/seo.ts';

const page = ({ ogImage, graph = [] }) => `<!doctype html><html lang="en"><head>
<meta property="og:title" content="Fallback &amp; title — Brand" />
<meta property="og:image" content="${ogImage}" />
<meta property="article:section" content="Research" />
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
</head><body></body></html>`;

test('ogCardUrl maps routes to one PNG per page', () => {
  assert.equal(ogCardUrl('/writing/2026/05/slug/'), '/og/writing/2026/05/slug.png');
  assert.equal(ogCardUrl('/en/research/2026/08/x/'), '/og/en/research/2026/08/x.png');
  assert.equal(ogCardUrl('/'), '/og/index.png');
});

test('cardSpec reads headline, section, and date from the built page', () => {
  const spec = cardSpec(
    page({
      ogImage: 'https://liyuk.com/og/en/research/2026/08/x.png',
      graph: [
        { '@type': 'WebPage', name: 'Page' },
        { '@type': 'ScholarlyArticle', headline: 'A <real> title', datePublished: '2026-08-03T00:00:00.000Z' },
      ],
    }),
  );
  assert.deepEqual(spec, {
    output: '/og/en/research/2026/08/x.png',
    locale: 'en',
    title: 'A <real> title',
    section: 'Research',
    date: '2026-08-03',
  });
});

test('cardSpec ignores pages whose og:image is not a generated card', () => {
  assert.equal(cardSpec(page({ ogImage: 'https://liyuk.com/images/og-default.png' })), undefined);
});

test('cardSpec falls back to og:title when no content node exists', () => {
  assert.equal(cardSpec(page({ ogImage: 'https://liyuk.com/og/a.png' })).title, 'Fallback & title — Brand');
});

test('cardHtml escapes text and shrinks long titles', () => {
  const short = cardHtml({ locale: 'en', title: 'Hi <b>', section: '', date: '' });
  assert.match(short, /Hi &lt;b&gt;/);
  assert.match(short, /font-size:72px/);
  assert.match(cardHtml({ locale: 'zh-CN', title: '长'.repeat(60), section: '研究', date: '2026-01-01' }), /font-size:42px/);
});
