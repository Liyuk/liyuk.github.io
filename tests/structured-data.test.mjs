import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStructuredData } from '../src/lib/structured-data.ts';

const base = {
  origin: 'https://liyuk.com',
  locale: 'en',
  canonicalUrl: 'https://liyuk.com/en/research/2026/08/example/',
  title: 'Example research',
  description: 'A bounded research example.',
  publishedAt: '2026-08-20',
  updatedAt: '2026-08-21',
  keywords: ['hci'],
};

test('structured data uses stable site and author entity ids', () => {
  const data = buildStructuredData({ ...base, pageKind: 'research', section: 'research' });
  const website = data['@graph'].find((node) => node['@type'] === 'WebSite');
  const person = data['@graph'].find((node) => node['@type'] === 'Person');
  assert.equal(website['@id'], 'https://liyuk.com/#website');
  assert.equal(person['@id'], 'https://liyuk.com/about/#person');
  assert.ok(person.sameAs.includes('https://github.com/Liyuk'));
});

test('research structured data exposes scholarly type, freshness, and sources', () => {
  const data = buildStructuredData({
    ...base,
    pageKind: 'research',
    section: 'research',
    status: 'preprint',
    version: '0.3',
    paperUrl: 'https://example.com/paper',
    repositoryUrl: 'https://github.com/example/repo',
    citations: ['https://doi.org/10.1000/example'],
  });
  const research = data['@graph'].find((node) => node['@type'] === 'ScholarlyArticle');
  assert.equal(research.dateModified, '2026-08-21');
  assert.equal(research.version, '0.3');
  assert.deepEqual(research.citation, ['https://doi.org/10.1000/example']);
  assert.deepEqual(research.isBasedOn, ['https://example.com/paper', 'https://github.com/example/repo']);
});

test('gallery structured data includes every image object', () => {
  const data = buildStructuredData({
    ...base,
    canonicalUrl: 'https://liyuk.com/en/photos/example/',
    pageKind: 'gallery',
    section: 'photos',
    galleryImages: [
      { src: '/images/a.webp', alt: 'A', width: 100, height: 80 },
      { src: '/images/b.webp', alt: 'B', width: 120, height: 90 },
    ],
  });
  const gallery = data['@graph'].find((node) => node['@type'] === 'ImageGallery');
  assert.equal(gallery.image.length, 2);
  assert.equal(gallery.image[0].contentUrl, 'https://liyuk.com/images/a.webp');
});

test('a column exposes its chapters as an ordered ItemList the page points at', () => {
  const data = buildStructuredData({
    ...base,
    canonicalUrl: 'https://liyuk.com/columns/engineering-ai-judgment/',
    title: 'Engineering and AI judgment',
    pageKind: 'collection',
    section: 'columns',
    itemList: [
      { name: 'First chapter', url: '/research/2026/08/first/' },
      { name: 'Second chapter', url: '/research/2026/08/second/' },
    ],
  });

  const page = data['@graph'].find((node) => node['@type'] === 'CollectionPage');
  const list = data['@graph'].find((node) => node['@type'] === 'ItemList');
  assert.ok(list, 'a column page should carry an ItemList');
  assert.equal(list.numberOfItems, 2);
  assert.equal(page.mainEntity['@id'], list['@id']);
  assert.deepEqual(
    list.itemListElement.map((item) => [item.position, item.url]),
    [
      [1, 'https://liyuk.com/research/2026/08/first/'],
      [2, 'https://liyuk.com/research/2026/08/second/'],
    ],
  );
});

test('pages without an item list keep their previous mainEntity wiring', () => {
  const collection = buildStructuredData({ ...base, pageKind: 'collection', section: 'research' });
  const research = buildStructuredData({ ...base, pageKind: 'research', section: 'research' });
  assert.equal(collection['@graph'].some((node) => node['@type'] === 'ItemList'), false);
  assert.equal(collection['@graph'].find((node) => node['@type'] === 'CollectionPage').mainEntity, undefined);
  assert.ok(research['@graph'].find((node) => node['@type'] === 'WebPage').mainEntity['@id']);
});
