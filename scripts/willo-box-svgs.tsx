/**
 * Still SVG files of the compact Willo, one per mood, for places that need an
 * image file (the score share card, social images). From the repo root:
 *   npx tsx scripts/willo-box-svgs.tsx
 */
import React from "react";
import fs from "fs";
import { renderToStaticMarkup } from "react-dom/server";
import {
  WilloBox,
  type WilloBoxMood,
} from "../src/components/mascot/willo-box";

(globalThis as { React?: typeof React }).React = React;
const moods: WilloBoxMood[] = [
  "idle",
  "happy",
  "wink",
  "sad",
  "think",
  "sleep",
  "wow",
];
for (const m of moods) {
  const html = renderToStaticMarkup(<WilloBox mood={m} />);
  const svg = html
    .slice(html.indexOf("<svg"), html.lastIndexOf("</svg>") + 6)
    .replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="420"',
    )
    .replace(/ class="[^"]*"/g, "")
    .replace(/ style="[^"]*"/g, "");
  fs.writeFileSync(`public/mascot/willo-${m}.svg`, svg);
  console.log(`public/mascot/willo-${m}.svg`);
}
