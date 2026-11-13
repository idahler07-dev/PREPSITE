/**
 * The WilloPrep app mark: gold antlers on a lit teal tile ("Sunrise gold").
 * One source for the in-app mark (AppMark) and the icon generator (`pnpm brand`).
 * Geometry is on a 48 grid; static, no user input.
 *
 * Layers (back to front): tile gradient, soft glow behind the W, bottom vignette,
 * top-left shine, rim, blurred cast shade, hard offset shade, antler body (vertical
 * gradient), warm core, bright top-left edge.
 */
const HALF = [
  "M17 37 C11.5 31 8.5 22 9.5 9.5",
  "M15.6 31.5 C18 26 20 22.5 22.3 18.8",
  "M9.4 20 C10.3 16.2 11.6 13.4 13.6 11",
  "M13.8 38.6 H20.6",
] as const;
/** Stroke widths: stem, inner tine, outer tine, base bar. */
const WD = [5.5, 3.8, 3.8, 3.4] as const;

const COLORS = {
  tile: ["#2093A1", "#0E6F7C", "#07313B"],
  glow: "#52C0CC",
  antler: ["#FFB347", "#FFD98A", "#FFF1C9"], // bottom, middle, top
  shade: "#3D1C04",
  core: "#C4620F",
  edge: "#FFFBEA",
} as const;

const both = (inner: string) =>
  `<g>${inner}</g><g transform="matrix(-1 0 0 1 48 0)">${inner}</g>`;

function strokes(
  stroke: string,
  scale: number,
  dx: number,
  dy: number,
  opacity: number,
  extra = "",
) {
  const ps = HALF.map(
    (d, i) => `<path d="${d}" stroke-width="${(WD[i]! * scale).toFixed(2)}"/>`,
  ).join("");
  return `<g ${extra} fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${dx} ${dy})">${ps}</g>`;
}

/**
 * Inner SVG markup for `viewBox="0 0 48 48"`.
 * @param uid unique id prefix (several marks can share a page)
 * @param radius tile corner radius in grid units (0 for full-bleed maskable icons)
 * @param antler antler scale about the tile centre (1 = default, <1 for safe zones, >1 for tiny sizes)
 */
export function markTileInner(
  uid: string,
  { radius = 13, antler = 1 }: { radius?: number; antler?: number } = {},
) {
  const c = COLORS;
  const defs = `<defs>
<linearGradient id="${uid}t" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${c.tile[0]}"/><stop offset=".55" stop-color="${c.tile[1]}"/><stop offset="1" stop-color="${c.tile[2]}"/></linearGradient>
<radialGradient id="${uid}s" cx=".22" cy="0" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="${uid}g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c.glow}" stop-opacity=".6"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient>
<linearGradient id="${uid}v" x1="0" y1=".55" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
<linearGradient id="${uid}a" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="6"><stop offset="0" stop-color="${c.antler[0]}"/><stop offset=".6" stop-color="${c.antler[1]}"/><stop offset="1" stop-color="${c.antler[2]}"/></linearGradient>
<filter id="${uid}b" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur stdDeviation=".8"/></filter></defs>`;
  const ant = [
    both(strokes(c.shade, 1, 0, 1.7, 0.5, `filter="url(#${uid}b)"`)),
    both(strokes(c.shade, 1.08, 0.35, 0.9, 1)),
    both(strokes(`url(#${uid}a)`, 1, 0, 0, 1)),
    both(strokes(c.core, 0.36, 0.6, 0.7, 0.35)),
    both(strokes(c.edge, 0.26, -0.7, -0.7, 0.8)),
  ].join("");
  const rx = radius;
  const rim =
    radius > 0
      ? `<rect x=".6" y=".6" width="46.8" height="46.8" rx="${Math.max(rx - 0.5, 0)}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.1"/>`
      : "";
  return `${defs}<rect width="48" height="48" rx="${rx}" fill="url(#${uid}t)"/><ellipse cx="24" cy="23" rx="20" ry="19" fill="url(#${uid}g)"/>
<rect width="48" height="48" rx="${rx}" fill="url(#${uid}v)"/><rect width="48" height="48" rx="${rx}" fill="url(#${uid}s)"/>${rim}
<g transform="translate(24 24) scale(${antler}) translate(-24 -24)">${ant}</g>`;
}

/** A standalone SVG file/string. */
export function markTileSvg(
  size: number,
  uid = "m",
  opts?: Parameters<typeof markTileInner>[1],
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">${markTileInner(uid, opts)}</svg>`;
}
