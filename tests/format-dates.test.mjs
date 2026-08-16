import test from 'node:test';
import assert from 'node:assert/strict';

import { parseContentDate } from '../src/lib/content-date.ts';
import { formatFullDate, formatYearMonth, isoDate } from '../src/lib/format-dates.ts';

// Helper: build a Date in the local calendar timezone (the same way
// parseContentDate and content frontmatter do) so these tests pass on any
// build machine regardless of its time zone.
const date = (year, month, day) => new Date(year, month - 1, day);

test('full dates read naturally in each locale', () => {
  assert.equal(formatFullDate(date(2026, 8, 14), 'zh-CN'), '2026年8月14日');
  assert.equal(formatFullDate(date(2026, 8, 14), 'en'), 'August 14, 2026');
});

test('year-month dates read naturally in each locale', () => {
  assert.equal(formatYearMonth(date(2026, 8, 14), 'zh-CN'), '2026年8月');
  assert.equal(formatYearMonth(date(2026, 8, 14), 'en'), 'August 2026');
});

test('isoDate zero-pads months and days', () => {
  assert.equal(isoDate(date(2026, 1, 5)), '2026-01-05');
  assert.equal(isoDate(date(2026, 12, 31)), '2026-12-31');
});

test('dates parsed from frontmatter round-trip through isoDate unchanged', () => {
  // A date stored as 2026-08-14 must come back as 2026-08-14 on any machine;
  // a UTC conversion could shift it to 2026-08-13T16:00:00Z on a western-timezone
  // build. isoDate reads the calendar day, not the UTC timestamp.
  assert.equal(isoDate(parseContentDate('2026-08-14')), '2026-08-14');
  assert.equal(isoDate(parseContentDate('2012-01-01')), '2012-01-01');
});

test('unknown locales fall back to the Chinese format', () => {
  assert.equal(formatFullDate(date(2026, 8, 14), 'fr'), '2026年8月14日');
  assert.equal(formatYearMonth(date(2026, 8, 14), 'fr'), '2026年8月');
  assert.equal(formatFullDate(date(2026, 8, 14)), '2026年8月14日');
});
