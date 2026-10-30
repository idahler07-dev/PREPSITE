/**
 * Near-duplicate detection. A question's fingerprint is its normalized text;
 * similarity is the Jaccard index of character 5-grams, which works well for
 * short math stems as well as long passages.
 */

export function fingerprintText(parts: readonly (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\\(frac|dfrac|sqrt|cdot|times|left|right|text|mathrm)/g, " ")
    .replace(/[^\p{L}\p{N}+\-*/=<>^]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function shingles(fingerprint: string, k = 5): Set<string> {
  const out = new Set<string>();
  if (!fingerprint) return out;
  if (fingerprint.length <= k) {
    out.add(fingerprint);
    return out;
  }
  for (let i = 0; i <= fingerprint.length - k; i++) out.add(fingerprint.slice(i, i + k));
  return out;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const x of small) if (large.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export const NEAR_DUPLICATE_THRESHOLD = 0.75;

export interface FingerprintedItem {
  id: string;
  code: string;
  fingerprint: string;
}

export function findNearDuplicates(
  fingerprint: string,
  others: readonly FingerprintedItem[],
  threshold = NEAR_DUPLICATE_THRESHOLD,
): { id: string; code: string; similarity: number }[] {
  const mine = shingles(fingerprint);
  if (mine.size === 0) return [];
  const hits: { id: string; code: string; similarity: number }[] = [];
  for (const o of others) {
    // Jaccard can never exceed the ratio of the two lengths; skip clear misses cheaply.
    const lengths = [fingerprint.length, o.fingerprint.length].sort((x, y) => x - y);
    if (!lengths[1] || lengths[0]! / lengths[1] < threshold) continue;
    const s = jaccard(mine, shingles(o.fingerprint));
    if (s >= threshold) hits.push({ id: o.id, code: o.code, similarity: Math.round(s * 100) / 100 });
  }
  return hits.sort((x, y) => y.similarity - x.similarity);
}
