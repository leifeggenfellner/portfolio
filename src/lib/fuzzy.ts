/**
 * Fuzzy matching for the command palette: the query's characters must appear
 * in order (case-insensitive). Matches score higher when they start words and
 * run together, so "mine" prefers "Minesweeper" over "Terminal environment".
 */

export interface FuzzyMatch {
  score: number;
  /** Indices of the matched characters, for highlighting. */
  indices: number[];
}

const WORD_BREAK = /[\s\-_/.:]/;

export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.trim().toLowerCase();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  const indices: number[] = [];
  let score = 0;
  let from = 0;
  for (const char of q) {
    if (char === " ") continue;
    const at = t.indexOf(char, from);
    if (at < 0) return null;
    const previous = indices.at(-1);
    if (previous !== undefined && at === previous + 1) score += 5;
    if (at === 0 || WORD_BREAK.test(t[at - 1] ?? "")) score += 8;
    score += 1 - Math.min(at - from, 10) / 10;
    indices.push(at);
    from = at + 1;
  }
  // Shorter texts win ties, so an exact title beats a longer one containing it.
  return { score: score - text.length / 100, indices };
}

/** Items matching `query`, best first; ties keep their original order. */
export function fuzzyRank<T>(items: readonly T[], query: string, text: (item: T) => string): T[] {
  return items
    .map((item, order) => ({ item, order, match: fuzzyMatch(query, text(item)) }))
    .filter((entry): entry is { item: T; order: number; match: FuzzyMatch } => entry.match !== null)
    .sort((a, b) => b.match.score - a.match.score || a.order - b.order)
    .map((entry) => entry.item);
}
