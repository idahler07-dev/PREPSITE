/**
 * Student-produced response (SPR) answers: validation and equivalence.
 *
 * Rules (our summary of the public digital SAT entry rules):
 * - Up to 5 characters for a positive answer, 6 for a negative one (the "-" counts).
 * - Integers, decimals and fractions are allowed; fractions need not be reduced.
 * - Mixed numbers ("3 1/2") and symbols such as %, $ or commas are not allowed.
 * - A long decimal may be truncated or rounded, but must use all available space
 *   (for 2/3: .6666, .6667, 0.666 and 0.667 are accepted; .66 and 0.67 are not).
 */

export const SPR_MAX_POSITIVE = 5;
export const SPR_MAX_NEGATIVE = 6;

export type SprError = "EMPTY" | "INVALID" | "TOO_LONG" | "MIXED_NUMBER" | "DIVIDE_BY_ZERO";

export interface Rational {
  num: bigint;
  den: bigint; // always > 0
}

export interface ParsedSpr {
  value: Rational;
  /** Digits after the decimal point, or null when not written as a decimal. */
  decimals: number | null;
  /** Normalized text the student entered (no spaces, ASCII minus). */
  text: string;
}

const MINUS_SIGNS = /[−–—]/g;

export function normalizeSprText(raw: string): string {
  return raw.replace(MINUS_SIGNS, "-").replace(/\s+/g, " ").trim();
}

export function validateSprInput(raw: string): SprError | null {
  const result = parseSpr(raw);
  return "error" in result ? result.error : null;
}

export function parseSpr(raw: string, { enforceLength = true } = {}): ParsedSpr | { error: SprError } {
  const text = normalizeSprText(raw);
  if (!text) return { error: "EMPTY" };
  if (/^-?\d+ \d+\/\d+$/.test(text)) return { error: "MIXED_NUMBER" };
  if (/\s/.test(text)) return { error: "INVALID" };

  const negative = text.startsWith("-");
  if (enforceLength && text.length > (negative ? SPR_MAX_NEGATIVE : SPR_MAX_POSITIVE)) {
    return { error: "TOO_LONG" };
  }

  const frac = /^(-?)(\d+)\/(-?)(\d+)$/.exec(text);
  if (frac) {
    const [, s1, n, s2, d] = frac;
    const den = BigInt(d!);
    if (den === 0n) return { error: "DIVIDE_BY_ZERO" };
    const sign = (s1 === "-") !== (s2 === "-") ? -1n : 1n;
    return { value: reduce({ num: sign * BigInt(n!), den }), decimals: null, text };
  }

  const dec = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (dec) {
    const [, sign, intPart = "", fracPart] = dec;
    if (!intPart && !fracPart) return { error: "INVALID" };
    const digits = fracPart ?? "";
    const num = BigInt((intPart || "0") + digits) * (sign === "-" ? -1n : 1n);
    const den = 10n ** BigInt(digits.length);
    return { value: reduce({ num, den }), decimals: fracPart === undefined ? null : digits.length, text };
  }

  return { error: "INVALID" };
}

/** Parse an accepted answer written by an author (no length limit). */
export function parseAccepted(raw: string): ParsedSpr | null {
  const r = parseSpr(raw, { enforceLength: false });
  return "error" in r ? null : r;
}

export function isSprCorrect(input: string, accepted: readonly string[]): boolean {
  const parsed = parseSpr(input);
  if ("error" in parsed) return false;
  for (const a of accepted) {
    const target = parseAccepted(a);
    if (!target) {
      if (normalizeSprText(a) === parsed.text) return true;
      continue;
    }
    if (equal(parsed.value, target.value)) return true;
    if (parsed.decimals !== null && usesFullWidth(parsed) && matchesTruncatedOrRounded(parsed, target.value)) {
      return true;
    }
  }
  return false;
}

function usesFullWidth(p: ParsedSpr): boolean {
  const negative = p.text.startsWith("-");
  return p.text.length === (negative ? SPR_MAX_NEGATIVE : SPR_MAX_POSITIVE);
}

/** True when the student's decimal equals `target` truncated or rounded to the same number of places. */
function matchesTruncatedOrRounded(p: ParsedSpr, target: Rational): boolean {
  const k = p.decimals ?? 0;
  const scale = 10n ** BigInt(k);
  // student value scaled to an integer
  const studentScaled = (p.value.num * scale) / p.value.den;
  const negative = target.num < 0n;
  const absNum = negative ? -target.num : target.num;
  const scaled = absNum * scale;
  const truncated = scaled / target.den;
  const remainder = scaled % target.den;
  const rounded = remainder * 2n >= target.den ? truncated + 1n : truncated;
  const sign = negative ? -1n : 1n;
  return studentScaled === sign * truncated || studentScaled === sign * rounded;
}

function equal(a: Rational, b: Rational): boolean {
  return a.num * b.den === b.num * a.den;
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
}

function reduce(r: Rational): Rational {
  if (r.num === 0n) return { num: 0n, den: 1n };
  const g = gcd(r.num, r.den);
  return { num: r.num / g, den: r.den / g };
}

/** Characters a student may type into an SPR box. */
export const SPR_ALLOWED_CHARS = /^[0-9./-]*$/;
