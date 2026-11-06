import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveHub, topicHubs } from '../src/lib/topic-hubs.ts';

function entriesForHubs() {
  const keys = Object.values(topicHubs).flatMap((hub) => [
    ...hub.groups.flatMap((group) => group.items.map((item) => item.key)),
    ...(hub.faqs ?? []).map((faq) => faq.key),
  ]);
  return [...new Set(keys)].map((key) => {
    const [rawCollection, id] = key.split(':');
    const collection = rawCollection === 'projects' ? 'project' : rawCollection;
    return { collection, id: `${id}/zh`, data: { title: id.split('/').at(-1), description: '' } };
  });
}

test('curated tag hubs expose localized query terms to page metadata', () => {
  const entries = entriesForHubs();
  const zh = resolveHub('interview', 'zh-CN', entries);
  const en = resolveHub('interview', 'en', entries);

  assert.ok(zh.searchTerms.includes('工程师面试'));
  assert.ok(en.searchTerms.includes('software engineer interview'));
  assert.equal(zh.groups.length, 4);
  assert.equal(en.groups.length, 4);
});
