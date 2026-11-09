/**
 * The WilloPrep mark: a symmetrical W whose outer strokes grow into antler
 * tines. Drawn as round-capped strokes on a 64 grid, mirrored on x = 32.
 *
 *  - `full`: two tines a side, for 32px and up.
 *  - `simple`: one tine a side, for favicons and anything under 32px.
 *
 * Swap these paths to update the mark everywhere (app, emails, icons via
 * `pnpm brand`).
 */
export const ANTLER = {
  stem: "M10.5 9 Q13 34 22 53 Q27 39 32 27 Q37 39 42 53 Q51 34 53.5 9",
  tines: {
    full: ["M11.8 21 Q6.5 18.5 4.5 12", "M52.2 21 Q57.5 18.5 59.5 12", "M14.6 33 Q9 32.5 6 28", "M49.4 33 Q55 32.5 58 28"],
    simple: ["M12.6 26 Q7 24 4.5 17", "M51.4 26 Q57 24 59.5 17"],
  },
  /** Stroke widths (stem, tines) per variant. */
  weight: { full: [6.2, 4.4], simple: [6.6, 5] },
  /** Glyph weight: thicker, to sit with ExtraBold type. */
  glyph: [7.4, 5.2],
} as const;

/** The inner SVG markup (for scripts that write .svg files). */
export function antlerPaths(color: string, variant: "full" | "simple" = "full", weight?: readonly [number, number]) {
  const [stem, tine] = weight ?? ANTLER.weight[variant];
  return [`<path d="${ANTLER.stem}" stroke="${color}" stroke-width="${stem}"/>`, ...ANTLER.tines[variant].map((d) => `<path d="${d}" stroke="${color}" stroke-width="${tine}"/>`)].join("");
}

