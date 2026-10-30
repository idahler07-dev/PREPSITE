/**
 * Question codes, e.g. LC-M-ALG-0001.
 * The format comes from site.config.ts (questionCodes.format / padding).
 */

export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_.-]{1,39}$/;
export const PREFIX_PATTERN = /^[A-Z0-9_.-]{0,20}$/;

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "-");
}

export function normalizePrefix(prefix: string): string {
  return prefix.trim().toUpperCase().replace(/\s+/g, "-");
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

export interface CodeTemplate {
  /** Everything before the number, e.g. "LC-M-ALG-" */
  head: string;
  /** Everything after the number (usually empty) */
  tail: string;
}

/** Split the configured format into the fixed text before and after {number}. */
export function codeTemplate(format: string, prefix: string, domainCode: string): CodeTemplate {
  const filled = format.replaceAll("{prefix}", normalizePrefix(prefix)).replaceAll("{domain}", domainCode.toUpperCase());
  const idx = filled.indexOf("{number}");
  if (idx === -1) return { head: filled, tail: "" };
  return { head: filled.slice(0, idx), tail: filled.slice(idx + "{number}".length) };
}

export function formatCode(t: CodeTemplate, n: number, padding: number): string {
  return `${t.head}${String(n).padStart(padding, "0")}${t.tail}`;
}

/** Highest number already used for this template (0 if none). */
export function maxUsedNumber(existing: Iterable<string>, t: CodeTemplate): number {
  let max = 0;
  for (const code of existing) {
    if (!code.startsWith(t.head) || !code.endsWith(t.tail)) continue;
    const middle = code.slice(t.head.length, code.length - t.tail.length);
    if (!/^\d+$/.test(middle)) continue;
    const n = Number.parseInt(middle, 10);
    if (n > max) max = n;
  }
  return max;
}

/**
 * Suggest `count` new codes that follow the highest existing number and
 * do not collide with existing or reserved codes.
 */
export function suggestCodes(
  existing: readonly string[],
  t: CodeTemplate,
  padding: number,
  count = 1,
  reserved: ReadonlySet<string> = new Set(),
): string[] {
  const taken = new Set([...existing, ...reserved]);
  let n = Math.max(maxUsedNumber(existing, t), maxUsedNumber(reserved, t));
  const out: string[] = [];
  while (out.length < count) {
    n += 1;
    const code = formatCode(t, n, padding);
    if (!taken.has(code)) {
      out.push(code);
      taken.add(code);
    }
  }
  return out;
}
