/**
 * Expression evaluator for the basic scientific calculator (used when no
 * Desmos key is set). A small recursive-descent parser — never eval().
 *
 * Supports + − × ÷ ^ ( ), implicit multiplication (2π, 3(4), 2sqrt(9)),
 * unary minus, %, π, e, ans, and sqrt, cbrt, abs, sin, cos, tan, asin, acos,
 * atan, ln, log (base 10). Trig uses degrees or radians.
 */

export type AngleMode = "deg" | "rad";

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, " pi ").replace(/√/g, " sqrt ");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i]!;
    if (/\s/.test(ch)) {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
      if (!m) throw new Error("number");
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/i.test(ch)) {
      const m = /^[a-z]+/i.exec(s.slice(i))!;
      out.push({ t: "id", v: m[0].toLowerCase() });
      i += m[0].length;
    } else if ("+-*/^()%".includes(ch)) {
      out.push({ t: "op", v: ch });
      i++;
    } else throw new Error(`unexpected ${ch}`);
  }
  return out;
}

const FUNCS = new Set(["sqrt", "cbrt", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "ln", "log"]);

export function evaluate(src: string, opts: { angle?: AngleMode; ans?: number } = {}): number {
  const toks = tokenize(src);
  const angle = opts.angle ?? "deg";
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === "op" && peek()!.v === v;
  const startsPrimary = () => {
    const k = peek();
    return !!k && (k.t === "id" || (k.t === "op" && k.v === "("));
  };

  const toRad = (x: number) => (angle === "deg" ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angle === "deg" ? (x * 180) / Math.PI : x);
  const apply = (f: string, x: number): number => {
    switch (f) {
      case "sqrt":
        if (x < 0) throw new Error("domain");
        return Math.sqrt(x);
      case "cbrt":
        return Math.cbrt(x);
      case "abs":
        return Math.abs(x);
      case "sin":
        return Math.sin(toRad(x));
      case "cos":
        return Math.cos(toRad(x));
      case "tan":
        return Math.tan(toRad(x));
      case "asin":
        return fromRad(Math.asin(x));
      case "acos":
        return fromRad(Math.acos(x));
      case "atan":
        return fromRad(Math.atan(x));
      case "ln":
        return Math.log(x);
      default:
        return Math.log10(x);
    }
  };

  // expr := term (('+'|'-') term)*
  function expr(): number {
    let v = term();
    while (isOp("+") || isOp("-")) {
      const op = toks[p++]!.v;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  // term := unary (('*'|'/') unary | implicit unary)*
  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp("*") || isOp("/")) {
        const op = toks[p++]!.v;
        const r = unary();
        if (op === "/" && r === 0) throw new Error("divide by zero");
        v = op === "*" ? v * r : v / r;
      } else if (startsPrimary()) v *= power();
      else return v;
    }
  }
  function unary(): number {
    if (isOp("-")) {
      p++;
      return -unary();
    }
    if (isOp("+")) {
      p++;
      return unary();
    }
    return power();
  }
  // power := postfix ('^' unary)?   (right-associative; -2^2 = -4)
  function power(): number {
    const base = postfix();
    if (isOp("^")) {
      p++;
      return base ** unary();
    }
    return base;
  }
  function postfix(): number {
    let v = primary();
    while (isOp("%")) {
      p++;
      v /= 100;
    }
    return v;
  }
  function primary(): number {
    const k = toks[p++];
    if (!k) throw new Error("incomplete");
    if (k.t === "num") return k.v;
    if (k.t === "op" && k.v === "(") {
      const v = expr();
      if (!isOp(")")) throw new Error("missing )");
      p++;
      return v;
    }
    if (k.t === "id") {
      if (k.v === "pi") return Math.PI;
      if (k.v === "e") return Math.E;
      if (k.v === "ans") return opts.ans ?? 0;
      if (FUNCS.has(k.v)) {
        // sqrt9 and sqrt(9) both work.
        return apply(k.v, isOp("(") ? primary() : power());
      }
    }
    throw new Error("syntax");
  }

  const v = expr();
  if (p !== toks.length) throw new Error("syntax");
  if (!Number.isFinite(v)) throw new Error("result");
  return v;
}

/** Display a result without float noise (0.1 + 0.2 → 0.3). */
export function formatResult(x: number): string {
  if (Number.isInteger(x)) return String(x);
  const r = Number.parseFloat(x.toPrecision(12));
  return Math.abs(r) < 1e-10 ? "0" : String(r);
}
