/**
 * Generate the Satify brand assets in public/brand/:
 *   mark.svg / mark-dark.svg   the 8-point star (favicon; mark.svg follows the system theme)
 *   logo.svg / logo-dark.svg   star + "Satify" wordmark (text as paths, Literata SemiBold)
 *   icon-*.png, apple-touch-icon.png, favicon-32.png   app icons
 *   og.png                     1200×630 OpenGraph image
 *
 *   pnpm tsx scripts/make-brand.ts
 *
 * Fonts are downloaded from Google Fonts at run time (static TTF instances).
 */
import { writeFileSync } from "node:fs";
import { createCanvas, GlobalFonts, loadImage, Path2D, type SKRSContext2D } from "@napi-rs/canvas";
import opentype from "opentype.js";
import { brandStarPath } from "../src/lib/brand-star";

const OUT = "public/brand";
const C = {
  light: { primary: "#0E8C8C", text: "#13202E", bg: "#F7F5F0", accent: "#E8A317", accentSoft: "#FCEFD2", muted: "#5B6676", border: "#E2DDD2" },
  dark: { primary: "#2FC2BE", text: "#EAF0F6", bg: "#0D1520" },
};

/** First TTF URL in a Google Fonts CSS response (no browser user agent → TTF). */
async function googleTtf(query: string): Promise<ArrayBuffer> {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
  const url = /url\((https:[^)]+\.ttf)\)/.exec(css)?.[1];
  if (!url) throw new Error(`No TTF for ${query}`);
  return (await fetch(url)).arrayBuffer();
}

function wordmarkSvg(font: opentype.Font, colors: { primary: string; text: string }) {
  const size = 64;
  const tracking = -0.02 * size;
  // Lay the glyphs out by hand so the -0.02em tracking matches the site's headings.
  let x = 0;
  const parts: string[] = [];
  for (const g of font.stringToGlyphs("Satify")) {
    parts.push(g.getPath(x, 0, size).toPathData(2));
    x += ((g.advanceWidth ?? 0) / font.unitsPerEm) * size + tracking;
  }
  const textWidth = x - tracking;
  const ascent = ((font.tables.os2?.sCapHeight ?? font.ascender * 0.7) / font.unitsPerEm) * size;
  const descent = (-font.descender / font.unitsPerEm) * size * 0.5;
  const star = ascent * 1.15;
  const gap = size * 0.22;
  const pad = 4;
  const w = Math.ceil(pad * 2 + star + gap + textWidth);
  const h = Math.ceil(pad * 2 + Math.max(star, ascent + descent));
  const baseline = pad + (h - pad * 2 + ascent - descent) / 2;
  const starY = pad + (h - pad * 2 - star) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Satify">
  <path fill="${colors.primary}" fill-rule="evenodd" transform="translate(${pad} ${starY.toFixed(2)}) scale(${(star / 32).toFixed(4)})" d="${brandStarPath()}"/>
  <path fill="${colors.text}" transform="translate(${(pad + star + gap).toFixed(2)} ${baseline.toFixed(2)})" d="${parts.join("")}"/>
</svg>
`;
}

const markSvg = (fill: string, darkFill?: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  ${darkFill ? `<style>path{fill:${fill}}@media (prefers-color-scheme:dark){path{fill:${darkFill}}}</style>` : ""}
  <path fill="${fill}" fill-rule="evenodd" d="${brandStarPath()}"/>
</svg>
`;

/** Faint 8-point star tiles, as on the site's hero. */
function tilePattern(ctx: SKRSContext2D, w: number, h: number, color: string, alpha: number) {
  const star = new Path2D(brandStarPath());
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let y = -24; y < h + 48; y += 72) {
    for (let x = -24 + ((y / 72) % 2 ? 36 : 0); x < w + 48; x += 72) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.9, 0.9);
      ctx.fill(star, "evenodd");
      ctx.restore();
    }
  }
  ctx.restore();
}

