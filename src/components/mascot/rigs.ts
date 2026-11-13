/**
 * Puppet rigs for every Willo image, read off the art by hand (fractions of the
 * image: x of its width, y of its height; radii are fractions of the width).
 * Keys are the image path without size suffix (-sm, -hd) or extension.
 *
 *  n     the neck: the head turns about it; everything above n.y is head
 *  band  how soft the neck seam is (fraction of height)
 *  c, R  optional: keep the head move inside this circle (busts on a disc)
 *  foot  the ground line the body breathes up from
 *  limbs [shoulder x, y, hand x, y, radius, kind]
 *        kind: "sway" hangs and shifts with the breath, now and then lifts a little
 *              "wave" a raised hand: small idle bob, now and then a gentle wave
 *              "hold" holds a prop: a slow tilt, no taper at the shoulder
 *              "tap"  a paw on keys: small taps in short runs
 *  tail  the scarf tail: [knot x, y, end x, y, radius]
 *  tears drawn tears a fresh drop can roll from: [x, y]
 *  wink, bulb, hop: see below
 */
export type LimbKind = "sway" | "wave" | "hold" | "tap";
export type Limb = [number, number, number, number, number, LimbKind];
export interface Rig {
  still?: boolean;
  n?: [number, number];
  band?: number;
  c?: [number, number];
  R?: number;
  foot?: number;
  limbs?: Limb[];
  tail?: [number, number, number, number, number];
  tears?: [number, number][];
  /** wink poses: the winking eye [x, y, rx, ry]; the base art is the -open copy */
  wink?: [number, number, number, number];
  /** the idea bulb's glass [x, y, r] */
  bulb?: [number, number, number];
  /** props held in a hand move rigidly with it: [x, y, half-width, limb index, half-height (of height)] */
  props?: [number, number, number, number, number?][];
  /** celebratory poses hop now and then */
  hop?: boolean;
}

const bust = (c: [number, number], n: [number, number], R: number): Rig => ({
  n,
  band: 0.03,
  c,
  R,
  foot: 1,
});

