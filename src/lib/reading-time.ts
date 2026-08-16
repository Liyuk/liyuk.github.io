// Reading-time estimate: count word/number tokens and divide by a constant
// words-per-minute rate. Deliberately simple — a UX hint, not a benchmark.
const WORDS_PER_MINUTE = 400;

export function readingMinutes(
  body: string | undefined,
  wordsPerMinute: number = WORDS_PER_MINUTE,
): number {
  const words = (body?.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
