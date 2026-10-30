/**
 * The Satify mark: Otto the octopus inside a cobalt squircle (28% corner
 * radius, smoothed corners). One geometry, two renderings, all plain SVG:
 *
 * - flat  (16–48px): solid squircle, Otto in one color, eyes cut out.
 *   Thicker arms without curl tails so it stays crisp at favicon size.
 * - gloss (64px and up): gradient squircle with an inner glow and rim, Otto with
 *   a soft 3D body (layered gradients, specular highlight, rim light, ambient
 *   occlusion) and a contact shadow. Brighter edges in dark mode.
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

export type MarkConcept = "curls" | "rise" | "stamp";
export const MARK_CONCEPTS: MarkConcept[] = ["curls", "rise", "stamp"];
/** The concept in use. Why: see DESIGN.md → Logo. */
export const CHOSEN_CONCEPT: MarkConcept = "curls";

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

/** Mirror an absolute path (M/C/L/S/Q only) across the vertical center line. */
function mirror(d: string) {
  let i = 0;
  return d.replace(/-?\d*\.?\d+/g, (num) => String(r2(i++ % 2 === 0 ? MARK_SIZE - Number(num) : Number(num))));
}
const pair = (left: string[]) => [...left, ...left.map(mirror)];

interface Geometry {
  head: string;
  eyes: { cx: number; cy: number; rx: number; ry: number }[];
  arms: string[];
  /** Extra stroked shapes drawn with the arms (the arrow tip). */
  extras?: string[];
  stroke: number;
  /** Where the contact shadow sits. */
  floor: number;
}

/** Large geometry (gloss), per concept. */
function geometry(concept: MarkConcept): Geometry {
  const head = "M17 35C17 21.2 23.7 12 32 12C40.3 12 47 21.2 47 35V36.6C47 38.5 45.5 40 43.6 40H20.4C18.5 40 17 38.5 17 36.6Z";
  const eyes = [
    { cx: 26.6, cy: 27.6, rx: 3.1, ry: 3.8 },
    { cx: 37.4, cy: 27.6, rx: 3.1, ry: 3.8 },
  ];
  const outer = "M21.6 39.4C21.2 44.6 18.2 48 14.4 48C11.6 48 10.6 44.8 12.6 43.6C14.2 42.7 15.9 44 15.3 45.6";
  const inner = "M28.4 40C28.4 46.2 27 50.6 23.8 52C21.4 53 19.6 50.8 20.8 49.2C21.8 48 23.6 48.5 23.4 50.1";
  switch (concept) {
    case "curls":
      return { head, eyes, arms: pair([outer, inner]), stroke: 4.2, floor: 55 };
    case "rise":
      return {
        head,
        eyes,
        arms: [outer, inner, mirror(inner), "M42.4 39.4C47.6 38.6 51 33.6 51 23.6"],
        extras: ["M46.6 27.6L51 23.2L55.4 27.6"],
        stroke: 4.2,
        floor: 55,
      };
    case "stamp":
      return {
        head: "M14 34C14 19.6 22 10 32 10C42 10 50 19.6 50 34V45.2C50 47.6 47.2 48.6 45.6 46.8C44 45 41.6 45 40.2 46.8C38.6 48.8 35.6 48.8 34 46.8C32.9 45.4 31.1 45.4 30 46.8C28.4 48.8 25.4 48.8 23.8 46.8C22.4 45 20 45 18.4 46.8C16.8 48.6 14 47.6 14 45.2Z",
        eyes: [
          { cx: 25.6, cy: 28.4, rx: 3.6, ry: 4.4 },
          { cx: 38.4, cy: 28.4, rx: 3.6, ry: 4.4 },
        ],
        arms: [],
        stroke: 0,
        floor: 52,
      };
  }
}

