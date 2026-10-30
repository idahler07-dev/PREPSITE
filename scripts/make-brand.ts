/**
 * Generate the Satify brand assets in public/brand/:
 *   mark.svg / mark-dark.svg   Otto's head and two arms, white, in a rounded cobalt square (favicon; mark.svg follows the system theme)
 *   logo.svg / logo-dark.svg   mark + "Satify" in Geist Bold, -0.03em (text as paths)
 *   logo-email.png             wordmark for email headers (mail apps don't show SVG)
 *   icon-*.png, apple-touch-icon.png, favicon-32.png
 *   og.png                     1200×630 OpenGraph image with the mesh gradient
 *
 *   pnpm brand
 *
 * Fonts are downloaded from Google Fonts at run time (static TTF instances).
 */
import { writeFileSync } from "node:fs";
import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import opentype from "opentype.js";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BRAND_MARK } from "../src/lib/brand-mark";
import { Mascot } from "../src/components/mascot/mascot";

const OUT = "public/brand";
const C = {
  light: { primary: "#2747F5", text: "#0E1222", muted: "#5A6178", bg: "#F5F6FA", border: "#E3E6EF", lilac: "#B7A6FF", coral: "#FF6B4A" },
  dark: { primary: "#6F86FF", text: "#EEF0FA", bg: "#090C16" },
};

/** First TTF URL in a Google Fonts CSS response (no browser user agent → TTF). */
async function googleTtf(query: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = /url\((https:[^)]+\.ttf)\)/.exec(css)?.[1];
  if (!url) throw new Error(`No TTF for ${query}`);
  return (await fetch(url)).arrayBuffer();
}

const markInner = (bg: string, fg: string, cls = false) =>
  `<rect${cls ? ' class="b"' : ""} width="32" height="32" rx="${BRAND_MARK.radius}" fill="${bg}"/>` +
  `<path${cls ? ' class="f"' : ""} d="${BRAND_MARK.head}" fill="${fg}"/>` +
  BRAND_MARK.eyes.map((e) => `<circle${cls ? ' class="b"' : ""} cx="${e.cx}" cy="${e.cy}" r="${e.r}" fill="${bg}"/>`).join("") +
  BRAND_MARK.arms.map((d) => `<path${cls ? ' class="s"' : ""} d="${d}" fill="none" stroke="${fg}" stroke-width="${BRAND_MARK.stroke}" stroke-linecap="round"/>`).join("");

