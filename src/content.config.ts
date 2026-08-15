import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { parseContentDate } from './lib/content-date.mjs';

const contentDate = z.preprocess(parseContentDate, z.date());

const writing = defineCollection({
  loader: glob({ base: './src/content/writing', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
    translationStatus: z.enum(['original', 'draft', 'reviewed']).default('original'),
    createdAt: contentDate,
    publishedAt: contentDate.optional(),
    updatedAt: contentDate.optional(),
    notification: z.enum(['publish', 'update', 'never']).default('publish'),
    type: z.enum(['essay', 'note', 'case-study']).default('essay'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    column: z.object({ slug: z.string(), order: z.number().int().positive() }).optional(),
    translationKey: z.string().optional(),
  }).strict(),
});

const project = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
    createdAt: contentDate,
    publishedAt: contentDate.optional(),
    updatedAt: contentDate.optional(),
    status: z.enum(['active', 'maintained', 'archived']),
    repositoryUrl: z.string().url(),
    paperUrl: z.string().url().optional(),
    hero: z.object({
      src: z.string().startsWith('/'),
      alt: z.string().min(1),
      caption: z.string().min(1).optional(),
    }).optional(),
    draft: z.boolean().default(false),
    // 作品类 project（如小说）：指向外部平台的链接
    workUrl: z.string().url().optional(),
    // 作品的元数据：笔名、平台、连载状态、封面（封面由作者后续放入，占位时省略 src）
    work: z.object({
      penName: z.string().optional(),
      platform: z.string().optional(),
      status: z.string().optional(),
      cover: z.string().startsWith('/').optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
    translationKey: z.string().optional(),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    createdAt: contentDate,
    publishedAt: contentDate.optional(),
    version: z.string(),
    status: z.enum(['preprint', 'published', 'in-progress']),
    repositoryUrl: z.string().url().optional(),
    paperUrl: z.string().url().optional(),
    locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    translationKey: z.string().optional(),
  }).refine((data) => data.repositoryUrl || data.paperUrl, {
    message: 'research 至少需要 repositoryUrl 或 paperUrl 中的一个。',
    path: ['repositoryUrl'],
  }),
});

const galleryImage = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'Use a stable lowercase image id.'),
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  caption: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const gallery = defineCollection({
  loader: glob({ base: './src/content/galleries', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Use a stable lowercase gallery slug.'),
    locale: z.enum(['zh-CN', 'en']).default('zh-CN'),
    createdAt: contentDate,
    publishedAt: contentDate.optional(),
    updatedAt: contentDate.optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    column: z.object({ slug: z.string(), order: z.number().int().positive() }).optional(),
    cover: z.string().regex(/^[a-z0-9-]+$/),
    images: z.array(galleryImage).min(1),
  }).refine((data) => data.images.some((image) => image.id === data.cover), {
    message: 'Gallery cover must reference an image id.',
    path: ['cover'],
  }),
});

export const collections = { writing, project, research, gallery };
