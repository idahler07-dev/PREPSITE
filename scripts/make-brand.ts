/**
 * Generate the Satify brand assets in public/brand/ from src/lib/brand-mark.ts:
 *   mark.svg                    flat mark, follows the system theme (also the SVG favicon)
 *   mark-small.svg / -dark      flat mark for 16–48px, light and dark
 *   mark-gloss.svg / -dark      glossy 3D mark for 64px and up, light and dark
 *   logo.svg / logo-dark.svg    gloss mark + "Satify" (Geist Bold, -0.035em, mark = cap height × 1.3, gap 0.35em; text as paths)
 *   logo-flat.svg / -dark       the same with the flat mark (small sizes)
 *   logo-email.png              flat logo for email headers (mail apps don't show SVG)
 *   favicon.ico (16/32/48), favicon-16/32/48.png, apple-touch-icon.png (180), icon-192/512.png,
 *   icon-maskable-512.png, mark-1024.png
 *   og.png                      1200×630 OpenGraph image
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
import { CHOSEN_CONCEPT, FLAT_COLORS, GEIST_CAP_HEIGHT, WORDMARK, flatMarkInner, glossMarkInner, svgDoc } from "../src/lib/brand-mark";
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

const K = CHOSEN_CONCEPT;
const flat = (theme: "light" | "dark") => flatMarkInner(K, FLAT_COLORS[theme]);
const gloss = (theme: "light" | "dark", opts?: Parameters<typeof glossMarkInner>[3]) => glossMarkInner(K, theme, `m${theme}`, opts);

/** Flat mark that follows the system theme (for the SVG favicon). */
function autoMarkSvg() {
  const inner = flatMarkInner(K, { bgClass: "b", fgClass: "f", strokeClass: "s" });
  const { light, dark } = FLAT_COLORS;
  const style = `.b{fill:${light.bg}}.f{fill:${light.fg}}.s{stroke:${light.fg}}@media (prefers-color-scheme:dark){.b{fill:${dark.bg}}.f{fill:${dark.fg}}.s{stroke:${dark.fg}}}`;
  return svgDoc(`<style>${style}</style>${inner}`, 32);
}

/** Full logo: mark + "Satify" in Geist Bold, sized from the cap height. */
function wordmarkSvg(font: opentype.Font, text: string, markInner: string) {
  const size = 64;
  const tracking = WORDMARK.tracking * size;
  const upm = font.unitsPerEm;
  let x = 0;
  const parts: string[] = [];
  for (const g of font.stringToGlyphs("Satify")) {
    parts.push(g.getPath(x, 0, size).toPathData(2));
    x += ((g.advanceWidth ?? 0) / upm) * size + tracking;
  }
  const textW = x - tracking;
  const cap = GEIST_CAP_HEIGHT * size;
  const mark = cap * WORDMARK.markScale;
  const gap = WORDMARK.gap * size;
  const descent = ((-font.descender * 0.9) / upm) * size;
  const pad = 2;
  // Mark centered on the cap height; the baseline sits below it.
  const top = pad;
  const baseline = top + (mark + cap) / 2;
  const h = Math.ceil(Math.max(top + mark, baseline + descent * 0.3) + pad);
  const w = Math.ceil(mark + gap + textW + pad);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Satify">
  <g transform="translate(0 ${top}) scale(${(mark / 64).toFixed(4)})">${markInner}</g>
  <path fill="${text}" transform="translate(${(mark + gap).toFixed(2)} ${baseline.toFixed(2)})" d="${parts.join("")}"/>
</svg>
`;
}

/** ICO file holding PNG images (supported by every current browser). */
function ico(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((p, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(p.size >= 256 ? 0 : p.size, e);
    header.writeUInt8(p.size >= 256 ? 0 : p.size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(p.data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += p.data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

async function png(svgInner: string, size: number) {
  const img = await loadImage(Buffer.from(svgDoc(svgInner, size)));
  const c = createCanvas(size, size);
  c.getContext("2d").drawImage(img, 0, 0, size, size);
  return c.toBuffer("image/png");
}

/** Pip as a standalone SVG (CSS variables resolved to the light theme colors). */
function mascotSvg(pose: "wave" | "cheer" | "juggle") {
  const vars: Record<string, string> = {
    "--mascot-body": "#A897FF",
    "--mascot-light": "#D3C9FF",
    "--mascot-dark": "#7A66F2",
    "--mascot-cap": "#2747F5",
    "--mascot-cap-light": "#5C76FF",
    "--mascot-cap-dark": "#1C32C4",
    "--mascot-accent": "#FF6B4A",
    "--mascot-eye": "#FFFFFF",
    "--mascot-ink": "#0E1222",
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

  writeFileSync(`${OUT}/mark.svg`, autoMarkSvg());
  writeFileSync(`${OUT}/mark-small.svg`, svgDoc(flat("light"), 32));
  writeFileSync(`${OUT}/mark-small-dark.svg`, svgDoc(flat("dark"), 32));
  writeFileSync(`${OUT}/mark-gloss.svg`, svgDoc(gloss("light"), 256));
  writeFileSync(`${OUT}/mark-gloss-dark.svg`, svgDoc(gloss("dark"), 256));
  const logo = wordmarkSvg(font, C.light.text, gloss("light"));
  writeFileSync(`${OUT}/logo.svg`, logo);
  writeFileSync(`${OUT}/logo-dark.svg`, wordmarkSvg(font, C.dark.text, gloss("dark")));
  const logoFlat = wordmarkSvg(font, C.light.text, flat("light"));
  writeFileSync(`${OUT}/logo-flat.svg`, logoFlat);
  writeFileSync(`${OUT}/logo-flat-dark.svg`, wordmarkSvg(font, C.dark.text, flat("dark")));

  const emailLogo = await loadImage(Buffer.from(logoFlat));
  const eh = 64;
  const el = createCanvas(Math.round((emailLogo.width / emailLogo.height) * eh), eh);
  el.getContext("2d").drawImage(emailLogo, 0, 0, el.width, eh);
  writeFileSync(`${OUT}/logo-email.png`, el.toBuffer("image/png"));

  // Favicons use the flat mark; larger icons the gloss one (full-bleed where the OS masks the corners).
  const fav = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(flat("light"), size) })));
  for (const f of fav) writeFileSync(`${OUT}/favicon-${f.size}.png`, f.data);
  writeFileSync("public/favicon.ico", ico(fav));
  writeFileSync(`${OUT}/apple-touch-icon.png`, await png(gloss("light", { fullBleed: true }), 180));
  writeFileSync(`${OUT}/icon-192.png`, await png(gloss("light"), 192));
  writeFileSync(`${OUT}/icon-512.png`, await png(gloss("light"), 512));
  writeFileSync(`${OUT}/icon-maskable-512.png`, await png(gloss("light", { fullBleed: true, symbolScale: 0.82 }), 512));
  writeFileSync(`${OUT}/mark-1024.png`, await png(gloss("light"), 1024));

  const wordmark = await loadImage(Buffer.from(logo));
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
  ctx.drawImage(wordmark, 88, 80, (wordmark.width / wordmark.height) * 64, 64);
  const mascot = await loadImage(Buffer.from(mascotSvg("wave")));
  ctx.drawImage(mascot, 780, 150, 340, 340);

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
