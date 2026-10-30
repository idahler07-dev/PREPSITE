/**
 * The Satify mark: a Rising S inside a cobalt squircle (28% corner radius,
 * smoothed corners). The S finishes as an upward stroke with an arrow tip:
 * progress. One geometry, two renderings, all plain SVG:
 *
 * - flat  (16–48px): solid squircle, the S in one color, slightly heavier strokes.
 * - gloss (64px and up): gradient squircle with an inner glow and rim light; the
 *   S is a soft 3D ribbon (gradient, highlight, ambient occlusion underneath).
 *   Brighter edges in dark mode.
 *
 * Everything is built as SVG strings so the React components, the /manage/design
 * page and scripts/make-brand.ts (favicons, app icons, OG image) share it.
 * The viewBox is 64×64 throughout.
 */

export const MARK_SIZE = 64;
/** Corner radius as a share of the side. */
export const MARK_RADIUS = 0.28;
/** Geist Bold cap height (710/1000 units). The wordmark uses mark height = cap height × 1.3. */
export const GEIST_CAP_HEIGHT = 0.71;
export const WORDMARK = { tracking: -0.035, markScale: 1.3, gap: 0.35 } as const;

export type MarkConcept = "rise" | "steps" | "bubble";
export const MARK_CONCEPTS: MarkConcept[] = ["rise", "steps", "bubble"];
/** The concept in use. Why: see DESIGN.md → Logo. */
export const CHOSEN_CONCEPT: MarkConcept = "rise";

const r2 = (n: number) => Math.round(n * 100) / 100;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Squircle: a rounded square with smoothed (continuous-curvature) corners. */
export function squirclePath(size = MARK_SIZE, radius = size * MARK_RADIUS, smoothing = 0.6) {
  const w = size;
  const h = size;
  const R = radius;
  const p = Math.min((1 + smoothing) * R, size / 2);
  const arc = 90 * (1 - smoothing);
  const asl = Math.sin(rad(arc / 2)) * R * Math.SQRT2;
  const alpha = (90 - arc) / 2;
  const p34 = R * Math.tan(rad(alpha / 2));
  const beta = 45 * smoothing;
  const c = p34 * Math.cos(rad(beta));
  const d = c * Math.tan(rad(beta));
  const b = (p - asl - c - d) / 3;
  const a = 2 * b;
  const n = (v: number) => r2(v);
  return [
    `M${n(w - p)} 0`,
    `c${n(a)} 0 ${n(a + b)} 0 ${n(a + b + c)} ${n(d)}`,
    `a${n(R)} ${n(R)} 0 0 1 ${n(asl)} ${n(asl)}`,
    `c${n(d)} ${n(c)} ${n(d)} ${n(b + c)} ${n(d)} ${n(a + b + c)}`,
    `L${w} ${n(h - p)}`,
    `c0 ${n(a)} 0 ${n(a + b)} ${n(-d)} ${n(a + b + c)}`,
    `a${n(R)} ${n(R)} 0 0 1 ${n(-asl)} ${n(asl)}`,
    `c${n(-c)} ${n(d)} ${n(-(b + c))} ${n(d)} ${n(-(a + b + c))} ${n(d)}`,
    `L${n(p)} ${h}`,
    `c${n(-a)} 0 ${n(-(a + b))} 0 ${n(-(a + b + c))} ${n(-d)}`,
    `a${n(R)} ${n(R)} 0 0 1 ${n(-asl)} ${n(-asl)}`,
    `c${n(-d)} ${n(-c)} ${n(-d)} ${n(-(b + c))} ${n(-d)} ${n(-(a + b + c))}`,
    `L0 ${n(p)}`,
    `c0 ${n(-a)} 0 ${n(-(a + b))} ${n(d)} ${n(-(a + b + c))}`,
    `a${n(R)} ${n(R)} 0 0 1 ${n(asl)} ${n(-asl)}`,
    `c${n(c)} ${n(-d)} ${n(b + c)} ${n(-d)} ${n(a + b + c)} ${n(-d)}`,
    "Z",
  ].join("");
}

/** A concept's shapes: stroked paths (round caps) and filled shapes, at a given weight. */
interface Shape {
  strokes: { d: string; w: number; opacity?: number }[];
  fills: { d: string; opacity?: number }[];
}

const S_BODY = "M19 45C25 50 42 49.5 42 40.5C42 31.5 22 33 22 24.5C22 17 32 14.5 41 17.5";
const S_TIP = "M36.5 12.5L44 16.5L40.5 24";
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;

/** `small` thickens strokes for 16–48px. */
function shape(concept: MarkConcept, small: boolean): Shape {
  const k = small ? 1.18 : 1;
  switch (concept) {
    case "rise":
      return {
        strokes: [
          { d: S_BODY, w: 6.5 * k },
          { d: S_TIP, w: 5 * k },
        ],
        fills: [],
      };
    case "steps":
      return {
        strokes: [],
        fills: [
          { d: rect(14, 36, 9, 14, 4.5), opacity: 0.55 },
          { d: rect(27.5, 27, 9, 23, 4.5), opacity: 0.8 },
          { d: rect(41, 18, 9, 32, 4.5) },
        ],
      };
    case "bubble":
      return {
        strokes: [{ d: circle(32, 32, 17), w: 4 * k, opacity: 0.45 }],
        fills: [{ d: circle(32, 32, 10) }, { d: circle(46, 18.5, 3.6) }],
      };
  }
}

