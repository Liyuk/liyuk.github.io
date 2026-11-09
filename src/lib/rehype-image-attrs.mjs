// Give Markdown-rendered content images intrinsic width/height (prevents
// layout shift) plus lazy loading and async decoding. Only root-absolute
// `src` values that resolve to a file under `public/` are touched; anything
// else (remote URLs, missing files, unknown formats) is left as authored.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';
import { publicImageSize } from './image-size.mjs';

const defaultPublicDir = fileURLToPath(new URL('../../public/', import.meta.url));

export function rehypeImageAttrs(options = {}) {
  const publicDir = resolve(options.publicDir ?? defaultPublicDir);
  const cache = new Map();

  const sizeFor = (src) => {
    if (cache.has(src)) return cache.get(src);
    const size = publicImageSize(src, publicDir);
    cache.set(src, size);
    return size;
  };

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img') return;
      const props = (node.properties ??= {});
      if (typeof props.src !== 'string') return;
      const size = sizeFor(props.src);
      if (!size) return;
      if (props.width == null && props.height == null) {
        props.width = size.width;
        props.height = size.height;
      }
      if (props.loading == null) props.loading = 'lazy';
      if (props.decoding == null) props.decoding = 'async';
    });
  };
}
