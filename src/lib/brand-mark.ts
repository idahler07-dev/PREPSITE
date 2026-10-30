/**
 * The Satify app mark: Otto's head and two curling arms, white, inside a
 * rounded cobalt square. 32×32 viewBox; used by the icons and the in-app mark.
 * Eyes are drawn in the background color so they read as cut-outs.
 */
export const BRAND_MARK = {
  radius: 8,
  head: "M7.5 17.2C7.2 4.6 24.8 4.6 24.5 17.2V18.6C24.5 20.6 22.5 21.4 16 21.4C9.5 21.4 7.5 20.6 7.5 18.6Z",
  eyes: [
    { cx: 12.6, cy: 14.6, r: 2.3 },
    { cx: 19.4, cy: 14.6, r: 2.3 },
  ],
  arms: ["M11.2 21C10.8 24.4 8.6 26 6.6 25.4C5.4 25 5.7 23.6 6.9 23.6", "M20.8 21C21.2 24.4 23.4 26 25.4 25.4C26.6 25 26.3 23.6 25.1 23.6"],
  stroke: 2.4,
} as const;
