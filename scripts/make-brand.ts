/**
 * Generate the WilloPrep brand files in public/brand/ from the antler W
 * (src/components/brand/antler-w.tsx):
 *
 *   mark.svg                   app tile, follows the system theme (SVG favicon)
 *   mark-small.svg / -dark     simple mark tile for 16–48px, light and dark
 *   logo.svg / logo-dark.svg   tile + wordmark (text drawn by the browser fonts in-app; files are for embeds)
 *   favicon.ico, favicon-16/32/48.png, apple-touch-icon.png, icon-192/512.png (the deer icon when
 *   deer-icon-1024.png exists),
 *   icon-maskable-512.png, mark-1024.png, logo-email.png, og.png (1200×630)
 *
 *   pnpm brand
 *
 * PNGs are rendered with the pre-installed Chromium (Playwright), so the
 * wordmark uses the real Plus Jakarta Sans from Google Fonts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { ANTLER, WORD_COLORS, antlerPaths, leafDotStyle, leafSvg } from "../src/lib/brand/antler";

const OUT = "public/brand";
const C = { cyanA: "#0A6E87", cyanB: "#1FB3CB", navy: "#102D40", ink: "#0B1D28", cyan: "#087F9B", cyanDark: "#20B9D0", ice: "#E4F7FA", cloud: "#F5F9FC" };

const tile = (size: number, variant: "full" | "simple", opts: { radius?: number; pad?: number; id?: string } = {}) => {
  const r = opts.radius ?? 0.28;
  const id = opts.id ?? "g";
  const pad = opts.pad ?? 0.13;
  const s = 64 * (1 - 2 * pad);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.cyanA}"/><stop offset="1" stop-color="${C.cyanB}"/></linearGradient></defs>
<rect width="64" height="64" rx="${64 * r}" fill="url(#${id})"/>
<g transform="translate(${64 * pad} ${64 * pad}) scale(${s / 64})" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths("#fff", variant)}</g>
</svg>`;
};

const plain = (variant: "full" | "simple", fg: string, bg: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
<rect width="64" height="64" rx="16" fill="${bg}"/><g transform="translate(6 6) scale(0.8125)" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths(fg, variant)}</g></svg>`;

const wordmarkSvg = (dark: boolean) => {
  const c = dark ? WORD_COLORS.dark : WORD_COLORS.light;
  const cx = 49 + 0.119 * 40;
  const cy = 40 - 0.672 * 40;
  const w = 0.26 * 40;
  const h = 0.1092 * 40;
  const leaf = `<g transform="rotate(-45 ${cx} ${cy})">${leafSvg(dark ? "ld" : "ll").replace("<svg ", `<svg x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" `)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="236" height="48" viewBox="0 0 236 48">
<g transform="translate(0 4) scale(0.8)" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths(c.antler, "full", ANTLER.glyph)}</g>
<text x="49" y="40" font-family="'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" font-weight="800" font-size="40" letter-spacing="-1.4" fill="${c.ink}">ıllo<tspan fill="${c.prep}">Prep</tspan></text>${leaf}</svg>`;
};

/** ICO container holding PNG images. */
function ico(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((p, i) => {
    const o = i * 16;
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, o);
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, o + 1);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(p.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += p.data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

async function main() {
  // SVG files
  const auto = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64">
<style>.b{fill:${C.cyan}}@media (prefers-color-scheme:dark){.b{fill:${C.cyanDark}}}</style>
<rect class="b" width="64" height="64" rx="16"/><g transform="translate(6 6) scale(0.8125)" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths("#fff", "simple")}</g></svg>`;
  writeFileSync(`${OUT}/mark.svg`, auto);
  writeFileSync(`${OUT}/mark-small.svg`, plain("simple", "#fff", C.cyan));
  writeFileSync(`${OUT}/mark-small-dark.svg`, plain("simple", C.ink, C.cyanDark));
  writeFileSync(`${OUT}/mark-gloss.svg`, tile(64, "full"));
  writeFileSync(`${OUT}/mark-gloss-dark.svg`, tile(64, "full"));
  writeFileSync(`${OUT}/logo.svg`, wordmarkSvg(false));
  writeFileSync(`${OUT}/logo-dark.svg`, wordmarkSvg(true));
  writeFileSync(`${OUT}/logo-flat.svg`, wordmarkSvg(false));
  writeFileSync(`${OUT}/logo-flat-dark.svg`, wordmarkSvg(true));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const shot = async (html: string, w: number, h: number) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(
      `<html><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800&display=block" rel="stylesheet"><style>html,body{margin:0;background:transparent}</style></head><body>${html}</body></html>`,
      { waitUntil: "networkidle" },
    );
    await page.evaluate(() => document.fonts.ready);
    return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  };

  const png = async (name: string, size: number, variant: "full" | "simple", opts?: Parameters<typeof tile>[2]) => {
    const data = await shot(tile(size, variant, opts), size, size);
    writeFileSync(`${OUT}/${name}`, data);
    return data;
  };
  const f16 = await png("favicon-16.png", 16, "simple", { radius: 0.22, pad: 0.08 });
  const f32 = await png("favicon-32.png", 32, "simple", { radius: 0.22, pad: 0.08 });
  const f48 = await png("favicon-48.png", 48, "simple", { radius: 0.24, pad: 0.1 });
  writeFileSync("public/favicon.ico", ico([16, 32, 48].map((size, i) => ({ size, data: [f16, f32, f48][i]! }))));
  // Large app icons use the deer illustration (public/brand/deer-icon-1024.png) when it exists.
  const deer = `${OUT}/deer-icon-1024.png`;
  if (existsSync(deer)) {
    const src = `data:image/png;base64,${readFileSync(deer).toString("base64")}`;
    for (const [name, size] of [["apple-touch-icon.png", 180], ["icon-192.png", 192], ["icon-512.png", 512]] as const)
      writeFileSync(`${OUT}/${name}`, await shot(`<img src="${src}" width="${size}" height="${size}" style="display:block">`, size, size));
  } else {
    await png("apple-touch-icon.png", 180, "full", { radius: 0, pad: 0.16 });
    await png("icon-192.png", 192, "full");
    await png("icon-512.png", 512, "full");
  }
  await png("icon-maskable-512.png", 512, "full", { radius: 0, pad: 0.24 });
  await png("mark-1024.png", 1024, "full");

  let leafN = 0;
  const word = (dark: boolean, px: number) => {
    const c = dark ? WORD_COLORS.dark : WORD_COLORS.light;
    const leaf = leafSvg(`w${leafN++}`, leafDotStyle);
    return `<span style="display:inline-flex;align-items:flex-end;font:800 ${px}px/1 'Plus Jakarta Sans';letter-spacing:-0.035em;color:${c.ink}">
<svg viewBox="2 6 60 50" style="height:0.98em;width:auto;margin-right:0.05em" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths(c.antler, "full", ANTLER.glyph)}</svg><span style="position:relative;display:inline-block">ı${leaf}</span><span>llo</span><span style="color:${c.prep}">Prep</span></span>`;
  };

  writeFileSync(`${OUT}/logo-email.png`, await shot(`<div style="padding:10px 4px 4px">${word(false, 50)}</div>`, 300, 70));

  const og = `<div style="width:1200px;height:630px;box-sizing:border-box;padding:84px 96px;display:flex;flex-direction:column;justify-content:space-between;
background:radial-gradient(900px 500px at 85% 15%, rgba(32,185,208,.28), transparent 60%), linear-gradient(160deg, ${C.navy} 0%, ${C.ink} 100%);color:${C.ice};font-family:'Plus Jakarta Sans'">
${word(true, 64)}
<div><div style="font-weight:800;font-size:76px;line-height:1.04;letter-spacing:-0.035em;max-width:900px">Your SAT, planned<br><span style="color:${C.cyanDark}">and proven.</span></div>
<div style="margin-top:28px;font-weight:500;font-size:30px;color:rgba(228,247,250,.75)">Adaptive practice, real test timing and a plan that fits your week.</div></div>
<svg viewBox="0 0 64 64" style="position:absolute;right:-60px;bottom:-90px;width:520px;opacity:.07" fill="none" stroke-linecap="round" stroke-linejoin="round">${antlerPaths("#fff", "full")}</svg></div>`;
  writeFileSync(`${OUT}/og.png`, await shot(`<div style="position:relative;overflow:hidden;width:1200px;height:630px">${og}</div>`, 1200, 630));
  await browser.close();
  console.log("brand files written to", OUT, readFileSync(`${OUT}/mark.svg`, "utf8").length, "bytes mark.svg");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
