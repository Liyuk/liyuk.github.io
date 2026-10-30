/**
 * @template {{ id: string }} Reply
 * @template {{ id: string, replies?: Reply[] }} Comment
 * @param {Comment[]} comments
 * @param {Record<string, number>} counts
 * @returns {Array<Comment & { likes: number, replies: Array<Reply & { likes: number, replies: [] }> }>}
 */
export function withLikeCounts(comments, counts) {
  return comments.map((comment) => ({
    ...comment,
    likes: counts[comment.id] ?? 0,
    replies: (comment.replies ?? []).map((reply) => ({
      ...reply,
      likes: counts[reply.id] ?? 0,
      replies: [],
    })),
  }));
}
