/** Render PNG app icons from public/brand/mark.svg (run after replacing the logo: pnpm tsx scripts/make-icons.ts). */
import { readFileSync, writeFileSync } from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";

async function main() {
  const svg = readFileSync("public/brand/mark.svg");
  const img = await loadImage(svg);
  for (const [size, name, pad] of [
    [192, "icon-192.png", 0],
    [512, "icon-512.png", 0],
    [512, "icon-maskable-512.png", 0.1],
    [180, "apple-touch-icon.png", 0],
  ] as const) {
    const c = createCanvas(size, size);
    const ctx = c.getContext("2d");
    if (pad) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
    }
    const inset = size * pad;
    ctx.drawImage(img, inset, inset, size - 2 * inset, size - 2 * inset);
    writeFileSync(`public/brand/${name}`, c.toBuffer("image/png"));
  }
  console.log("Icons written to public/brand/");
}
void main();
