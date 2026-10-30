/**
 * WCAG contrast check for every token pair the UI uses, in both themes.
 *   pnpm check:contrast
 * Reads the tokens from src/app/globals.css (:root and .dark). Text pairs need
 * 4.5:1 (AA); controls, focus rings and meaningful graphics need 3:1
 * (WCAG 1.4.11). Exits with code 1 on any failure.
 */
import { readFileSync } from "node:fs";
import { THEME_COLORS } from "../src/config/theme-colors";

const css = readFileSync("src/app/globals.css", "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No ${selector} block`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]!] = m[2]!.trim();
  return vars;
}

const root = block(":root");
const themes = { light: root, dark: { ...root, ...block(".dark") } };

function resolve(vars: Record<string, string>, name: string, depth = 0): string {
  const v = vars[name];
  if (!v) throw new Error(`Unknown token --${name}`);
  const ref = /^var\(--([\w-]+)\)$/.exec(v);
  if (ref && depth < 10) return resolve(vars, ref[1]!, depth + 1);
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${name} is not a 6-digit hex color: ${v}`);
  return v;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function blend(fg: string, bg: string, alpha: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(ch(fg, i) * alpha + ch(bg, i) * (1 - alpha)).toString(16).padStart(2, "0")).join("")}`;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const TEXT = 4.5;
const UI = 3;
const SURFACES = ["background", "section-tint", "surface", "surface-2"];

/** [foreground, background(s), minimum, where it's used] */
const PAIRS: [string, string[], number, string][] = [
  ["foreground", SURFACES, TEXT, "body text"],
  ["muted-foreground", SURFACES, TEXT, "secondary text, captions"],
  ["primary", [...SURFACES, "primary-soft"], TEXT, "links, active nav, selected answer text"],
  ["accent-ink", [...SURFACES, "accent-soft"], TEXT, "coral text and icons"],
  ["correct-ink", [...SURFACES, "correct-soft"], TEXT, "correct answers, positive deltas"],
  ["warning-ink", [...SURFACES, "warning-soft"], TEXT, "warnings, timer's last minutes"],
  ["danger-ink", [...SURFACES, "danger-soft"], TEXT, "errors, wrong answers"],
  ["primary-foreground", ["primary", "primary-hover"], TEXT, "primary button label"],
  ["accent-foreground", ["accent"], TEXT, "accent (upgrade) button label"],
  ["on-fill", ["warning-fill", "correct", "accent"], TEXT, "text on bright fills: flag chip, mint badge, coral CTA"],
  ["success-foreground", ["success"], TEXT, "success badge label"],
  ["destructive-foreground", ["destructive"], TEXT, "destructive button label"],
  ["foreground", ["primary-soft", "accent-soft", "correct-soft", "warning-soft", "danger-soft"], TEXT, "text on tinted panels"],
  ["hl-text", ["hl-yellow", "hl-blue", "hl-pink"], TEXT, "highlighted passage text"],
  ["input", ["surface", "background"], UI, "input and checkbox borders"],
  ["ring", SURFACES, UI, "focus ring"],
  ["primary", ["background", "surface"], UI, "primary button edge, chart lines, skill tiles"],
  ["correct", ["surface"], 1.5, "mint check glow (decorative, paired with correct-ink text)"],
];

/** The lilac highlighter is drawn at 45% over the page; text over it must stay AA. */
const HIGHLIGHTER_ALPHA = 0.45;

let failed = 0;
for (const [theme, vars] of Object.entries(themes)) {
  console.log(`\n${theme.toUpperCase()}`);
  for (const [fg, bgs, min, use] of PAIRS) {
    for (const bg of bgs) {
      const ratio = contrast(resolve(vars, fg), resolve(vars, bg));
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(`  ${ok ? "✓" : "✗"} ${fg.padEnd(22)} on ${bg.padEnd(14)} ${ratio.toFixed(2).padStart(5)}:1  (≥${min}) ${use}`);
    }
  }
  const bar = blend(resolve(vars, "highlight"), resolve(vars, "background"), HIGHLIGHTER_ALPHA);
  const hr = contrast(resolve(vars, "foreground"), bar);
  if (hr < TEXT) failed++;
  console.log(`  ${hr >= TEXT ? "✓" : "✗"} ${"foreground".padEnd(22)} on ${"highlighter".padEnd(14)} ${hr.toFixed(2).padStart(5)}:1  (≥${TEXT}) <hl> emphasis bar at ${HIGHLIGHTER_ALPHA * 100}%`);
  const bg = resolve(vars, "background").toLowerCase();
  if (bg !== THEME_COLORS[theme as "light" | "dark"].toLowerCase()) {
    failed++;
    console.log(`  ✗ THEME_COLORS.${theme} (${THEME_COLORS[theme as "light" | "dark"]}) differs from --background (${bg})`);
  }
}

console.log(failed ? `\n${failed} failing pair(s)` : "\nAll pairs pass WCAG AA.");
process.exit(failed ? 1 : 0);
