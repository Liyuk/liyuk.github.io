// Deterministic, locale-aware date formatting for build output.
// `toLocaleDateString`/`toLocaleString` are deliberately avoided: their output
// depends on the ICU build and local time zone of the machine running the
// build, which is why dates can render differently locally vs. on GitHub
// Actions. These helpers format from the local calendar day stored in the
// content date (see content-date.mjs) with fixed rules for each locale.

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'zh-CN': ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

function parts(date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

// zh-CN: 2026年8月14日 · en: August 14, 2026
export function formatFullDate(date, locale = 'zh-CN') {
  const { year, month, day } = parts(date);
  if (locale === 'en') {
    return `${MONTHS.en[month - 1]} ${day}, ${year}`;
  }
  return `${year}年${month}月${day}日`;
}

// zh-CN: 2026年8月 · en: August 2026
export function formatYearMonth(date, locale = 'zh-CN') {
  const { year, month } = parts(date);
  if (locale === 'en') {
    return `${MONTHS.en[month - 1]} ${year}`;
  }
  return `${year}年${month}月`;
}

// Machine-readable calendar date (YYYY-MM-DD) for datetime attributes and RSS.
// Built from the local calendar day instead of toISOString() so that content
// dated 2026-08-14 never becomes 2026-08-13T16:00:00Z on a UTC build machine.
export function isoDate(date) {
  const { year, month, day } = parts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}
