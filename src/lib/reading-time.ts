// Reading-time estimate. Chinese and English need different counting, because
// CJK text has no spaces between words: a shared token regex would collapse an
// entire run of Han glyphs into one "word" and under-report Chinese reading
// time by ~4x. Count Han characters for zh-CN, word tokens for everything else.
const WORDS_PER_MINUTE = 400;
const CJK_CHARS_PER_MINUTE = 400;

export function readingMinutes(
  body: string | undefined,
  locale: string = 'zh-CN',
): number {
  if (!body) return 1;
  const isChinese = locale === 'zh-CN';
  const count = isChinese
    ? (body.match(/\p{Script=Han}/gu) ?? []).length
    : (body.match(/[A-Za-z0-9]+/g) ?? []).length;
  const perMinute = isChinese ? CJK_CHARS_PER_MINUTE : WORDS_PER_MINUTE;
  return Math.max(1, Math.ceil(count / perMinute));
}