export const RIGS: Record<string, Rig> = {
  // die-cut stickers
  "/mascot/formats/sticker-stand": {
    n: [0.5, 0.66],
    band: 0.04,
    foot: 0.93,
    tail: [0.25, 0.72, 0.08, 0.76, 0.1],
  },
  "/mascot/formats/sticker-cheer": {
    n: [0.48, 0.65],
    band: 0.04,
    foot: 0.94,
    limbs: [[0.7, 0.68, 0.8, 0.47, 0.08, "wave"]],
    tail: [0.25, 0.72, 0.08, 0.75, 0.1],
    hop: true,
  },
  "/mascot/formats/sticker-wink-open": {
    n: [0.47, 0.66],
    band: 0.04,
    foot: 0.94,
    limbs: [[0.66, 0.75, 0.78, 0.7, 0.08, "wave"]],
    tail: [0.25, 0.72, 0.08, 0.75, 0.1],
    wink: [0.382, 0.548, 0.0625, 0.0846],
  },
  "/mascot/formats/sticker-sad": {
    n: [0.5, 0.68],
    band: 0.04,
    foot: 0.95,
    tail: [0.22, 0.73, 0.08, 0.75, 0.09],
    tears: [
      [0.39, 0.635],
      [0.73, 0.585],
    ],
  },
  // circle avatars and busts
  "/mascot/formats/avatar-stand": bust([0.42, 0.78], [0.42, 0.9], 0.28),
  "/mascot/formats/avatar-wink-open": {
    ...bust([0.4, 0.78], [0.42, 0.9], 0.28),
    wink: [0.388, 0.788, 0.0667, 0.0611],
  },
  "/mascot/formats/avatar-think": bust([0.45, 0.8], [0.45, 0.92], 0.26),
  "/mascot/formats/behind-stand": { n: [0.5, 0.78], band: 0.04, foot: 1 },
  "/mascot/formats/behind-wink-open": {
    n: [0.5, 0.78],
    band: 0.04,
    foot: 1,
    wink: [0.359, 0.611, 0.072, 0.0994],
  },
  "/mascot/formats/peek-stand": { n: [0.5, 0.78], band: 0.03, foot: 1 },
  "/mascot/formats/peek-idea": { n: [0.48, 0.76], band: 0.03, foot: 1 },
  "/mascot/formats/icon-stand": { still: true },
  "/mascot/formats/icon-wink": { still: true },
  // full poses
  "/mascot/deer-stand": {
    n: [0.5, 0.55],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.33, 0.66, 0.34, 0.77, 0.07, "sway"],
      [0.7, 0.66, 0.74, 0.77, 0.07, "sway"],
    ],
    tail: [0.3, 0.6, 0.05, 0.66, 0.1],
  },
  "/mascot/deer-wink-open": {
    n: [0.5, 0.53],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.72, 0.62, 0.84, 0.56, 0.08, "wave"],
      [0.34, 0.66, 0.35, 0.76, 0.07, "sway"],
    ],
    tail: [0.28, 0.6, 0.04, 0.64, 0.1],
    wink: [0.361, 0.4415, 0.0708, 0.0705],
  },
  "/mascot/deer-cheer": {
    n: [0.5, 0.55],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.72, 0.58, 0.84, 0.38, 0.08, "wave"],
      [0.44, 0.7, 0.4, 0.66, 0.06, "sway"],
    ],
    tail: [0.3, 0.62, 0.05, 0.68, 0.1],
    hop: true,
  },
  "/mascot/deer-jump": {
    n: [0.5, 0.55],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.27, 0.57, 0.1, 0.5, 0.08, "wave"],
      [0.72, 0.56, 0.85, 0.44, 0.08, "wave"],
    ],
    tail: [0.3, 0.66, 0.05, 0.74, 0.1],
    hop: true,
  },
  "/mascot/deer-idea": {
    n: [0.5, 0.54],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.72, 0.6, 0.82, 0.46, 0.07, "wave"],
      [0.44, 0.72, 0.4, 0.65, 0.06, "sway"],
    ],
    tail: [0.3, 0.6, 0.05, 0.64, 0.1],
    bulb: [0.835, 0.19, 0.075],
  },
  "/mascot/deer-trophy": {
    n: [0.53, 0.55],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.75, 0.58, 0.84, 0.44, 0.09, "wave"],
      [0.4, 0.66, 0.36, 0.6, 0.06, "sway"],
    ],
    tail: [0.28, 0.62, 0.05, 0.68, 0.1],
    props: [[0.865, 0.3, 0.14, 0, 0.13]],
    hop: true,
  },
  "/mascot/deer-heart": {
    n: [0.5, 0.54],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.58, 0.7, 0.85, 0.66, 0.16, "hold"]],
    tail: [0.25, 0.62, 0.03, 0.66, 0.1],
    props: [[0.68, 0.68, 0.17, 0, 0.15]],
  },
  "/mascot/deer-think": {
    n: [0.55, 0.6],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.72, 0.7, 0.68, 0.56, 0.06, "sway"]],
    tail: [0.32, 0.7, 0.12, 0.76, 0.1],
  },
  "/mascot/deer-read": {
    n: [0.55, 0.58],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.42, 0.74, 0.85, 0.68, 0.12, "hold"]],
    tail: [0.25, 0.65, 0.1, 0.68, 0.08],
  },
  "/mascot/deer-laptop": {
    n: [0.55, 0.6],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.42, 0.7, 0.48, 0.76, 0.06, "tap"]],
    tail: [0.3, 0.64, 0.15, 0.68, 0.08],
  },
  "/mascot/deer-sad": {
    n: [0.5, 0.67],
    band: 0.04,
    foot: 0.98,
    tail: [0.28, 0.75, 0.05, 0.78, 0.1],
    tears: [
      [0.42, 0.59],
      [0.86, 0.51],
    ],
  },
  "/mascot/deer-sleep": {
    n: [0.45, 0.88],
    band: 0.05,
    c: [0.45, 0.62],
    R: 0.26,
    foot: 0.98,
  },
};

/** The open-eyed base for a wink image (wink poses animate from open eyes). */
export function openSrc(src: string): string {
  // the app icon is a single drawn image (no open-eyed copy)
  return src.replace(
    /(deer|sticker|avatar|behind)-wink(-sm|-hd)?\.(png|webp)/g,
    "$1-wink-open$2.$3",
  );
}

/** The rig key for an image URL or path. */
export function rigKey(src: string): string {
  const path = src.startsWith("http") ? new URL(src).pathname : src;
  return path
    .replace(/^.*?\/mascot\//, "/mascot/")
    .replace(/(-sm|-hd)?\.(png|webp)$/, "");
}

/** The image for a mood: happy cheers, sad cries (its own drawn pose, not an overlay). */
export function moodSrc(src: string, mood: "idle" | "happy" | "cry"): string {
  if (mood === "idle") return src;
  const pose = mood === "happy" ? "cheer" : "sad";
  if (/\/formats\/sticker-[a-z]+\.png/.test(src))
    return src.replace(/sticker-[a-z]+\.png/, `sticker-${pose}.png`);
  if (/\/mascot\/deer-[a-z]+(-sm|-hd)?\.webp/.test(src))
    return src.replace(/deer-[a-z]+(-sm|-hd)?\.webp/g, `deer-${pose}$1.webp`);
  return src;
}