/** Full logo: mark + "Satify" in Geist Bold with -0.03em tracking. */
function wordmarkSvg(font: opentype.Font, colors: { text: string; primary: string; markFg: string }) {
  const size = 64;
  const tracking = -0.03 * size;
  const upm = font.unitsPerEm;
  let x = 0;
  const parts: string[] = [];
  for (const g of font.stringToGlyphs("Satify")) {
    parts.push(g.getPath(x, 0, size).toPathData(2));
    x += ((g.advanceWidth ?? 0) / upm) * size + tracking;
  }
  const textW = x - tracking;
  const ascent = ((font.ascender * 0.8) / upm) * size;
  const descent = ((-font.descender * 0.9) / upm) * size;
  const h = Math.ceil(ascent + descent + 8);
  const mark = h - 6;
  const gap = 16;
  const w = Math.ceil(mark + gap + textW + 4);
  const base = 4 + ascent;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Satify">
  <g transform="translate(0 3) scale(${(mark / 32).toFixed(4)})">${markInner(colors.primary, colors.markFg)}</g>
  <path fill="${colors.text}" transform="translate(${mark + gap} ${base.toFixed(2)})" d="${parts.join("")}"/>
</svg>
`;
}

const markSvg = (bg: string, fg: string, dark?: { bg: string; fg: string }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  ${dark ? `<style>.b{fill:${bg}}.f{fill:${fg}}.s{stroke:${fg}}@media (prefers-color-scheme:dark){.b{fill:${dark.bg}}.f{fill:${dark.fg}}.s{stroke:${dark.fg}}}</style>` : ""}
  ${markInner(bg, fg, !!dark)}
</svg>
`;

/** Otto as a standalone SVG (CSS variables resolved to the light theme colors). */
function ottoSvg(pose: "wave" | "cheer" | "juggle") {
  const vars: Record<string, string> = {
    "--otto-body": "#2747F5",
    "--otto-belly": "#7F95FF",
    "--otto-accent": "#FF6B4A",
    "--otto-eye": "#FFFFFF",
    "--otto-ink": "#0E1222",
    "--flagged": "#F2A20C",
    "--highlight": "#B7A6FF",
    "--correct": "#12B886",
    "--font-sans": "Geist, sans-serif",
  };
  let svg = renderToStaticMarkup(createElement(Mascot, { pose }));
  for (const [k, v] of Object.entries(vars)) svg = svg.replaceAll(`var(${k})`, v);
  return svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"');
}

/** Soft mesh gradient: cobalt, lilac and coral blobs at low opacity, as behind the hero. */
function mesh(ctx: SKRSContext2D, w: number, h: number) {
  const blob = (x: number, y: number, r: number, color: string, a: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `${color}${Math.round(a * 255).toString(16).padStart(2, "0")}`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  blob(w * 0.85, h * 0.15, w * 0.5, C.light.primary, 0.26);
  blob(w * 0.62, h * 1.0, w * 0.45, C.light.lilac, 0.4);
  blob(w * 1.02, h * 0.72, w * 0.36, C.light.coral, 0.24);
}


async function main() {
  const [geistBold, geist, geistSemi, serifItalic] = await Promise.all([
    googleTtf("family=Geist:wght@700"),
    googleTtf("family=Geist:wght@400"),
    googleTtf("family=Geist:wght@600"),
    googleTtf("family=Instrument+Serif:ital@1"),
  ]);
  const font = opentype.parse(geistBold);

  writeFileSync(`${OUT}/mark.svg`, markSvg(C.light.primary, "#FFFFFF", { bg: C.dark.primary, fg: C.dark.bg }));
  writeFileSync(`${OUT}/mark-dark.svg`, markSvg(C.dark.primary, C.dark.bg));
  writeFileSync(`${OUT}/logo.svg`, wordmarkSvg(font, { ...C.light, markFg: "#FFFFFF" }));
  writeFileSync(`${OUT}/logo-dark.svg`, wordmarkSvg(font, { ...C.dark, markFg: C.dark.bg }));

  const wordmark = await loadImage(Buffer.from(wordmarkSvg(font, { ...C.light, markFg: "#FFFFFF" })));
  const eh = 64;
  const el = createCanvas(Math.round((wordmark.width / wordmark.height) * eh), eh);
  el.getContext("2d").drawImage(wordmark, 0, 0, el.width, eh);
  writeFileSync(`${OUT}/logo-email.png`, el.toBuffer("image/png"));

  // App icons: the mark fills the icon; the maskable one keeps the line inside the safe zone.
  const mark = await loadImage(Buffer.from(markSvg(C.light.primary, "#FFFFFF")));
  for (const [size, name, inset] of [
    [32, "favicon-32.png", 0],
    [180, "apple-touch-icon.png", 0],
    [192, "icon-192.png", 0],
    [512, "icon-512.png", 0],
    [512, "icon-maskable-512.png", 0.18],
  ] as const) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    if (inset) {
      ctx.fillStyle = C.light.primary;
      ctx.fillRect(0, 0, size, size);
    }
    const i = size * inset;
    ctx.drawImage(mark, i, i, size - 2 * i, size - 2 * i);
    writeFileSync(`${OUT}/${name}`, c.toBuffer("image/png"));
  }

  // OpenGraph image.
  GlobalFonts.register(Buffer.from(geist), "Geist");
  GlobalFonts.register(Buffer.from(geistSemi), "Geist SemiBold");
  GlobalFonts.register(Buffer.from(geistBold), "Geist Bold");
  GlobalFonts.register(Buffer.from(serifItalic), "Instrument Serif");
  const W = 1200;
  const H = 630;
  const og = createCanvas(W, H);
  const ctx = og.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  mesh(ctx, W, H);
  ctx.drawImage(wordmark, 88, 84, (wordmark.width / wordmark.height) * 56, 56);
  const otto = await loadImage(Buffer.from(ottoSvg("wave")));
  ctx.drawImage(otto, 780, 150, 340, 340);

  const draw = (text: string, x: number, y: number, f: string, color: string) => {
    ctx.font = f;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    return x + ctx.measureText(text).width;
  };
  ctx.textBaseline = "alphabetic";
  const size = 76;
  draw("Your SAT score,", 88, 318, `${size}px 'Geist SemiBold'`, C.light.text);
  let x = draw("planned", 88, 412, `italic ${size + 10}px 'Instrument Serif'`, C.light.primary);
  x = draw(" and ", x, 412, `${size}px 'Geist SemiBold'`, C.light.text);
  ctx.font = `${size}px 'Geist Bold'`;
  const pw = ctx.measureText("proven").width;
  // Lilac highlighter behind the lower half of the bold word.
  ctx.fillStyle = `${C.light.lilac}73`;
  ctx.beginPath();
  ctx.roundRect(x - 4, 412 - size * 0.34, pw + 8, size * 0.42, 10);
  ctx.fill();
  x = draw("proven", x, 412, `${size}px 'Geist Bold'`, C.light.text);
  draw(".", x, 412, `${size}px 'Geist SemiBold'`, C.light.text);
  draw("SAT practice with a plan you can see working.", 88, 494, "30px Geist", C.light.muted);
  ctx.fillStyle = C.light.border;
  ctx.fillRect(88, 540, W - 176, 2);
  draw("SAT® is a trademark of the College Board, which does not endorse this site.", 88, 580, "21px Geist", C.light.muted);
  writeFileSync(`${OUT}/og.png`, og.toBuffer("image/png"));

  console.log(`Brand assets written to ${OUT}/`);
}

void main();
