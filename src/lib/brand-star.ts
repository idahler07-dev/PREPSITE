/**
 * The Satify mark: an 8-point star (the khatam of Uzbek tilework), drawn as
 * two overlapping squares with a small star cut out of the centre. Used by
 * the logo, icons, background tiles and celebrations, in a 32×32 box.
 */
function starPoints(cx: number, cy: number, outer: number, inner: number, rotate = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((i * 22.5 + rotate - 90) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

// Inner vertices of two overlapping squares sit at cos45°/cos22.5° of the outer radius.
const SQUARES = Math.SQRT1_2 / Math.cos(Math.PI / 8);

/** SVG path data (fill-rule evenodd) for the star in a 32×32 viewBox. */
export function brandStarPath(): string {
  return starPoints(16, 16, 15.5, 15.5 * SQUARES) + starPoints(16, 16, 5.6, 5.6 * SQUARES, 22.5);
}
