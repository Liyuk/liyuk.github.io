// Word / character counts across the published content, split by language.
// Chinese is measured by 字 (CJK character count), English by word count —
// the conventional, honest apples-to-oranges comparison for mixed-language
// sites: a single cross-language "total" would be meaningless, so each
// language keeps its own natural unit.
//
// Scope note: this counts prose in the Markdown body of each published entry
// (writing / research / projects / galleries), after stripping fenced code
// blocks and inline backticks so code samples don't inflate the human-facing
// number. Gallery bodies are empty by design (images live in frontmatter), so
// they contribute entry counts but no characters. These boundaries are a
// deliberate transparency tradeoff, not a hidden caveat.

interface CountEntry {
  data: { draft?: boolean; locale?: string };
  body?: string;
}

export interface WordCounts {
  zhChars: number;
  enWords: number;
  zhFiles: number;
  enFiles: number;
}

// Count CJK (Chinese) characters in rendered text.
export function countZhChars(text: string): number {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

// Count English words as runs of Latin letters / apostrophes / hyphens.
export function countEnWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z'’\-]*/g) || []).length;
}

// Strip fenced/code-spans — inline code and code blocks shouldn't inflate the
// human-readable body count.
function stripCode(body: string): string {
  return body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
}

export function sumWordCounts(entries: CountEntry[]): WordCounts {
  const counts: WordCounts = { zhChars: 0, enWords: 0, zhFiles: 0, enFiles: 0 };
  for (const entry of entries) {
    if (entry.data.draft || !entry.body) continue;
    const clean = stripCode(entry.body);
    const isEn = (entry.data.locale || 'zh-CN').toLowerCase().startsWith('en');
    if (isEn) {
      counts.enWords += countEnWords(clean);
      counts.enFiles += 1;
    } else {
      counts.zhChars += countZhChars(clean);
      counts.zhFiles += 1;
    }
  }
  return counts;
}
