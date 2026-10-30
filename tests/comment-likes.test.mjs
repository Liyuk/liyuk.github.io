import test from 'node:test';
import assert from 'node:assert/strict';
import { withLikeCounts } from '../src/lib/comment-likes.mjs';

test('adds likes to one-level comment threads when replies have no child reply list', () => {
  const comments = [
    {
      id: 'root',
      nickname: 'Reader',
      body: 'Question',
      replies: [{ id: 'reply', nickname: 'Author', body: 'Answer' }],
    },
  ];

  assert.deepEqual(withLikeCounts(comments, { root: 2, reply: 1 }), [
    {
      id: 'root',
      nickname: 'Reader',
      body: 'Question',
      likes: 2,
      replies: [
        { id: 'reply', nickname: 'Author', body: 'Answer', likes: 1, replies: [] },
      ],
    },
  ]);
});
