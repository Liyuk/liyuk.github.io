import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readImageSize, readImageFileSize, readSvgSize } from '../src/lib/image-size.mjs';
import { rehypeImageAttrs } from '../src/lib/rehype-image-attrs.mjs';

const png = (w, h) => {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
};
const gif = (w, h) => {
  const b = Buffer.alloc(13);
  b.write('GIF89a', 0, 'latin1');
  b.writeUInt16LE(w, 6);
  b.writeUInt16LE(h, 8);
  return b;
};
const jpeg = (w, h) =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]), // SOI + APP0 (length 4)
    Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ]);
const webpHeader = (kind, size) => {
  const b = Buffer.alloc(40);
  b.write('RIFF', 0, 'latin1');
  b.writeUInt32LE(32, 4);
  b.write('WEBP', 8, 'latin1');
  b.write(kind, 12, 'latin1');
  b.writeUInt32LE(size, 16);
  return b;
};
const webpVp8x = (w, h) => {
  const b = webpHeader('VP8X', 10);
  b.writeUIntLE(w - 1, 24, 3);
  b.writeUIntLE(h - 1, 27, 3);
  return b;
};
const webpVp8l = (w, h) => {
  const b = webpHeader('VP8L', 5);
  b[20] = 0x2f;
  b.writeUInt32LE(((w - 1) | ((h - 1) << 14)) >>> 0, 21);
  return b;
};
const webpVp8 = (w, h) => {
  const b = webpHeader('VP8 ', 20);
  b[23] = 0x9d;
  b[24] = 0x01;
  b[25] = 0x2a;
  b.writeUInt16LE(w, 26);
  b.writeUInt16LE(h, 28);
  return b;
};

test('reads png, gif, jpeg and all three webp variants', () => {
  assert.deepEqual(readImageSize(png(640, 480)), { width: 640, height: 480 });
  assert.deepEqual(readImageSize(gif(32, 16)), { width: 32, height: 16 });
  assert.deepEqual(readImageSize(jpeg(1024, 768)), { width: 1024, height: 768 });
  assert.deepEqual(readImageSize(webpVp8x(1600, 900)), { width: 1600, height: 900 });
  assert.deepEqual(readImageSize(webpVp8l(321, 123)), { width: 321, height: 123 });
  assert.deepEqual(readImageSize(webpVp8(800, 600)), { width: 800, height: 600 });
});

test('unknown or truncated data yields undefined', () => {
  assert.equal(readImageSize(Buffer.from('not an image at all, just text')), undefined);
  assert.equal(readImageSize(Buffer.alloc(0)), undefined);
  assert.equal(readImageSize(png(1, 1).subarray(0, 10)), undefined);
});

test('svg size comes from width/height, then viewBox', () => {
  assert.deepEqual(readSvgSize('<svg xmlns="x" width="120px" height="60">'), { width: 120, height: 60 });
  assert.deepEqual(readSvgSize('<svg viewBox="0 0 300 150" width="100%">'), { width: 300, height: 150 });
  assert.equal(readSvgSize('<svg width="100%" height="100%">'), undefined);
});

test('rehypeImageAttrs sets size, lazy loading and decoding only where safe', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rehype-img-'));
  try {
    mkdirSync(join(dir, 'images'));
    writeFileSync(join(dir, 'images', 'a.webp'), webpVp8x(640, 360));
    writeFileSync(join(dir, 'images', 'b.png'), png(10, 20));
    writeFileSync(join(dir, 'images', 'broken.webp'), 'nope');
    const img = (src, properties = {}) => ({ type: 'element', tagName: 'img', properties: { src, ...properties }, children: [] });
    const tree = {
      type: 'root',
      children: [
        img('/images/a.webp', { alt: 'a' }),
        img('/images/b.png', { width: 99, height: 98, loading: 'eager' }),
        img('/images/broken.webp'),
        img('/images/missing.webp'),
        img('https://example.com/x.png'),
        img('/../outside.png'),
      ],
    };
    rehypeImageAttrs({ publicDir: dir })(tree);
    const [a, b, broken, missing, remote, escape] = tree.children.map((n) => n.properties);
    assert.deepEqual([a.width, a.height, a.loading, a.decoding], [640, 360, 'lazy', 'async']);
    assert.deepEqual([b.width, b.height, b.loading, b.decoding], [99, 98, 'eager', 'async']);
    for (const untouched of [broken, missing, remote, escape]) {
      assert.equal(untouched.width, undefined);
      assert.equal(untouched.loading, undefined);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('readImageFileSize reads a real file and tolerates a missing one', () => {
  const dir = mkdtempSync(join(tmpdir(), 'img-size-'));
  try {
    writeFileSync(join(dir, 'x.svg'), '<svg viewBox="0 0 8 4"></svg>');
    assert.deepEqual(readImageFileSize(join(dir, 'x.svg')), { width: 8, height: 4 });
    assert.equal(readImageFileSize(join(dir, 'nope.png')), undefined);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
