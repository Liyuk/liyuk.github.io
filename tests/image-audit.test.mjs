import test from 'node:test';
import assert from 'node:assert/strict';

import { extractImageReferences } from '../scripts/audit-images.mjs';

test('image audit recognizes Markdown and frontmatter image references', () => {
  const references = extractImageReferences(`
![流程图](./images/workflow.svg)
![带空格的图](<./images/cover image.png>)
hero:
  src: /images/projects/example/hero.png
`);

  assert.deepEqual(references, [
    './images/workflow.svg',
    './images/cover image.png',
    '/images/projects/example/hero.png',
  ]);
});
