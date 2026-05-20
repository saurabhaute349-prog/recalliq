export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (!q) return 1;
  if (t.includes(q)) return 0.9 + q.length / Math.max(t.length, 1);

  let score = 0;
  let tIndex = 0;

  for (const char of q) {
    const found = t.indexOf(char, tIndex);
    if (found === -1) return 0;
    score += 1 / (found - tIndex + 1);
    tIndex = found + 1;
  }

  return score / q.length;
}

export function rankByFuzzy<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
): T[] {
  if (!query.trim()) return items;

  return [...items]
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((row) => row.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.item);
}
