// Dependency-free intrinsic image size reader. Reads only file headers and
// returns `{ width, height }` or `undefined` for anything it does not
// recognise, so callers can skip unknown formats silently.
import { readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

const positive = (width, height) =>
  Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? { width: Math.round(width), height: Math.round(height) }
    : undefined;

function readWebp(buf) {
  if (buf.length < 30 || buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WEBP') return undefined;
  const kind = buf.toString('latin1', 12, 16);
  if (kind === 'VP8 ') {
    // Frame tag (3 bytes) + start code 9d 01 2a, then 14-bit width/height.
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return undefined;
    return positive(buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff);
  }
  if (kind === 'VP8L') {
    if (buf[20] !== 0x2f) return undefined;
    const bits = buf.readUInt32LE(21);
    return positive((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
  }
  if (kind === 'VP8X') {
    return positive(buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1);
  }
  return undefined;
}

function readPng(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('latin1', 12, 16) !== 'IHDR') return undefined;
  return positive(buf.readUInt32BE(16), buf.readUInt32BE(20));
}

function readGif(buf) {
  if (buf.length < 10 || !/^GIF8[79]a$/.test(buf.toString('latin1', 0, 6))) return undefined;
  return positive(buf.readUInt16LE(6), buf.readUInt16LE(8));
}

function readJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    // SOF0-SOF15 except DHT (c4), JPG (c8) and DAC (cc) carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return positive(buf.readUInt16BE(offset + 7), buf.readUInt16BE(offset + 5));
    }
    offset += 2 + length;
  }
  return undefined;
}

function readSvg(text) {
  const tag = text.match(/<svg\b[^>]*>/i)?.[0];
  if (!tag) return undefined;
  const attr = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
  const length = (value) => {
    const match = value?.trim().match(/^([\d.]+)(px)?$/i);
    return match ? Number(match[1]) : undefined;
  };
  const width = length(attr('width'));
  const height = length(attr('height'));
  if (width && height) return positive(width, height);
  const viewBox = attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (viewBox?.length === 4) return positive(viewBox[2], viewBox[3]);
  return undefined;
}

export function readImageSize(buf) {
  return readWebp(buf) ?? readPng(buf) ?? readGif(buf) ?? readJpeg(buf);
}

export function readImageFileSize(file) {
  try {
    const ext = extname(file).toLowerCase();
    const data = readFileSync(file);
    if (ext === '.svg') return readSvg(data.toString('utf8', 0, Math.min(data.length, 8192)));
    return readImageSize(data);
  } catch {
    return undefined;
  }
}

export { readSvg as readSvgSize };

// Intrinsic size of a root-absolute public asset such as `/images/x.webp`.
// Returns undefined for remote URLs, paths escaping `publicDir`, missing
// files, or unknown formats. Defaults to `<cwd>/public` because Astro runs
// from the project root and bundled page code cannot rely on import.meta.url.
export function publicImageSize(src, publicDir = resolve(process.cwd(), 'public')) {
  if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return undefined;
  try {
    const root = resolve(publicDir);
    const file = resolve(root, `.${decodeURIComponent(src.split(/[?#]/)[0])}`);
    return file.startsWith(root + sep) ? readImageFileSize(file) : undefined;
  } catch {
    return undefined;
  }
}
