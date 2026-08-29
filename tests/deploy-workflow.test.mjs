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

test('master verification runs queue instead of cancelling each other', () => {
  const verify = jobBlock('verify');
  // A cancelled master run never reaches `notify`, and the next push's
  // `github.event.before` starts after the commits it skipped -- so their
  // content lands in no notification window at all.
  assert.match(verify, /cancel-in-progress:\s*\$\{\{\s*github\.event_name == 'pull_request'\s*\}\}/);
  assert.doesNotMatch(verify, /cancel-in-progress:\s*true/);
});

test('deploy only runs off master, after a successful verification', () => {
  const deploy = jobBlock('deploy');
  assert.match(deploy, /needs:\s*verify/);
  assert.match(deploy, /needs\.verify\.result == 'success'/);
  assert.match(deploy, /github\.ref == 'refs\/heads\/master'/);
});

test('purge and notify are independent consequences of a successful deploy', () => {
  const purge = jobBlock('purge');
  const notify = jobBlock('notify');
  for (const [name, job] of [['purge', purge], ['notify', notify]]) {
    assert.match(job, /needs:\s*deploy/, `${name} should hang off deploy`);
    assert.match(job, /needs\.deploy\.result == 'success'/, `${name} should require a successful deploy`);
  }
  // Neither may gate the other: a stale list page must not hold back a
  // subscriber email, and a mail failure must not leave the CDN stale.
  assert.doesNotMatch(notify, /needs:.*purge/);
  assert.doesNotMatch(purge, /needs:.*notify/);
});

test('missing credentials skip their job with an explanation instead of failing', () => {
  const purge = jobBlock('purge');
  const notify = jobBlock('notify');
  assert.match(purge, /CLOUDFLARE_API_TOKEN != ''/);
  assert.match(purge, /CLOUDFLARE_ZONE_ID != ''/);
  assert.match(purge, /Explain skipped purge/);
  assert.match(notify, /BUTTONDOWN_API_KEY != ''/);
  assert.match(notify, /Explain skipped notification/);
});

test('pull requests do no Pages work', () => {
  const verify = jobBlock('verify');
  const pagesSteps = verify.split('\n').filter((line) => /configure-pages|upload-pages-artifact/.test(line));
  assert.equal(pagesSteps.length, 2);
  assert.equal((verify.match(/if: \$\{\{ github\.ref == 'refs\/heads\/master' \}\}/g) ?? []).length, 2);
});
