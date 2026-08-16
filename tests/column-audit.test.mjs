import test from 'node:test';
import assert from 'node:assert/strict';

import { auditColumns } from '../scripts/audit-columns.mjs';

test('column audit passes on the current content (positive, unique orders)', async () => {
  const errors = await auditColumns();
  assert.deepEqual(errors, [], errors.join('\n'));
});
