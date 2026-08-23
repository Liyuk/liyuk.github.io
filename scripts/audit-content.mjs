// Cross-entry content audit. Astro validates each file against its schema; this
// script validates repository-wide agreements that a single entry cannot see:
// locale file conventions, translation pairs, shared metadata, taxonomy, and
// obvious public-content safety signals.
//
// Run: npm run audit:content
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tags as tagRegistry } from '../src/lib/taxonomy.ts';
import { translationStatusForLocale } from '../src/lib/content-model.ts';

export const TRANSLATION_POLICY = {
  writing: 'required',
  consulting: 'required',
  projects: 'required',
  galleries: 'required',
  // Research English routes deliberately use the documented zh-CN fallback while
  // a translation is pending. Each exception remains visible as a warning.
  research: 'fallback-allowed',
};

const CONTENT_COLLECTIONS = Object.keys(TRANSLATION_POLICY);
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---(?:\n|$)/;
const URL_FIELDS = ['repositoryUrl', 'paperUrl', 'workUrl'];
const SENSITIVE_PATTERNS = [
  /(?:api[_-]?key|access[_-]?token|secret)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i,
  /\bsk-[A-Za-z0-9]{16,}\b/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
];

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

function frontmatterOf(raw) {
  return raw.match(FRONTMATTER_RE)?.[1] ?? null;
}

