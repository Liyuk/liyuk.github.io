import test from 'node:test';
import assert from 'node:assert/strict';

import { summarizeFailure } from '../scripts/publish-check.mjs';

test('publish-check retains bounded stdout and stderr diagnostics', () => {
  const detail = summarizeFailure({
    code: 1,
    stdout: 'setup\nroot cause from stdout',
    stderr: 'warning from stderr',
  });

  assert.match(detail, /stdout/);
  assert.match(detail, /root cause from stdout/);
  assert.match(detail, /stderr/);
  assert.match(detail, /warning from stderr/);
});

test('publish-check identifies a process that could not start', () => {
  const detail = summarizeFailure({
    code: null,
    error: new Error('spawn npm ENOENT'),
    stdout: '',
    stderr: '',
  });

  assert.match(detail, /无法启动/);
  assert.match(detail, /spawn npm ENOENT/);
});

test('publish-check distinguishes a signal from an exit code', () => {
  const detail = summarizeFailure({
    code: null,
    signal: 'SIGTERM',
    stdout: '',
    stderr: '',
  });

  assert.match(detail, /SIGTERM/);
  assert.match(detail, /信号/);
});
