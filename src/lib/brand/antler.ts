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


/**
 * The willow leaf: the dot of the "i" in the wordmark and the pin on Willo's
 * scarf. Drawn on a 100×40 grid; gold enamel with an amber-brown rim.
 */
export const LEAF = {
  outline: "M4 24 C24 6 62 2 97 12 C70 28 30 36 4 24 Z",
  vein: "M10 23 C38 16 66 13 91 12.5",
  fillFrom: "#F9D166",
  fillTo: "#E49A35",
  rim: "#B26A22",
} as const;

/** Standalone leaf SVG markup (for scripts). `id` keeps gradient ids unique. */
export function leafSvg(id: string, style = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" overflow="visible" style="${style}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${LEAF.fillFrom}"/><stop offset="1" stop-color="${LEAF.fillTo}"/></linearGradient></defs><path d="${LEAF.outline}" fill="url(#${id})" stroke="${LEAF.rim}" stroke-width="3.5" stroke-linejoin="round"/><path d="${LEAF.vein}" fill="none" stroke="${LEAF.rim}" stroke-width="3" stroke-linecap="round"/></svg>`;
}

/** Wordmark colours: the antler W takes the mascot's antler brown. */
export const WORD_COLORS = {
  light: { antler: "#7A3E1F", ink: "#102D40", prep: "#087F9B" },
  dark: { antler: "#C98A5A", ink: "#E4F7FA", prep: "#20B9D0" },
} as const;