function valueOf(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function unquote(value) {
  return value?.replace(/^(['"])(.*)\1$/, '$2') ?? value;
}

function boolOf(frontmatter, key, fallback = false) {
  const value = valueOf(frontmatter, key);
  if (value == null) return fallback;
  return value === 'true';
}

function inlineList(value) {
  if (!value || !value.startsWith('[') || !value.endsWith(']')) return [];
  return value
    .slice(1, -1)
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter(Boolean);
}

function tagsOf(frontmatter) {
  return [...inlineList(valueOf(frontmatter, 'tags'))].sort();
}

function columnOf(frontmatter) {
  return (valueOf(frontmatter, 'column') ?? '').replace(/\s+/g, '');
}

function entryDescriptor(contentRoot, file) {
  const rel = normalizePath(path.relative(contentRoot, file));
  const segments = rel.split('/');
  const [collection] = segments;
  if (!CONTENT_COLLECTIONS.includes(collection)) return null;

  const filename = segments.at(-1);
  if (!filename || filename.startsWith('_') || !/\.(md|mdx)$/.test(filename)) return null;

  if (collection === 'galleries') {
    const slug = filename.replace(/\.en\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, '');
    return {
      collection,
      key: slug,
      localeFromName: filename.includes('.en.') ? 'en' : 'zh-CN',
      relativePath: rel,
    };
  }

  if (segments.length !== 5 || !['zh.md', 'zh.mdx', 'en.md', 'en.mdx'].includes(filename)) {
    return { collection, key: null, localeFromName: null, relativePath: rel };
  }
  return {
    collection,
    key: segments.slice(1, 4).join('/'),
    localeFromName: filename.startsWith('en.') ? 'en' : 'zh-CN',
    relativePath: rel,
  };
}

function reportSafetySignals(raw, relativePath, warnings) {
  if (/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\b/i.test(raw)) {
    warnings.push(
      `${relativePath}: 包含 localhost/127.0.0.1 示例；确认它是面向读者的示例而非私有地址。`,
    );
  }
  if (/(?:^|[\s"'])\/(?:Users|home)\//m.test(raw)) {
    warnings.push(`${relativePath}: 包含本机绝对路径；发布前确认不泄露个人目录信息。`);
  }
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(raw))) {
    warnings.push(`${relativePath}: 命中疑似密钥/令牌模式；发布前必须人工复核。`);
  }
}

function compareSharedMetadata(source, translation, errors) {
  for (const key of ['createdAt', 'publishedAt']) {
    const left = valueOf(source.frontmatter, key) ?? '';
    const right = valueOf(translation.frontmatter, key) ?? '';
    if (left !== right) {
      errors.push(
        `${translation.relativePath}: ${key} 必须与中文源文件 ${source.relativePath} 一致。`,
      );
    }
  }

  if (boolOf(source.frontmatter, 'draft') !== boolOf(translation.frontmatter, 'draft')) {
    errors.push(
      `${translation.relativePath}: draft 必须与中文源文件 ${source.relativePath} 一致。`,
    );
  }

  if (tagsOf(source.frontmatter).join('|') !== tagsOf(translation.frontmatter).join('|')) {
    errors.push(`${translation.relativePath}: tags 必须与中文源文件 ${source.relativePath} 一致。`);
  }

  if (columnOf(source.frontmatter) !== columnOf(translation.frontmatter)) {
    errors.push(
      `${translation.relativePath}: column 必须与中文源文件 ${source.relativePath} 一致。`,
    );
  }
}

function validateUrls(entry, errors) {
  for (const field of URL_FIELDS) {
    const raw = valueOf(entry.frontmatter, field);
    if (raw && !/^https:\/\//.test(unquote(raw))) {
      errors.push(`${entry.relativePath}: ${field} 必须使用 https URL。`);
    }
  }
}

export async function auditContent({ contentRoot = path.join(process.cwd(), 'src/content') } = {}) {
  const errors = [];
  const warnings = [];
  const entriesByArticle = new Map();

  for (const collection of CONTENT_COLLECTIONS) {
    const files = await walk(path.join(contentRoot, collection));
    for (const file of files.filter((candidate) => /\.(md|mdx)$/.test(candidate))) {
      const raw = await readFile(file, 'utf8');
      const descriptor = entryDescriptor(contentRoot, file);
      if (!descriptor) continue;
      if (!descriptor.key || !descriptor.localeFromName) {
        errors.push(
          `${descriptor.relativePath}: 文件名必须遵循 zh.md/en.md（图集为 <slug>.md/<slug>.en.md）约定。`,
        );
        continue;
      }

      const frontmatter = frontmatterOf(raw);
      if (!frontmatter) {
        errors.push(`${descriptor.relativePath}: 缺少 YAML frontmatter。`);
        continue;
      }

      const entry = { ...descriptor, frontmatter, raw };
      const declaredLocale = unquote(valueOf(frontmatter, 'locale')) ?? 'zh-CN';
      if (declaredLocale !== descriptor.localeFromName) {
        errors.push(
          `${descriptor.relativePath}: 文件名对应 locale ${descriptor.localeFromName}，实际为 ${declaredLocale}。`,
        );
      }

      const expectedTranslationKey = descriptor.key;
      const translationKey = unquote(valueOf(frontmatter, 'translationKey'));
      if (translationKey && translationKey !== expectedTranslationKey) {
        errors.push(
          `${descriptor.relativePath}: translationKey 应为 "${expectedTranslationKey}"，实际为 "${translationKey}"。`,
        );
      }
      const status = unquote(valueOf(frontmatter, 'translationStatus')) ?? 'original';
      const isDraft = boolOf(frontmatter, 'draft');
      if (descriptor.localeFromName === 'zh-CN') {
        if (status !== 'original') {
          errors.push(`${descriptor.relativePath}: 中文源文件 translationStatus 必须为 original。`);
        }
      } else {
        if (!translationKey)
          errors.push(`${descriptor.relativePath}: 英文文件必须声明 translationKey。`);
        if (!['draft', 'reviewed'].includes(status)) {
          errors.push(
            `${descriptor.relativePath}: 英文文件 translationStatus 必须为 draft 或 reviewed。`,
          );
        }
      }
      if (!isDraft && status !== translationStatusForLocale(declaredLocale)) {
        errors.push(
          `${descriptor.relativePath}: 已发布的 ${declaredLocale} 内容 translationStatus 必须为 ${translationStatusForLocale(declaredLocale)}。`,
        );
      }

      for (const tag of tagsOf(frontmatter)) {
        if (!(tag in tagRegistry)) errors.push(`${descriptor.relativePath}: 未注册标签 "${tag}"。`);
      }
      validateUrls(entry, errors);
      reportSafetySignals(raw, descriptor.relativePath, warnings);

      const articleId = `${descriptor.collection}/${descriptor.key}`;
      const variants = entriesByArticle.get(articleId) ?? {};
      if (variants[descriptor.localeFromName]) {
        errors.push(
          `${descriptor.relativePath}: 与 ${variants[descriptor.localeFromName].relativePath} 产生重复的 ${descriptor.localeFromName} 内容变体。`,
        );
      }
      variants[descriptor.localeFromName] = entry;
      entriesByArticle.set(articleId, variants);
    }
  }

  for (const [articleId, variants] of entriesByArticle) {
    const source = variants['zh-CN'];
    const translation = variants.en;
    if (!source && translation) {
      errors.push(`${translation.relativePath}: 英文文件缺少对应中文源文件（${articleId}）。`);
      continue;
    }
    if (!source) continue;

    const sourceIsPublic = !boolOf(source.frontmatter, 'draft');
    const policy = TRANSLATION_POLICY[source.collection];
    if (sourceIsPublic && !translation) {
      const message = `${source.relativePath}: 已发布中文内容缺少英文 sibling；策略为 ${policy}。`;
      (policy === 'required' ? errors : warnings).push(message);
      continue;
    }
    if (translation) {
      compareSharedMetadata(source, translation, errors);
    }
  }

  return { errors, warnings };
}

async function main() {
  const { errors, warnings } = await auditContent();
  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);
  for (const error of errors) console.error(`  ✘ ${error}`);

  if (errors.length) {
    console.error(`\n内容审计未通过：${errors.length} 个错误，${warnings.length} 个警告。`);
    process.exitCode = 1;
  } else {
    console.log(`内容审计通过：${warnings.length} 个需要人工复核的警告。`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
