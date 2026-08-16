// Shared CLI utilities for the content-creation scripts.
// Pure Node built-ins only — no dependencies, matching the project's
// zero-runtime-dependency stance (see scripts/audit-images.mjs).
import { createInterface } from 'node:readline/promises';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9-]+$/;

export function todayStr() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isValidDate(str) {
  if (!DATE_RE.test(str)) return false;
  const [year, month, day] = str.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

export function validateDate(value) {
  if (!isValidDate(value)) return '日期格式必须是 YYYY-MM-DD（例如 2026-08-15）';
  return null;
}

export function isValidSlug(str) {
  return SLUG_RE.test(str);
}

export function validateSlug(value) {
  if (!isValidSlug(value)) return 'slug 只能包含小写字母、数字和连字符（如 maomao-2026）';
  return null;
}

// English/pinyin title → kebab-case slug. Chinese titles have no URL-safe
// transformation, so we return null and let the user type a slug manually.
export function buildSlug(title) {
  const trimmed = title.trim();
  if (!trimmed) return null;
  if (/[一-鿿]/.test(trimmed)) return null; // Chinese → caller asks
  const slug = trimmed
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug || null;
}

// Tags outside the registry are allowed (schema is open) but surfaced as a
// warning so the author knows they won't get bilingual labels. Returns a
// message string when there are new tags, otherwise null.
export function validateTags(tags, registry) {
  const unknown = tags.filter((tag) => !(tag in registry));
  if (unknown.length === 0) return null;
  return `新标签：${unknown.join('、')}（不在注册表，显示为原样；如要双语显示请加入 src/lib/taxonomy.ts 的 tags）`;
}

// Serialize a nested object to YAML-ish frontmatter lines.
// Handles: plain values, arrays (flow style), and single-level objects (inline flow).
function yamlScalar(value) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    // Pure dates and plain words need no quoting; anything with YAML-significant
    // characters (colons, newlines, leading spaces/digits, booleans) gets JSON-quoted.
    if (DATE_RE.test(value)) return value;
    if (/[\n:]|^[-\s]|^[0-9]|^true$|^false$|^null$|^~$/i.test(value)) return JSON.stringify(value);
    return value;
  }
  return String(value);
}

export function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      // Array of objects → block list (e.g. gallery `images:`). Array of scalars → flow.
      if (value.every((item) => typeof item === 'object' && item !== null)) {
        lines.push(`${key}:`);
        for (const item of value) {
          const entry = Object.entries(item)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${k}: ${yamlScalar(v)}`);
          lines.push(`  - ${entry.join('\n    ')}`);
        }
      } else {
        lines.push(value.length === 0 ? `${key}: []` : `${key}: [${value.map(yamlScalar).join(', ')}]`);
      }
    } else if (typeof value === 'object') {
      const inner = Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}: ${yamlScalar(v)}`)
        .join(', ');
      lines.push(`${key}: { ${inner} }`);
    } else {
      lines.push(`${key}: ${yamlScalar(value)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

// Prompt factory with TTY detection.
//
// node:readline/promises closes its interface after the first line on piped
// (non-TTY) input, so subsequent question() calls hang forever. For TTY we use
// readline normally (with retry on validation failure); for pipes we eagerly
// read all lines and serve them one by one. Both modes expose the same
// `ask(question, {default, validate})` / `close()` surface.
export function createPrompter({ input = process.stdin, output = process.stdout } = {}) {
  const isTTY = Boolean(input.isTTY);

  if (!isTTY) {
    let lines = [];
    let index = 0;
    const ready = (async () => {
      let buffer = '';
      for await (const chunk of input) buffer += chunk;
      lines = buffer.split('\n');
    })();
    return {
      async ask(_question, options = {}) {
        await ready;
        const raw = lines[index++] ?? undefined; // undefined at EOF
        const value = (raw ?? '').trim() === '' && options.default !== undefined && options.default !== ''
          ? String(options.default)
          : (raw ?? '').trim();
        if (options.validate) {
          const error = options.validate(value);
          if (error) {
            console.log(`  ⚠ ${error}`);
            // Piped input is finite — fall back to default (or empty) rather than looping.
            return options.default !== undefined && options.default !== '' ? String(options.default) : value;
          }
        }
        return value;
      },
      close() {},
    };
  }

  const rl = createInterface({ input, output });
  return {
    async ask(question, options = {}) {
      const suffix = options.default !== undefined && options.default !== '' ? ` [${options.default}]` : '';
      for (;;) {
        const raw = await rl.question(`${question}${suffix} `);
        const value = raw.trim() === '' && options.default !== undefined && options.default !== '' ? String(options.default) : raw.trim();
        if (options.validate) {
          const error = options.validate(value);
          if (error) {
            console.log(`  ⚠ ${error}`);
            continue;
          }
        }
        return value;
      }
    },
    close() {
      rl.close();
    },
  };
}
