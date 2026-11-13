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
    n: [0.5, 0.6],
    band: 0.04,
    foot: 0.93,
    limbs: [
      [0.3, 0.66, 0.33, 0.82, 0.07, "sway"],
      [0.66, 0.68, 0.68, 0.84, 0.07, "sway"],
    ],
    tail: [0.3, 0.66, 0.12, 0.68, 0.1],
  },
  "/mascot/formats/sticker-cheer": {
    n: [0.48, 0.6],
    band: 0.04,
    foot: 0.94,
    limbs: [
      [0.68, 0.63, 0.8, 0.46, 0.08, "wave"],
      [0.42, 0.73, 0.36, 0.68, 0.06, "sway"],
    ],
    tail: [0.32, 0.64, 0.12, 0.7, 0.1],
  },
  "/mascot/formats/sticker-wink": {
    n: [0.47, 0.62],
    band: 0.04,
    foot: 0.94,
    limbs: [
      [0.66, 0.71, 0.8, 0.66, 0.08, "wave"],
      [0.33, 0.7, 0.34, 0.82, 0.06, "sway"],
    ],
    tail: [0.32, 0.65, 0.12, 0.68, 0.1],
  },
  "/mascot/formats/sticker-sad": {
    n: [0.5, 0.61],
    band: 0.04,
    foot: 0.92,
    tail: [0.3, 0.64, 0.12, 0.66, 0.1],
    tears: [
      [0.405, 0.585],
      [0.785, 0.54],
    ],
  },
  // circle avatars and busts
  "/mascot/formats/avatar-wink": bust([0.62, 0.76], [0.63, 0.9], 0.31),
  "/mascot/formats/avatar-stand": bust([0.6, 0.76], [0.6, 0.9], 0.32),
  "/mascot/formats/avatar-think": bust([0.62, 0.76], [0.62, 0.9], 0.32),
  "/mascot/formats/behind-wink": {
    n: [0.52, 0.8],
    band: 0.04,
    foot: 1,
    tail: [0.8, 0.85, 0.83, 0.99, 0.05],
  },
  "/mascot/formats/behind-stand": {
    n: [0.5, 0.8],
    band: 0.04,
    foot: 1,
    tail: [0.82, 0.88, 0.84, 0.99, 0.04],
  },
  "/mascot/formats/peek-stand": { n: [0.5, 0.78], band: 0.035, foot: 1 },
  "/mascot/formats/peek-idea": { n: [0.5, 0.76], band: 0.035, foot: 1 },
  "/mascot/formats/icon-stand": { still: true },
  "/mascot/formats/icon-wink": { still: true },
  // full poses
  "/mascot/deer-stand": {
    n: [0.52, 0.57],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.35, 0.66, 0.36, 0.78, 0.07, "sway"],
      [0.68, 0.66, 0.74, 0.78, 0.07, "sway"],
    ],
    tail: [0.33, 0.6, 0.06, 0.64, 0.1],
  },
  "/mascot/deer-wink": {
    n: [0.5, 0.56],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.75, 0.66, 0.86, 0.58, 0.08, "wave"],
      [0.33, 0.68, 0.33, 0.78, 0.07, "sway"],
    ],
    tail: [0.3, 0.6, 0.05, 0.66, 0.1],
  },
  "/mascot/deer-cheer": {
    n: [0.5, 0.56],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.8, 0.56, 0.86, 0.4, 0.08, "wave"],
      [0.42, 0.68, 0.38, 0.64, 0.06, "sway"],
    ],
    tail: [0.3, 0.6, 0.05, 0.66, 0.1],
  },
  "/mascot/deer-jump": {
    n: [0.5, 0.58],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.28, 0.58, 0.12, 0.5, 0.08, "wave"],
      [0.7, 0.56, 0.8, 0.44, 0.08, "wave"],
    ],
    tail: [0.3, 0.64, 0.05, 0.7, 0.1],
  },
  "/mascot/deer-idea": {
    n: [0.5, 0.56],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.7, 0.6, 0.8, 0.46, 0.07, "wave"],
      [0.42, 0.62, 0.4, 0.68, 0.06, "sway"],
    ],
    tail: [0.3, 0.6, 0.05, 0.64, 0.1],
  },
  "/mascot/deer-trophy": {
    n: [0.5, 0.56],
    band: 0.04,
    foot: 0.98,
    limbs: [
      [0.7, 0.62, 0.8, 0.3, 0.1, "wave"],
      [0.4, 0.68, 0.36, 0.64, 0.06, "sway"],
    ],
    tail: [0.3, 0.62, 0.08, 0.66, 0.1],
  },
  "/mascot/deer-heart": {
    n: [0.5, 0.56],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.6, 0.7, 0.82, 0.64, 0.15, "hold"]],
    tail: [0.3, 0.62, 0.05, 0.66, 0.1],
  },
  "/mascot/deer-think": {
    n: [0.55, 0.64],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.72, 0.76, 0.67, 0.63, 0.06, "sway"]],
    tail: [0.32, 0.72, 0.12, 0.76, 0.1],
  },
  "/mascot/deer-read": {
    n: [0.55, 0.6],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.45, 0.76, 0.8, 0.7, 0.12, "hold"]],
    tail: [0.25, 0.65, 0.1, 0.68, 0.08],
  },
  "/mascot/deer-laptop": {
    n: [0.52, 0.63],
    band: 0.04,
    foot: 0.98,
    limbs: [[0.44, 0.74, 0.5, 0.8, 0.06, "tap"]],
    tail: [0.3, 0.66, 0.15, 0.7, 0.08],
  },
  "/mascot/deer-sad": {
    n: [0.52, 0.64],
    band: 0.04,
    foot: 0.98,
    tail: [0.3, 0.7, 0.06, 0.72, 0.1],
    tears: [
      [0.43, 0.645],
      [0.86, 0.555],
    ],
  },
  "/mascot/deer-sleep": {
    n: [0.42, 0.86],
    band: 0.05,
    c: [0.42, 0.62],
    R: 0.3,
    foot: 0.98,
  },
};

/** The rig key for an image URL or path. */
export function rigKey(src: string): string {
  const path = src.startsWith("http") ? new URL(src).pathname : src;
  return path.replace(/(-sm|-hd)?\.(png|webp)$/, "");
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