async function main() {
  const [literata, literataItalic, onest, onestBold] = await Promise.all([
    googleTtf("family=Literata:opsz,wght@72,600"),
    googleTtf("family=Literata:ital,opsz,wght@1,72,600"),
    googleTtf("family=Onest:wght@400"),
    googleTtf("family=Onest:wght@700"),
  ]);
  const font = opentype.parse(literata);

  writeFileSync(`${OUT}/mark.svg`, markSvg(C.light.primary, C.dark.primary));
  writeFileSync(`${OUT}/mark-dark.svg`, markSvg(C.dark.primary));
  writeFileSync(`${OUT}/logo.svg`, wordmarkSvg(font, C.light));
  writeFileSync(`${OUT}/logo-dark.svg`, wordmarkSvg(font, C.dark));

  // Email header: PNG wordmark at 2× (many mail apps don't show SVG).
  const emailLogo = await loadImage(Buffer.from(wordmarkSvg(font, C.light)));
  const eh = 64;
  const el = createCanvas(Math.round((emailLogo.width / emailLogo.height) * eh), eh);
  el.getContext("2d").drawImage(emailLogo, 0, 0, el.width, eh);
  writeFileSync(`${OUT}/logo-email.png`, el.toBuffer("image/png"));

  // App icons: the star on warm paper (maskable keeps it inside the safe zone).
  const mark = await loadImage(Buffer.from(markSvg(C.light.primary)));
  for (const [size, name, inset] of [
    [32, "favicon-32.png", 0.06],
    [180, "apple-touch-icon.png", 0.18],
    [192, "icon-192.png", 0.16],
    [512, "icon-512.png", 0.16],
    [512, "icon-maskable-512.png", 0.26],
  ] as const) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    if (name !== "favicon-32.png") {
      ctx.fillStyle = C.light.bg;
      ctx.fillRect(0, 0, size, size);
    }
    const i = size * inset;
    ctx.drawImage(mark, i, i, size - 2 * i, size - 2 * i);
    writeFileSync(`${OUT}/${name}`, c.toBuffer("image/png"));
  }

  // OpenGraph image.
  GlobalFonts.register(Buffer.from(literata), "Literata");
  GlobalFonts.register(Buffer.from(literataItalic), "Literata Italic");
  GlobalFonts.register(Buffer.from(onest), "Onest");
  GlobalFonts.register(Buffer.from(onestBold), "Onest Bold");
  const W = 1200;
  const H = 630;
  const og = createCanvas(W, H);
  const ctx = og.getContext("2d");
  ctx.fillStyle = C.light.bg;
  ctx.fillRect(0, 0, W, H);
  tilePattern(ctx, W, H, C.light.primary, 0.06);
  const logo = await loadImage(Buffer.from(wordmarkSvg(font, C.light)));
  const logoH = 72;
  ctx.drawImage(logo, 88, 92, (logo.width / logo.height) * logoH, logoH);

  // "Your SAT score, *planned* and **proven**."
  ctx.textBaseline = "alphabetic";
  const y1 = 330;
  const y2 = 420;
  const draw = (text: string, x: number, y: number, font: string, color: string) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    return x + ctx.measureText(text).width;
  };
  draw("Your SAT score,", 88, y1, "600 76px Literata", C.light.text);
  ctx.font = "600 76px 'Literata Italic'";
  const plannedW = ctx.measureText("planned").width;
  // Saffron highlighter bar behind the emphasized word.
  ctx.fillStyle = C.light.accentSoft;
  ctx.beginPath();
  ctx.moveTo(84, y2 + 14);
  ctx.lineTo(88 + plannedW + 8, y2 + 6);
  ctx.lineTo(88 + plannedW + 8, y2 - 22);
  ctx.lineTo(84, y2 - 14);
  ctx.fill();
  let x = draw("planned", 88, y2, "600 76px 'Literata Italic'", C.light.primary);
  x = draw(" and ", x, y2, "600 76px Literata", C.light.text);
  draw("proven.", x, y2, "800 76px Literata", C.light.text);
  draw("Adaptive SAT practice, real progress tracking and clear explanations.", 88, 500, "32px Onest", C.light.muted);
  ctx.fillStyle = C.light.border;
  ctx.fillRect(88, 548, W - 176, 2);
  draw("SAT® is a trademark of the College Board, which does not endorse this site.", 88, 586, "22px Onest", C.light.muted);
  writeFileSync(`${OUT}/og.png`, og.toBuffer("image/png"));

  console.log(`Brand assets written to ${OUT}/`);
}

void main();
