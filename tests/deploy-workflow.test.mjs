import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');

// Everything here is invisible until it misbehaves in production, which is why
// it is asserted rather than only documented.

function jobBlock(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, `job ${name} is missing`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][a-z-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

test('master verification is not interrupted by a later run', () => {
  const verify = jobBlock('verify');
  // This protects an active master verification. GitHub's pending-run policy
  // is documented separately because it is not equivalent to an unlimited queue.
  assert.match(verify, /cancel-in-progress:\s*\$\{\{\s*github\.event_name == 'pull_request'\s*\}\}/);
  assert.doesNotMatch(verify, /cancel-in-progress:\s*true/);
});

test('Cloudflare deployment runs only on master after successful verification', () => {
  const deploy = jobBlock('deploy');
  assert.match(deploy, /needs:\s*verify/);
  assert.match(deploy, /needs\.verify\.result == 'success'/);
  assert.match(deploy, /github\.ref == 'refs\/heads\/master'/);
  assert.match(deploy, /wrangler@4 pages deploy dist/);
  assert.match(deploy, /CLOUDFLARE_API_TOKEN/);
  assert.match(deploy, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(deploy, /CLOUDFLARE_PAGES_PROJECT/);
  assert.match(deploy, /download-artifact/);
});

test('Buttondown notification waits for a successful Cloudflare deployment', () => {
  const notify = jobBlock('notify');
  assert.match(notify, /needs:\s*deploy/);
  assert.match(notify, /needs\.deploy\.result == 'success'/);
  assert.match(notify, /BUTTONDOWN_API_KEY: \$\{\{ secrets\.BUTTONDOWN_API_KEY \}\}/);
});

test('missing Buttondown credentials skip notification with an explanation', () => {
  const notify = jobBlock('notify');
  assert.match(notify, /BUTTONDOWN_API_KEY != ''/);
  assert.match(notify, /Explain skipped notification/);
});

test('GitHub Actions no longer publishes a GitHub Pages site', () => {
  const verify = jobBlock('verify');
  assert.doesNotMatch(workflow, /configure-pages|upload-pages-artifact|deploy-pages/);
  assert.doesNotMatch(workflow, /  purge:/);
  assert.match(verify, /upload-artifact/);
  assert.match(verify, /if: \$\{\{ github\.ref == 'refs\/heads\/master' \}\}/);
});
