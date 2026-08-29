import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE = process.env.E2E_BASE ?? 'http://localhost:4321';
// Index routes plus one detail route per content shape: every rich feature —
// tables, Mermaid SVGs, KaTeX, the table-of-contents disclosure, share row,
// related entries, column navigation — exists only on a detail page, so an
// index-only scan leaves the complex half of the site unverified.
const routes = [
  '/',
  '/writing/',
  '/en/writing/',
  '/research/',
  '/projects/',
  '/photos/',
  '/writing/2026/08/business-model-canvas/',
  '/en/writing/2026/08/business-model-canvas/',
  '/photos/maomao/',
  '/columns/engineering-ai-judgment/',
];

// Content-rich routes worth re-scanning at phone width, where wide tables and
// diagrams actually start to scroll.
const narrowRoutes = ['/writing/2026/08/business-model-canvas/', '/photos/maomao/'];
const results = { pass: 0, fail: 0, failures: [] };

function check(name, condition, detail = '') {
  if (condition) {
    results.pass++;
    console.log(`  ✓ ${name}`);
  } else {
    results.fail++;
    results.failures.push({ name, detail });
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function formatAxeViolation(violation) {
  const nodes = violation.nodes.map((node) => {
    const target = node.target?.join(' ') || '<unknown target>';
    const html = (node.html || '').replace(/\s+/g, ' ').trim().slice(0, 240);
    return `${target}${html ? ` :: ${html}` : ''}`;
  });
  return `${violation.id} [${violation.impact ?? 'unknown'}] ${violation.help} (${violation.helpUrl})\n    ${nodes.join('\n    ')}`;
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

try {
  for (const route of routes) {
    const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    check(`${route} returns success`, response?.ok() ?? false, String(response?.status()));

    const summary = await page.evaluate(() => {
      const accessibleName = (element) => {
        const aria = element.getAttribute('aria-label')?.trim();
        if (aria) return aria;
        const title = element.getAttribute('title')?.trim();
        if (title) return title;
        const text = element.textContent?.replace(/\s+/g, ' ').trim();
        if (text) return text;
        return element.querySelector('img[alt]')?.getAttribute('alt')?.trim() ?? '';
      };
      const controls = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')];
      return {
        lang: document.documentElement.lang,
        mainCount: document.querySelectorAll('main').length,
        h1Count: document.querySelectorAll('h1').length,
        imagesMissingAlt: document.querySelectorAll('img:not([alt])').length,
        unnamedLinks: [...document.querySelectorAll('a[href]')].filter(
          (link) => !accessibleName(link),
        ).length,
        unnamedControls: controls.filter((control) => {
          const id = control.id;
          return (
            !control.getAttribute('aria-label') &&
            !control.getAttribute('aria-labelledby') &&
            !control.closest('label') &&
            !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
          );
        }).length,
      };
    });

    check(`${route} declares page language`, Boolean(summary.lang), summary.lang);
    check(`${route} has one main landmark`, summary.mainCount === 1, `count=${summary.mainCount}`);
    check(`${route} has one h1`, summary.h1Count === 1, `count=${summary.h1Count}`);
    check(
      `${route} images declare alt`,
      summary.imagesMissingAlt === 0,
      `missing=${summary.imagesMissingAlt}`,
    );
    check(
      `${route} links have accessible names`,
      summary.unnamedLinks === 0,
      `unnamed=${summary.unnamedLinks}`,
    );
    check(
      `${route} controls have labels`,
      summary.unnamedControls === 0,
      `unlabeled=${summary.unnamedControls}`,
    );

    // The Giscus comment iframe is third-party markup this repository cannot
    // edit, and its violations vary with how many reactions a discussion has.
    // Excluding it keeps the scan about the site's own accessibility.
    const axe = await new AxeBuilder({ page }).exclude('iframe.giscus-frame').analyze();
    if (axe.violations.length === 0) {
      results.pass++;
      console.log(`  ✓ ${route} axe scan has no violations`);
    } else {
      results.fail++;
      const detail = axe.violations.map(formatAxeViolation).join('\n');
      results.failures.push({ name: `${route} axe violations`, detail });
      console.log(`  ✗ ${route} axe scan found ${axe.violations.length} violation(s)`);
      console.log(detail);
    }
  }

  // A second pass at phone width. Containers that only overflow on narrow
  // screens — wide tables, Mermaid diagrams, display math — are invisible to a
  // desktop-only scan, which is how a whole class of keyboard-reachability
  // failures stayed hidden (`scrollable-region-focusable`, WCAG 2.1.1).
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of narrowRoutes) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page }).exclude('iframe.giscus-frame').analyze();
    if (axe.violations.length === 0) {
      results.pass++;
      console.log(`  ✓ ${route} axe scan at 375px has no violations`);
    } else {
      results.fail++;
      const detail = axe.violations.map(formatAxeViolation).join('\n');
      results.failures.push({ name: `${route} axe violations at 375px`, detail });
      console.log(`  ✗ ${route} axe scan at 375px found ${axe.violations.length} violation(s)`);
      console.log(detail);
    }
  }
} catch (error) {
  results.fail++;
  results.failures.push({ name: 'script error', detail: error.message });
  console.error('  ✗ script error:', error.message);
} finally {
  await browser.close();
}

console.log(`\n=== ${results.pass} passed, ${results.fail} failed ===`);
if (results.failures.length) {
  for (const failure of results.failures) console.log(`  - ${failure.name}: ${failure.detail}`);
  process.exit(1);
}