export interface FlatColors {
  bg: string;
  fg: string;
}
export const FLAT_COLORS = {
  light: { bg: "#2747F5", fg: "#FFFFFF" },
  dark: { bg: "#6F86FF", fg: "#090C16" },
} as const satisfies Record<string, FlatColors>;

const op = (o?: number) => (o == null ? "" : ` opacity="${o}"`);

/**
 * Flat mark, inner SVG markup. `colors` may be CSS values; pass classes instead
 * (bgClass/fgClass/strokeClass) to theme it from CSS.
 */
export function flatMarkInner(concept: MarkConcept, colors: FlatColors | { bgClass: string; fgClass: string; strokeClass: string }) {
  const s = shape(concept, true);
  const bg = "bg" in colors ? `fill="${colors.bg}"` : `class="${colors.bgClass}"`;
  const fg = "fg" in colors ? `fill="${colors.fg}"` : `class="${colors.fgClass}"`;
  const stroke = "fg" in colors ? `stroke="${colors.fg}"` : `class="${colors.strokeClass}"`;
  return [
    `<path d="${squirclePath()}" ${bg}/>`,
    ...s.fills.map((f) => `<path d="${f.d}" ${fg}${op(f.opacity)}/>`),
    ...s.strokes.map((t) => `<path d="${t.d}" fill="none" ${stroke} stroke-width="${r2(t.w)}" stroke-linecap="round" stroke-linejoin="round"${op(t.opacity)}/>`),
  ].join("");
}

const GLOSS = {
  light: { bg: ["#6C84FF", "#2F4EF6", "#1C32C4"], glow: 0.4, rim: 0.42, edge: 0.26, ao: 0.32, symbolEdge: "#C9D2FF" },
  dark: { bg: ["#8A9DFF", "#4762FF", "#2236CF"], glow: 0.48, rim: 0.8, edge: 0.18, ao: 0.4, symbolEdge: "#DDE3FF" },
} as const;

/**
 * Gloss mark, inner SVG markup. `id` keeps gradient ids unique when several
 * marks share a page. `fullBleed` draws a square background (app icons, which
 * the OS masks); `symbolScale` shrinks the symbol into a maskable safe zone.
 */
export function glossMarkInner(
  concept: MarkConcept,
  theme: "light" | "dark",
  id: string,
  { fullBleed = false, symbolScale = 1 }: { fullBleed?: boolean; symbolScale?: number } = {},
) {
  const s = shape(concept, false);
  const t = GLOSS[theme];
  const sq = fullBleed ? "M0 0H64V64H0Z" : squirclePath();
  const u = (name: string) => `${id}-${name}`;
  const group = symbolScale === 1 ? "<g>" : `<g transform="translate(32 32) scale(${symbolScale}) translate(-32 -32)">`;
  const layer = (paint: (kind: "stroke" | "fill") => string, extra = "", grow = 0) =>
    [
      ...s.fills.map((f) => `<path d="${f.d}" ${paint("fill")}${op(f.opacity)}${extra}/>`),
      ...s.strokes.map(
        (st) => `<path d="${st.d}" fill="none" ${paint("stroke")} stroke-width="${r2(st.w + grow)}" stroke-linecap="round" stroke-linejoin="round"${op(st.opacity)}${extra}/>`,
      ),
    ].join("");
  return [
    "<defs>",
    `<linearGradient id="${u("bg")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg[0]}"/><stop offset=".5" stop-color="${t.bg[1]}"/><stop offset="1" stop-color="${t.bg[2]}"/></linearGradient>`,
    `<radialGradient id="${u("glow")}" cx=".3" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity="${t.glow}"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="${u("edge")}" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#0A1260" stop-opacity="0"/><stop offset="1" stop-color="#0A1260" stop-opacity="${t.edge}"/></linearGradient>`,
    `<linearGradient id="${u("rim")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${t.rim}"/><stop offset=".5" stop-color="#fff" stop-opacity="${r2(t.rim * 0.2)}"/><stop offset="1" stop-color="#C9C0FF" stop-opacity="${r2(t.rim * 0.8)}"/></linearGradient>`,
    `<linearGradient id="${u("sym")}" gradientUnits="userSpaceOnUse" x1="0" y1="12" x2="0" y2="52"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${t.symbolEdge}"/></linearGradient>`,
    `<clipPath id="${u("sq")}"><path d="${sq}"/></clipPath>`,
    "</defs>",
    // Squircle: gradient, inner glow from the top, darker lower edge, rim highlight.
    `<path d="${sq}" fill="url(#${u("bg")})"/>`,
    `<path d="${sq}" fill="url(#${u("glow")})"/>`,
    `<path d="${sq}" fill="url(#${u("edge")})"/>`,
    fullBleed ? "" : `<path d="${sq}" fill="none" stroke="url(#${u("rim")})" stroke-width="2.6" clip-path="url(#${u("sq")})"/>`,
    group,
    // Symbol: occlusion underneath, the gradient ribbon, a thin highlight on top.
    layer((k) => `${k}="#0A1255" ${k}-opacity="${t.ao}"`, ' transform="translate(0 1.6)"', 0.8),
    layer((k) => `${k}="url(#${u("sym")})"`),
    s.strokes.length
      ? s.strokes
          .map(
            (st) =>
              `<path d="${st.d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${r2(st.w * 0.22)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(-.5 -.8)"/>`,
          )
          .join("")
      : "",
    "</g>",
  ].join("");
}

export const svgDoc = (inner: string, size = MARK_SIZE) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_SIZE} ${MARK_SIZE}" width="${size}" height="${size}">${inner}</svg>\n`;
