import test from 'node:test';
import assert from 'node:assert/strict';

import { auditColumns } from '../scripts/audit-columns.mjs';
import { columns as columnRegistry, startGroups } from '../src/lib/taxonomy.ts';

test('column audit passes on the current content (positive, unique orders)', async () => {
  const errors = await auditColumns();
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('start page groups cover every registered column exactly once', () => {
  const listed = startGroups.flatMap((group) => group.columns);
  const registered = Object.keys(columnRegistry);

  for (const slug of registered) {
    assert.equal(
      listed.filter((s) => s === slug).length,
      1,
      `专栏 "${slug}" 必须恰好出现在一个 start 分组里`,
    );
  }
  for (const slug of listed) {
    assert.ok(slug in columnRegistry, `start 分组引用了未注册的专栏 "${slug}"`);
  }
});
