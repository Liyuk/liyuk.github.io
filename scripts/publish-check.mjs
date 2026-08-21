// Publish gate: run the full SEO + GEO discoverability contract before pushing content.
// Run: npm run publish:check
// Executes, in order: scoped format → content/image/column audits → unit tests → type check → build → SEO/GEO → link audit.
// A failure stops the pipeline and exits non-zero.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STEPS = [
  { name: '工程文件格式检查', command: 'npm', args: ['run', 'format:check'] },
  { name: '内容与双语审计', command: 'npm', args: ['run', 'audit:content'] },
  { name: '图片引用审计', command: 'npm', args: ['run', 'audit:images'] },
  { name: '专栏顺序审计', command: 'npm', args: ['run', 'audit:columns'] },
  { name: '单元测试', command: 'npm', args: ['test'] },
  { name: '类型检查', command: 'npm', args: ['run', 'check'] },
  { name: '生产构建', command: 'npm', args: ['run', 'build'] },
  { name: 'SEO 元数据审计', command: 'npm', args: ['run', 'audit:seo'] },
  { name: '站内链接审计', command: 'npm', args: ['run', 'audit:links'] },
];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  return { code: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function summarize(output, maxLines = 12) {
  const lines = output.trim().split('\n').filter(Boolean);
  return lines.slice(-maxLines).join('\n');
}

async function main() {
  console.log('发布前检查（SEO + GEO discoverability contract）— 全绿才能发布。\n');
  let failed = false;

  for (const step of STEPS) {
    process.stdout.write(`▶ ${step.name} ... `);
    const { code, stdout, stderr } = run(step.command, step.args);
    if (code === 0) {
      console.log('✔ 通过');
    } else {
      console.log('✘ 失败');
      failed = true;
      const detail = (stderr || stdout || '').trim();
      console.log(`\n--- ${step.name} 输出（末尾） ---\n${summarize(detail)}\n`);
      break;
    }
  }

  console.log(failed ? '\n✘ 有检查未通过，请修复后重跑。' : '\n✔ 全部通过，可以发布。');
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
