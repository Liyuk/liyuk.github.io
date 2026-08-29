// Wrap overflow-prone Markdown block elements in a `.scroll-wrap` container so
// they scroll horizontally on narrow screens instead of crushing their content
// or overflowing the page. Wraps:
//   - <table>       wide data tables (previously rendered with zero styles)
//   - <svg id="mermaid-*">  wide flowcharts (previously scaled down to unreadable)
// The wrapper is a bare <div>; `global.css` gives it overflow-x and max-width.
// Skipping a table that already lives inside a .scroll-wrap keeps the pass
// idempotent.
import { visit } from 'unist-util-visit';

export function rehypeScrollWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      const className = node.properties?.className;
      const isKatexDisplay = node.tagName === 'span' && String(className).includes('katex-display');

      if (isKatexDisplay) {
        node.properties.tabIndex = 0;
        return;
      }
      const isMermaid =
        node.tagName === 'svg' && typeof node.properties?.id === 'string' && node.properties.id.startsWith('mermaid-');
      const isTable = node.tagName === 'table';

      if ((!isMermaid && !isTable) || parent == null || index == null) return;

      // Don't double-wrap: mermaid SVGs are already block children, and a table
      // inside a wrapper we just created must not be wrapped again.
      if (isTable && parent.tagName === 'div' && Array.isArray(parent.properties?.className) && parent.properties.className.includes('scroll-wrap')) return;

      const wrap = {
        type: 'element',
        tagName: 'div',
        // `tabIndex` is what makes the container reachable by keyboard once it
        // actually scrolls (WCAG 2.1.1; axe `scrollable-region-focusable`).
        // It only overflows at narrow widths, which is why a desktop-only axe
        // pass never saw it — `tests/a11y-smoke.mjs` now also scans at 375px.
        properties: { className: ['scroll-wrap'], tabIndex: 0 },
        children: [node],
      };
      parent.children[index] = wrap;
    });
  };
}