/** Small (flat) geometry: bigger head and eyes, short thick arms, no curl tails. */
function smallGeometry(concept: MarkConcept): Geometry {
  if (concept === "stamp") return { ...geometry("stamp") };
  const head = "M14.5 34C14.5 19.5 22.4 10 32 10C41.6 10 49.5 19.5 49.5 34V36.4C49.5 38.6 47.8 40.4 45.6 40.4H18.4C16.2 40.4 14.5 38.6 14.5 36.4Z";
  const eyes = [
    { cx: 25.4, cy: 27, rx: 4, ry: 4.9 },
    { cx: 38.6, cy: 27, rx: 4, ry: 4.9 },
  ];
  const outer = "M19.8 40C19.4 45.4 16.4 48.6 12.2 48.6";
  const inner = "M28 40.4C28 46.4 26.2 50.6 22.2 52";
  if (concept === "rise") {
    return { head, eyes, arms: [outer, inner, mirror(inner), "M44.2 40C49.4 39 52.4 34.2 52.4 26.4"], extras: ["M47.4 30.6L52.4 25.6L57.4 30.6"], stroke: 5.6, floor: 54 };
  }
  return { head, eyes, arms: pair([outer, inner]), stroke: 5.6, floor: 54 };
}

export interface FlatColors {
  bg: string;
  fg: string;
}
export const FLAT_COLORS = {
  light: { bg: "#2747F5", fg: "#FFFFFF" },
  dark: { bg: "#6F86FF", fg: "#090C16" },
} as const satisfies Record<string, FlatColors>;

/**
 * Flat mark, inner SVG markup. `colors` may be CSS values; pass classes instead
 * (bgClass/fgClass/strokeClass) to theme it from CSS.
 */
