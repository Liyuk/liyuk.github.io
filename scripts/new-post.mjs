// Interactive content creator for writing / research / project entries.
// Run: npm run new:post
// Uses Node built-ins only. Pure functions are exported for tests.
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { tags, columns } from '../src/lib/taxonomy.mjs';
import { buildFrontmatter, buildSlug, createPrompter, isValidDate, isValidSlug, todayStr, validateDate, validateSlug } from './lib/cli.mjs';

const CONTENT_ROOT = path.join(process.cwd(), 'src/content');
const TYPE_CHOICES = [
  { key: 'article', label: '文章 (writing)' },
  { key: 'research', label: '研究 (research)' },
  { key: 'project', label: '项目 (projects)' },
];
const STATUS_CHOICES = ['preprint', 'published', 'in-progress'];
const ARTICLE_TYPE_CHOICES = ['essay', 'note', 'case-study'];

// --- pure helpers (exported for tests) ---

export function parseTags(raw) {
  return raw
    .split(/[,，\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function pickSlug(title, asked) {
  if (asked) return asked;
  return buildSlug(title);
}

export function buildPostFrontmatter(type, answers) {
  const common = {
    title: answers.title,
    description: answers.description,
    createdAt: answers.createdAt,
    draft: answers.draft,
    tags: answers.tags,
  };
  if (type === 'article') {
    return {
      ...common,
      publishedAt: answers.publishedAt,
      type: answers.type ?? 'essay',
      notification: 'never',
      ...(answers.column ? { column: answers.column } : {}),
    };
  }
  if (type === 'research') {
    return {
      ...common,
      version: answers.version,
      status: answers.status ?? 'preprint',
      repositoryUrl: answers.repositoryUrl,
      paperUrl: answers.paperUrl,
    };
  }
  if (type === 'project') {
    const base = {
      ...common,
      status: answers.status ?? 'active',
      repositoryUrl: answers.repositoryUrl,
    };
    if (answers.paperUrl) base.paperUrl = answers.paperUrl;
    if (answers.hero) base.hero = answers.hero;
    if (answers.work) base.work = answers.work;
    if (answers.workUrl) base.workUrl = answers.workUrl;
    return base;
  }
  throw new Error(`Unknown type: ${type}`);
}

export function postPath(type, createdAt, slug) {
  const dirName = type === 'article' ? 'writing' : type === 'project' ? 'projects' : type;
  const [year, month] = createdAt.split('-');
  return path.join(CONTENT_ROOT, dirName, year, month, slug, 'zh.md');
}

export function resolveSlug(rl, title) {
  const auto = buildSlug(title);
  if (auto) return auto;
  return rl.ask('slug（URL 用，小写连字符）: ', { validate: validateSlug });
}

// --- main flow ---

async function main() {
  const rl = createPrompter();
  try {
    console.log('创建新内容 — 默认标记为草稿（draft: true），改回 false 才会发布。\n');

    // 1. type
    console.log('要创建哪种内容？');
    TYPE_CHOICES.forEach((c, i) => console.log(`  ${i + 1}) ${c.label}`));
    const typeAnswer = await rl.ask('输入序号（1-3）或类型名: ', {
      validate: (v) => {
        const byIndex = TYPE_CHOICES[Number(v) - 1];
        const byName = TYPE_CHOICES.find((c) => c.key === v);
        return byIndex || byName ? null : '请选择 1-3，或输入 article / research / project';
      },
    });
    const type = (TYPE_CHOICES[Number(typeAnswer) - 1] ?? TYPE_CHOICES.find((c) => c.key === typeAnswer) ?? TYPE_CHOICES[0]).key;

    // 2. title
    const typeLabel = { article: '文章', research: '研究', project: '项目' }[type];
    const title = await rl.ask(`${typeLabel}标题（必填）: `, {
      validate: (v) => (v ? null : '标题不能为空'),
    });

    // 3. slug
    const slug = await resolveSlug(rl, title);

    // 4. createdAt
    const createdAt = await rl.ask('创建日期（YYYY-MM-DD）', { default: todayStr(), validate: validateDate });

    // 5. description
    const description = await rl.ask(`${typeLabel}描述（一句话，必填）: `, {
      validate: (v) => (v ? null : '描述不能为空'),
    });

    // 6. tags
    const allTags = Object.keys(tags);
    let tagsList = [];
    if (allTags.length > 0) {
      console.log(`已知标签（${allTags.length} 个，逗号分隔输入）：`);
      console.log(`  ${allTags.join('、')}`);
      const tagsAnswer = await rl.ask('标签（可留空）: ', {
        validate: (v) => {
          if (!v) return null;
          const unknown = parseTags(v).filter((t) => !(t in tags));
          if (unknown.length) {
            console.log(`  · 新标签：${unknown.join('、')}（不在注册表，显示为原样；如要双语显示需加入 src/lib/taxonomy.mjs）`);
          }
          return null;
        },
      });
      tagsList = parseTags(tagsAnswer);
    }

    // 7. draft (default true)
    const draftAnswer = (await rl.ask('标记为草稿？', { default: 'y' })).toLowerCase();
    const draft = draftAnswer !== 'n' && draftAnswer !== 'no';

    const answers = { title, description, createdAt, draft, tags: tagsList, slug };

    // 8. type-specific fields
    if (type === 'article') {
      answers.publishedAt = await rl.ask('发布日期（YYYY-MM-DD）', { default: createdAt, validate: validateDate });
      console.log('文章类型：1=essay 2=note 3=case-study');
      const typeAnswer2 = await rl.ask('选择（1-3）', {
        default: '1',
        validate: (v) => (ARTICLE_TYPE_CHOICES[Number(v) - 1] ? null : '请输入 1-3'),
      });
      answers.type = ARTICLE_TYPE_CHOICES[Number(typeAnswer2) - 1] ?? 'essay';
      answers.column = await askColumn(rl);
    } else if (type === 'research') {
      answers.version = await rl.ask('版本号（如 0.1）', { default: '0.1' });
      console.log('状态：1=preprint 2=published 3=in-progress');
      const statusAnswer = await rl.ask('选择（1-3）', {
        default: '1',
        validate: (v) => (STATUS_CHOICES[Number(v) - 1] ? null : '请输入 1-3'),
      });
      answers.status = STATUS_CHOICES[Number(statusAnswer) - 1] ?? 'preprint';
      const repositoryUrl = await rl.ask('仓库 URL（可留空）: ');
      const paperUrl = await rl.ask('论文 URL（可留空）: ');
      if (!repositoryUrl && !paperUrl) {
        console.log('  ⚠ research 至少需要 repositoryUrl 或 paperUrl 中的一个。');
        return;
      }
      answers.repositoryUrl = repositoryUrl;
      answers.paperUrl = paperUrl;
    } else {
      const projectFields = await askProject(rl, slug);
      Object.assign(answers, projectFields);
    }

    const frontmatter = buildFrontmatter(buildPostFrontmatter(type, answers));
    const filePath = postPath(type, createdAt, slug);

    console.log('\n预览 frontmatter：');
    console.log(frontmatter);
    console.log(`将写入：${filePath}`);

    if (existsSync(filePath)) {
      console.log(`  ⚠ 该文件已存在，不会覆盖：${filePath}`);
      return;
    }

    const confirmed = (await rl.ask('确认创建？[y/N]')).toLowerCase();
    if (confirmed !== 'y' && confirmed !== 'yes') {
      console.log('  已取消。');
      return;
    }

    const body = `${frontmatter}# ${title}\n\n（在此书写正文。当前为草稿，发布前请把 draft 改为 false。）\n`;
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, 'utf8');
    console.log(`\n✔ 已创建：${filePath}`);
    console.log('  下一步：编辑正文，然后运行 npm run publish <slug> 发布（或把 draft 改为 false）。');
  } finally {
    rl.close();
  }
}

async function askColumn(rl) {
  const colNames = Object.keys(columns);
  if (colNames.length === 0) return null;
  console.log('可选专栏（回车 = 无）：');
  colNames.forEach((c, i) => console.log(`  ${i + 1}) ${columns[c].label['zh-CN']}`));
  const answer = await rl.ask('所属专栏（回车 = 无）: ', {
    validate: (v) => {
      if (!v) return null; // empty → skip
      const byIndex = colNames[Number(v) - 1];
      const byName = colNames.find((c) => c === v || columns[c].label['zh-CN'] === v);
      return byIndex || byName ? null : '请选择序号或输入专栏 slug';
    },
  });
  if (!answer) return null;
  const slug = colNames[Number(answer) - 1] ?? colNames.find((c) => c === answer || columns[c].label['zh-CN'] === answer);
  if (!slug) return null;
  const orderAnswer = await rl.ask('该文章在专栏中的顺序（正整数）', {
    default: '1',
    validate: (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? null : '请输入正整数'),
  });
  return { slug, order: Number(orderAnswer) };
}

async function askProject(rl, slug) {
  console.log('项目类型：1=工具/开源 2=作品（小说/书）');
  const kindAnswer = await rl.ask('选择（1-2）', {
    default: '1',
    validate: (v) => (v === '1' || v === '2' ? null : '请输入 1 或 2'),
  });
  if (kindAnswer === '2') {
    const workUrl = await rl.ask('作品平台 URL（必填）: ', { validate: (v) => (v ? null : '不能为空') });
    const penName = await rl.ask('笔名（可留空）: ');
    const platform = await rl.ask('平台名（可留空）: ');
    const workStatus = await rl.ask('连载状态（如 连载中，可留空）: ');
    const cover = await rl.ask('封面路径（如 /images/projects/xxx/cover.webp，可留空）: ');
    return {
      repositoryUrl: workUrl,
      workUrl,
      work: {
        ...(penName ? { penName } : {}),
        ...(platform ? { platform } : {}),
        ...(workStatus ? { status: workStatus } : {}),
        ...(cover ? { cover } : {}),
      },
    };
  }
  const repositoryUrl = await rl.ask('仓库 URL', { default: `https://github.com/Liyuk/${slug}` });
  const paperUrl = await rl.ask('论文 URL（可留空）: ');
  const hero = await askHero(rl);
  return { repositoryUrl, paperUrl: paperUrl || undefined, hero };
}

async function askHero(rl) {
  const src = await rl.ask('hero 图路径（可留空）: ');
  if (!src) return undefined;
  const alt = await rl.ask('hero 图 alt（必填）: ', { validate: (v) => (v ? null : 'alt 不能为空') });
  const caption = await rl.ask('hero 图 caption（可留空）: ');
  return { src, alt, ...(caption ? { caption } : {}) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
