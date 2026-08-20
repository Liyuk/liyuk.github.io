// E2E smoke checks against the built site served by run-browser-checks.mjs.
// Verifies page health, the date-formatting changes, and locale parity.
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://localhost:4321';
const ARTIFACTS = process.env.E2E_ARTIFACTS_DIR ?? 'artifacts/browser-checks';
const results = { pass: 0, fail: 0, failures: [] };

function check(name, cond, detail = '') {
  if (cond) { results.pass++; console.log(`  ✓ ${name}`); }
  else { results.fail++; results.failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

const browser = await chromium.launch();
const context = await browser.newContext();
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('cloudflareinsights.com') && !msg.text().includes('Failed to load resource')) {
    consoleErrors.push(msg.text());
  }
});

try {
  // 1. Home page
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const homeTitle = await page.title();
  check('home loads', homeTitle.length > 0, homeTitle);
  const h1 = await page.textContent('h1');
  check('home has hero heading', h1.includes('烹饪指南') || h1.length > 0, h1);

  // 2. Writing index
  await page.goto(`${BASE}/writing/`, { waitUntil: 'networkidle' });
  const writingCount = await page.locator('.entry-card').count();
  check('writing index lists entries', writingCount > 0, `count=${writingCount}`);
  check('writing cards use 年月日 date', await page.locator('.entry-card time').first().textContent().then(t => /\d+年\d+月\d+日/.test(t)));

  // 3. Writing detail — date format & datetime attribute
  const writingDetail = await page.locator('.entry-card a').first().getAttribute('href');
  check('writing detail link exists', !!writingDetail);
  await page.goto(`${BASE}${writingDetail}`, { waitUntil: 'networkidle' });
  const articleDates = await page.locator('.article-dates time').first().textContent();
  check('writing detail shows 发布于 + full date', /发布于 \d+年\d+月\d+日/.test(articleDates ?? ''), articleDates);
  const dt = await page.locator('.article-dates time').first().getAttribute('datetime');
  check('datetime is clean YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(dt ?? ''), dt);
  check('no stray T00:00:00Z datetime', !dt.includes('T00:00:00.000Z'), dt);

  // 4. Research detail — previously lost the day; must now have full date
  await page.goto(`${BASE}/research/2026/08/canonloom-auditable-narrative-production/`, { waitUntil: 'networkidle' });
  const researchDate = await page.locator('.article-dates time').first().textContent();
  check('research detail has day (was missing)', /2026年\d+月\d+日/.test(researchDate ?? ''), researchDate);

  // 5. Project detail — previously lost the day too
  const projectLink = await page.goto(`${BASE}/projects/`, { waitUntil: 'networkidle' }).then(() => page.locator('.entry-card:not(.work-card) a').first().getAttribute('href'));
  if (projectLink) {
    await page.goto(`${BASE}${projectLink}`, { waitUntil: 'networkidle' });
    const projectDate = await page.locator('.article-dates time').first().textContent();
    check('project detail has day (was missing)', /开始于 \d+年\d+月\d+日/.test(projectDate ?? ''), projectDate);
  } else {
    check('project detail link exists', false, 'no non-work project found');
  }

  // 6. Work (novel) project card renders
  await page.goto(`${BASE}/projects/`, { waitUntil: 'networkidle' });
  const workCards = await page.locator('.work-card').count();
  check('work (novel) cards render', workCards >= 2, `count=${workCards}`);

  // 7. en parity — same content, English UI shell
  await page.goto(`${BASE}/en/writing/`, { waitUntil: 'networkidle' });
  const enTitle = await page.title();
  check('en writing page renders', /Silent Potato/i.test(enTitle) || enTitle.length > 0, enTitle);
  const enCardCount = await page.locator('.entry-card').count();
  check('en writing lists same entries', enCardCount === writingCount, `zh=${writingCount} en=${enCardCount}`);

  // 8. en writing detail — English date format
  const enLink = await page.locator('.entry-card a').first().getAttribute('href');
  await page.goto(`${BASE}${enLink}`, { waitUntil: 'networkidle' });
  const enDate = await page.locator('.article-dates time').first().textContent();
  check('en detail uses English month name', /[A-Z][a-z]+ \d+, \d{4}/.test(enDate ?? ''), enDate);

  // 9. en research detail — English full date with day
  await page.goto(`${BASE}/en/research/2026/08/canonloom-auditable-narrative-production/`, { waitUntil: 'networkidle' });
  const enResearchDate = await page.locator('.article-dates time').first().textContent();
  check('en research date has day', /[A-Z][a-z]+ \d+, \d{4}/.test(enResearchDate ?? ''), enResearchDate);

  // 10. Tags index + detail
  await page.goto(`${BASE}/tags/`, { waitUntil: 'networkidle' });
  const tagCount = await page.locator('.topic-directory li').count();
  check('tags index lists tags', tagCount > 0, `count=${tagCount}`);

  // 11. Columns
  await page.goto(`${BASE}/columns/`, { waitUntil: 'networkidle' });
  const columnCount = await page.locator('.column-grid a').count();
  check('columns index lists columns', columnCount > 0, `count=${columnCount}`);

  // 12. Column reading context: chapter navigation replaces chronological navigation.
  await page.goto(`${BASE}/columns/data-metrics-guide/`, { waitUntil: 'networkidle' });
  const chapters = page.locator('.column-chapters a');
  const chapterCount = await chapters.count();
  check('column fixture has chapters', chapterCount >= 2, `count=${chapterCount}`);
  const firstChapter = await chapters.first().getAttribute('href');
  const lastChapter = await chapters.last().getAttribute('href');
  await page.goto(`${BASE}${firstChapter}`, { waitUntil: 'networkidle' });
  check('column entry carries reading context', new URL(page.url()).searchParams.get('context') === 'column', page.url());
  check('column pagination is visible in column mode', await page.locator('[data-reading-nav="column"]').evaluate((node) => getComputedStyle(node).display !== 'none'));
  check('chronological pagination is hidden in column mode', await page.locator('[data-reading-nav="chronological"]').evaluate((node) => getComputedStyle(node).display === 'none'));
  const columnNext = page.locator('[data-reading-nav="column"] a.next');
  if (await columnNext.count()) {
    const nextHref = await columnNext.getAttribute('href');
    check('column next link preserves context', new URL(nextHref, BASE).searchParams.get('context') === 'column', nextHref);
  }
  await page.goto(`${BASE}${lastChapter}`, { waitUntil: 'networkidle' });
  check('final column chapter keeps column mode', new URL(page.url()).searchParams.get('context') === 'column', page.url());
  check('final column chapter has no next chapter', await page.locator('[data-reading-nav="column"] a.next').count() === 0);
  check('final column chapter hides chronological pagination', await page.locator('[data-reading-nav="chronological"]').evaluate((node) => getComputedStyle(node).display === 'none'));

  const cleanArticle = new URL(lastChapter, BASE);
  cleanArticle.search = '';
  await page.goto(cleanArticle.href, { waitUntil: 'networkidle' });
  check('normal article entry uses chronological mode', await page.locator('[data-reading-nav="chronological"]').evaluate((node) => getComputedStyle(node).display !== 'none'));
  check('normal article entry hides column pagination', await page.locator('[data-reading-nav="column"]').evaluate((node) => getComputedStyle(node).display === 'none'));

  // 13. Photos index
  await page.goto(`${BASE}/photos/`, { waitUntil: 'networkidle' });
  const galleryCount = await page.locator('.gallery-card').count();
  check('photos index renders', galleryCount > 0 || await page.locator('.photo-placeholder').count() > 0, `gallery=${galleryCount}`);

  // 14. No console errors on key pages (ignore Cloudflare beacon CORS noise on localhost)
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE}/writing/`, { waitUntil: 'networkidle' });
  check('no console errors on home+writing', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  // 15. 404 page
  await page.goto(`${BASE}/definitely-not-a-page/`, { waitUntil: 'networkidle' });
  check('404 renders', (await page.title()).length > 0, await page.title());

} catch (err) {
  results.fail++;
  results.failures.push({ name: 'script error', detail: err.message });
  console.error('  ✗ script error:', err.message);
  try {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(ARTIFACTS, { recursive: true });
    await page.screenshot({ path: `${ARTIFACTS}/e2e-failure.png`, fullPage: true });
  } catch (artifactError) {
    console.error('  ⚠ failed to save screenshot:', artifactError.message);
  }
} finally {
  try {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(ARTIFACTS, { recursive: true });
    await context.tracing.stop({ path: `${ARTIFACTS}/e2e-trace.zip` });
  } catch (artifactError) {
    console.error('  ⚠ failed to save trace:', artifactError.message);
  }
  await browser.close();
}

console.log(`\n=== ${results.pass} passed, ${results.fail} failed ===`);
if (results.failures.length) {
  console.log('Failures:');
  for (const f of results.failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