export function flatMarkInner(concept: MarkConcept, colors: FlatColors | { bgClass: string; fgClass: string; strokeClass: string }) {
  const g = smallGeometry(concept);
  const bg = "bg" in colors ? `fill="${colors.bg}"` : `class="${colors.bgClass}"`;
  const fg = "fg" in colors ? `fill="${colors.fg}"` : `class="${colors.fgClass}"`;
  const stroke = "fg" in colors ? `stroke="${colors.fg}"` : `class="${colors.strokeClass}"`;
  return [
    `<path d="${squirclePath()}" ${bg}/>`,
    `<path d="${g.head}" ${fg}/>`,
    ...g.eyes.map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" ${bg}/>`),
    ...[...g.arms, ...(g.extras ?? [])].map(
      (d) => `<path d="${d}" fill="none" ${stroke} stroke-width="${g.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ),
  ].join("");
}

const GLOSS = {
  light: {
    bg: ["#6C84FF", "#2F4EF6", "#1C32C4"],
    glow: 0.42,
    rim: 0.38,
    bodyRim: 0.85,
    edgeShade: 0.28,
    shadow: 0.42,
  },
  dark: {
    bg: ["#8A9DFF", "#4762FF", "#2236CF"],
    glow: 0.5,
    rim: 0.75,
    bodyRim: 1,
    edgeShade: 0.2,
    shadow: 0.5,
  },
} as const;

/**
 * Gloss mark, inner SVG markup. `id` keeps gradient ids unique when several
 * marks share a page.
 */
export function glossMarkInner(
  concept: MarkConcept,
  theme: "light" | "dark",
  id: string,
  { fullBleed = false, ottoScale = 1 }: { fullBleed?: boolean; ottoScale?: number } = {},
) {
  const g = geometry(concept);
  const t = GLOSS[theme];
  // App icons are masked by the OS, so they get a square background.
  const sq = fullBleed ? "M0 0H64V64H0Z" : squirclePath();
  const otto = ottoScale === 1 ? "<g>" : `<g transform="translate(32 34) scale(${ottoScale}) translate(-32 -34)">`;
  const u = (name: string) => `${id}-${name}`;
  const strokes = [...g.arms, ...(g.extras ?? [])];
  const stroke = (attrs: string, extra = "") =>
    strokes.map((d) => `<path d="${d}" fill="none" ${attrs} stroke-linecap="round" stroke-linejoin="round"${extra}/>`).join("");
  return [
    "<defs>",
    `<linearGradient id="${u("bg")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg[0]}"/><stop offset=".5" stop-color="${t.bg[1]}"/><stop offset="1" stop-color="${t.bg[2]}"/></linearGradient>`,
    `<radialGradient id="${u("glow")}" cx=".5" cy="0" r=".85"><stop offset="0" stop-color="#fff" stop-opacity="${t.glow}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="${u("edge")}" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#0A1260" stop-opacity="0"/><stop offset="1" stop-color="#0A1260" stop-opacity="${t.edgeShade}"/></linearGradient>`,
    `<linearGradient id="${u("rim")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${t.rim}"/><stop offset=".5" stop-color="#fff" stop-opacity="${t.rim * 0.25}"/><stop offset="1" stop-color="#fff" stop-opacity="${t.rim * 0.6}"/></linearGradient>`,
    `<radialGradient id="${u("body")}" cx=".38" cy=".26" r=".8"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#F2F4FF"/><stop offset=".82" stop-color="#C9D1FF"/><stop offset="1" stop-color="#A7B4FF"/></radialGradient>`,
    `<linearGradient id="${u("ao")}" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#101A70" stop-opacity="0"/><stop offset="1" stop-color="#101A70" stop-opacity=".3"/></linearGradient>`,
    `<linearGradient id="${u("bodyRim")}" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="${t.bodyRim}"/></linearGradient>`,
    `<radialGradient id="${u("spec")}"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${u("shadow")}"><stop offset="0" stop-color="#070C45" stop-opacity="${t.shadow}"/><stop offset="1" stop-color="#070C45" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="${u("arm")}" gradientUnits="userSpaceOnUse" x1="0" y1="22" x2="0" y2="54"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#BCC6FF"/></linearGradient>`,
    `<clipPath id="${u("sq")}"><path d="${sq}"/></clipPath>`,
    `<clipPath id="${u("head")}"><path d="${g.head}"/></clipPath>`,
    "</defs>",
    // Squircle: gradient, inner glow from the top, darker lower edge, rim highlight.
    `<path d="${sq}" fill="url(#${u("bg")})"/>`,
    `<path d="${sq}" fill="url(#${u("glow")})"/>`,
    `<path d="${sq}" fill="url(#${u("edge")})"/>`,
    `<path d="${sq}" fill="none" stroke="url(#${u("rim")})" stroke-width="2.4" clip-path="url(#${u("sq")})"/>`,
    otto,
    // Contact shadow under Otto.
    `<ellipse cx="32" cy="${g.floor}" rx="19" ry="3.4" fill="url(#${u("shadow")})"/>`,
    // Arms: occlusion underneath, the tube, a thin highlight on top.
    stroke(`stroke="#0A1255" stroke-opacity=".28" stroke-width="${g.stroke + 1.6}"`, ' transform="translate(0 1.4)"'),
    stroke(`stroke="url(#${u("arm")})" stroke-width="${g.stroke}"`),
    stroke(`stroke="#fff" stroke-opacity=".55" stroke-width="${r2(g.stroke * 0.28)}"`, ' transform="translate(-.5 -.7)"'),
    // Head: body gradient, ambient occlusion at the base, rim light, specular highlight.
    `<path d="${g.head}" fill="url(#${u("body")})"/>`,
    `<path d="${g.head}" fill="url(#${u("ao")})"/>`,
    `<path d="${g.head}" fill="none" stroke="url(#${u("bodyRim")})" stroke-width="1.6" clip-path="url(#${u("head")})"/>`,
    `<ellipse cx="25" cy="18.6" rx="5.6" ry="2.7" transform="rotate(-32 25 18.6)" fill="url(#${u("spec")})"/>`,
    // Eyes with a highlight each.
    ...g.eyes.map(
      (e) =>
        `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="#121845"/><circle cx="${r2(e.cx + e.rx * 0.32)}" cy="${r2(e.cy - e.ry * 0.38)}" r="${r2(e.rx * 0.36)}" fill="#fff"/>`,
    ),
    "</g>",
  ].join("");
}

export const svgDoc = (inner: string, size = MARK_SIZE) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_SIZE} ${MARK_SIZE}" width="${size}" height="${size}">${inner}</svg>\n`;
