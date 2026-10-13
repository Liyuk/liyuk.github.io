import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

function hasClass(tag, className) {
  const classes = tag.match(/\bclass=(?:"([^"]*)"|'([^']*)')/i);
  return (classes?.[1] ?? classes?.[2] ?? '').split(/\s+/).includes(className);
}

function pageRoute(distDir, htmlFile) {
  const relativePath = path.relative(distDir, htmlFile).split(path.sep).join('/');
  return relativePath === 'index.html' ? '/' : `/${relativePath.replace(/index\.html$/, '')}`;
}

export async function auditRenderedContent({ distDir = path.join(process.cwd(), 'dist') } = {}) {
  let files;
  try {
    files = await walk(distDir);
  } catch {
    return { articles: 0, errors: [`找不到构建目录 ${path.relative(process.cwd(), distDir) || 'dist'}；请先运行 npm run build。`] };
  }

  const errors = [];
  let articles = 0;

  for (const htmlFile of files.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(htmlFile, 'utf8');
    const articleTags = [...html.matchAll(/<article\b[^>]*>/gi)].map((match) => match[0]);
    if (!articleTags.some((tag) => hasClass(tag, 'article') && hasClass(tag, 'shell'))) continue;

    articles++;
    const proseTags = [...html.matchAll(/<div\b[^>]*>/gi)]
      .filter((match) => hasClass(match[0], 'prose'))
      .map((match) => ({ tag: match[0], index: match.index }));

    if (proseTags.length === 0) {
      errors.push(`${pageRoute(distDir, htmlFile)}: 缺少正文容器。`);
      continue;
    }

    if (
      proseTags.every(({ tag, index }) => {
        const bodyStart = index + tag.length;
        return /^\s*<\/div\s*>/i.test(html.slice(bodyStart));
      })
    ) {
      errors.push(`${pageRoute(distDir, htmlFile)}: 正文容器为空。`);
    }
  }

  if (articles === 0) errors.push('没有找到文章详情页；构建输出可能不完整。');
  return { articles, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { articles, errors } = await auditRenderedContent();
  if (errors.length > 0) {
    console.error(`渲染正文审计失败（检查 ${articles} 篇文章）：`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`渲染正文审计通过：${articles} 篇文章正文均非空。`);
  }
}
