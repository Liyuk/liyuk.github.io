// E2E smoke checks against the built site (npm run preview).
// Verifies page health, the date-formatting changes, and locale parity.
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE ?? 'http://localhost:4321';
const results = { pass: 0, fail: 0, failures: [] };

function check(name, cond, detail = '') {
  if (cond) { results.pass++; console.log(`  ✓ ${name}`); }
  else { results.fail++; results.failures.push({ name, detail }); console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

const browser = await chromium.launch();
const page = await browser.newPage();

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

  // 12. Photos index
  await page.goto(`${BASE}/photos/`, { waitUntil: 'networkidle' });
  const galleryCount = await page.locator('.gallery-card').count();
  check('photos index renders', galleryCount > 0 || await page.locator('.photo-placeholder').count() > 0, `gallery=${galleryCount}`);

  // 13. No console errors on key pages (ignore Cloudflare beacon CORS noise on localhost)
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('cloudflareinsights.com') && !msg.text().includes('Failed to load resource')) {
      consoleErrors.push(msg.text());
    }
  });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE}/writing/`, { waitUntil: 'networkidle' });
  check('no console errors on home+writing', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  // 14. 404 page
  await page.goto(`${BASE}/definitely-not-a-page/`, { waitUntil: 'networkidle' });
  check('404 renders', (await page.title()).length > 0, await page.title());

} catch (err) {
  results.fail++;
  results.failures.push({ name: 'script error', detail: err.message });
  console.error('  ✗ script error:', err.message);
} finally {
  await browser.close();
}

console.log(`\n=== ${results.pass} passed, ${results.fail} failed ===`);
if (results.failures.length) {
  console.log('Failures:');
  for (const f of results.failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
