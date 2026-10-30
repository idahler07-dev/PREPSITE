import { all, create } from "mathjs";

/**
 * Independent arithmetic check for AI-drafted math questions. The drafting
 * model also writes an expression that computes the answer (e.g.
 * "(11 - 3) / 2"); we evaluate it with mathjs and compare it with the key.
 *
 * Only plain arithmetic and a few functions are allowed — expressions come
 * from the model, so anything else is rejected before mathjs sees it.
 */

const math = create(all!, { number: "number" });
const evaluateExpr = math.evaluate;

const ALLOWED_NAMES = new Set(["sqrt", "cbrt", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "log", "log10", "exp", "pi", "e", "deg", "nthRoot"]);
const SAFE_CHARS = /^[0-9a-zA-Z_+\-*/^().,\s]*$/;

export function evaluateCheck(expr: string): number | null {
  if (!expr || expr.length > 200 || !SAFE_CHARS.test(expr)) return null;
  for (const name of expr.match(/[a-zA-Z_]\w*/g) ?? []) if (!ALLOWED_NAMES.has(name)) return null;
  try {
    const v: unknown = evaluateExpr(expr);
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** The number a choice or answer stands for: "$\frac{3}{4}$", "0.75", "-2", "$4\sqrt{2}$", "12%". Null if it isn't a plain number. */
export function numericValueOf(text: string): number | null {
  let s = text.trim().replace(/^\$+|\$+$/g, "").trim();
  if (!s) return null;
  s = s
    .replace(/\\left|\\right|\\,|\\!|\\ /g, "")
    .replace(/\\[dt]?frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\pi/g, "pi")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/(\d),(\d{3})\b/g, "$1$2")
    .replace(/(\d)\s*(sqrt|pi)/g, "$1*$2")
    .replace(/\)\s*(sqrt|pi|\()/g, ")*$1");
  const pct = /^(-?[\d.]+)\s*\\?%$/.exec(s);
  if (pct) return Number(pct[1]) / 100;
  if (/[a-zA-Z]/.test(s.replace(/sqrt|pi/g, ""))) return null; // variables, units, words
  return evaluateCheck(s);
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

export type MathCheckResult = "pass" | "fail" | "unchecked";

/**
 * Compare the model's check expression with the answer key: for multiple
 * choice, the value of the keyed choice; for typed answers, any accepted form.
 */
export function mathCheck(q: {
  type: "MCQ" | "SPR";
  choices?: readonly { key: string; text: string }[] | null;
  correctAnswers: readonly string[];
  checkExpression?: string | null;
}): MathCheckResult {
  const value = q.checkExpression ? evaluateCheck(q.checkExpression) : null;
  if (value === null) return "unchecked";
  const keyed =
    q.type === "MCQ"
      ? q.choices?.filter((c) => q.correctAnswers.includes(c.key)).map((c) => numericValueOf(c.text)) ?? []
      : q.correctAnswers.map((a) => numericValueOf(a));
  const numbers = keyed.filter((v): v is number => v !== null);
  if (numbers.length === 0) return "unchecked";
  return numbers.some((n) => close(n, value)) ? "pass" : "fail";
}
