import { site } from '../data/site.mjs';

export type PageKind = 'website' | 'collection' | 'writing' | 'consulting' | 'research' | 'project' | 'gallery';

export interface StructuredDataImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface StructuredDataInput {
  origin: string;
  locale: string;
  canonicalUrl: string;
  title: string;
  description: string;
  pageKind?: PageKind;
  section?: string;
  image?: string;
  galleryImages?: StructuredDataImage[];
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  citations?: string[];
  repositoryUrl?: string;
  paperUrl?: string;
  status?: string;
  version?: string;
  isWork?: boolean;
}

const absolute = (origin: string, value: string): string => new URL(value, origin).href;
const idFor = (url: string, fragment: string): string => `${url.replace(/\/$/, '')}${fragment}`;

export function buildStructuredData(input: StructuredDataInput) {
  const {
    origin,
    locale,
    canonicalUrl,
    title,
    description,
    pageKind = 'website',
    section,
    image,
    galleryImages = [],
    publishedAt,
    updatedAt,
    keywords = [],
    citations = [],
    repositoryUrl,
    paperUrl,
    status,
    version,
    isWork = false,
  } = input;
  const authorId = idFor(origin, '/about/#person');
  const organizationId = idFor(origin, '/#organization');
  const websiteId = idFor(origin, '/#website');
  const pageId = `${canonicalUrl}#webpage`;
  const contentId = `${canonicalUrl}#content`;
  const imageValues = galleryImages.length > 0 ? galleryImages : image ? [{ src: image, alt: title }] : [];
  const images = imageValues.map((item) => ({
    '@type': 'ImageObject',
    contentUrl: absolute(origin, item.src),
    url: absolute(origin, item.src),
    name: item.alt,
    caption: item.caption,
    width: item.width,
    height: item.height,
  }));

  const identity: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: origin,
      name: site.name,
      alternateName: site.nameEn,
      description: site.description,
      inLanguage: ['zh-CN', 'en'],
      publisher: { '@id': organizationId },
      author: { '@id': authorId },
    },
    {
      '@type': 'Person',
      '@id': authorId,
      name: site.name,
      url: absolute(origin, locale === 'en' ? '/en/about/' : '/about/'),
      image: absolute(origin, '/images/avatar.webp'),
      email: `mailto:${site.email}`,
      sameAs: Object.values(site.social),
      jobTitle: 'Engineer, writer, and researcher',
      knowsAbout: ['engineering', 'AI systems', 'leadership', 'Agent HCI', 'technical communication'],
    },
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: site.brand,
      alternateName: site.brandEn,
      url: origin,
      sameAs: Object.values(site.social),
      founder: { '@id': authorId },
    },
  ];

  const webPage: Record<string, unknown> = {
    '@type': pageKind === 'collection' ? 'CollectionPage' : 'WebPage',
    '@id': pageId,
    url: canonicalUrl,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { '@id': websiteId },
    about: { '@id': authorId },
    author: { '@id': authorId },
    publisher: { '@id': organizationId },
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    primaryImageOfPage: images[0],
    mainEntity: pageKind === 'website' || pageKind === 'collection' ? undefined : { '@id': contentId },
  };

  const graph: Record<string, unknown>[] = [...identity, webPage];
  if (pageKind !== 'website') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: origin },
        ...(section ? [{ '@type': 'ListItem', position: 2, name: section, item: absolute(origin, locale === 'en' ? `/en/${section}/` : `/${section}/`) }] : []),
        { '@type': 'ListItem', position: section ? 3 : 2, name: title, item: canonicalUrl },
      ],
    });
  }

  if (pageKind === 'gallery') {
    graph.push({
      '@type': 'ImageGallery',
      '@id': contentId,
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      author: { '@id': authorId },
      image: images,
      datePublished: publishedAt,
      dateModified: updatedAt ?? publishedAt,
      keywords,
    });
  } else if (pageKind === 'research') {
    graph.push({
      '@type': 'ScholarlyArticle',
      '@id': contentId,
      headline: title,
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      author: { '@id': authorId },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': pageId },
      datePublished: publishedAt,
      dateModified: updatedAt ?? publishedAt,
      version,
      status,
      image: images[0],
      keywords,
      citation: citations,
      isBasedOn: [paperUrl, repositoryUrl].filter(Boolean),
    });
  } else if (pageKind === 'project') {
    graph.push({
      '@type': isWork ? 'CreativeWork' : 'SoftwareSourceCode',
      '@id': contentId,
      name: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      author: { '@id': authorId },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': pageId },
      dateCreated: publishedAt,
      dateModified: updatedAt ?? publishedAt,
      image: images[0],
      keywords,
      codeRepository: isWork ? undefined : repositoryUrl,
      isBasedOn: paperUrl ? [paperUrl] : undefined,
    });
  } else if (pageKind === 'writing' || pageKind === 'consulting') {
    graph.push({
      '@type': 'Article',
      '@id': contentId,
      headline: title,
      description,
      url: canonicalUrl,
      inLanguage: locale,
      author: { '@id': authorId },
      publisher: { '@id': organizationId },
      mainEntityOfPage: { '@id': pageId },
      datePublished: publishedAt,
      dateModified: updatedAt ?? publishedAt,
      image: images[0],
      keywords,
      articleSection: section,
      citation: citations,
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
