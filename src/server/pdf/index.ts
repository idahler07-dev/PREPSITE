import "server-only";
import path from "node:path";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import { itemsToLines, type PdfTextItem, type TextLine } from "@/lib/import/pdf-text";

/**
 * pdf.js in Node: text extraction and page rendering (via @napi-rs/canvas).
 * JavaScript inside PDFs is never executed (isEvalSupported: false and no
 * scripting); fonts, character maps and image decoders come from local files.
 */

const PDFJS_DIR = path.join(process.cwd(), "node_modules", "pdfjs-dist");

export const MAX_PAGES_PER_FILE = 400;

async function pdfjs() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

export async function loadPdf(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  const { getDocument } = await pdfjs();
  // pdf.js may transfer (detach) the buffer it is given, so pass a copy.
  const task = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    enableXfa: false,
    useSystemFonts: false,
    disableFontFace: true,
    standardFontDataUrl: `${PDFJS_DIR}/standard_fonts/`,
    cMapUrl: `${PDFJS_DIR}/cmaps/`,
    cMapPacked: true,
    wasmUrl: `${PDFJS_DIR}/wasm/`,
    verbosity: 0,
  } as Parameters<typeof getDocument>[0]);
  return task.promise;
}

/** Quick check of the file header before handing bytes to pdf.js. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  const head = String.fromCharCode(...bytes.slice(0, 1024));
  return head.includes("%PDF-");
}

export async function pageTextLines(page: PDFPageProxy): Promise<TextLine[]> {
  const content = await page.getTextContent();
  const items = content.items.filter((i): i is PdfTextItem & typeof i => "str" in i) as unknown as PdfTextItem[];
  return itemsToLines(items);
}

export interface RenderedPage {
  png: Uint8Array;
  width: number;
  height: number;
  canvas: import("@napi-rs/canvas").Canvas;
}

/** Render a page to PNG with its longer side `longSide` pixels (white background). */
export async function renderPage(page: PDFPageProxy, longSide: number): Promise<RenderedPage> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const base = page.getViewport({ scale: 1 });
  const scale = longSide / Math.max(base.width, base.height);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas: canvas as unknown as HTMLCanvasElement, viewport }).promise;
  return { png: new Uint8Array(canvas.toBuffer("image/png")), width: canvas.width, height: canvas.height, canvas };
}

/** Crop a region given as fractions of the page ([left, top, right, bottom]). */
export async function cropPng(rendered: RenderedPage, box: [number, number, number, number]): Promise<{ png: Uint8Array; width: number; height: number }> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const [x0, y0, x1, y1] = box;
  const sx = Math.floor(x0 * rendered.width);
  const sy = Math.floor(y0 * rendered.height);
  const w = Math.max(1, Math.ceil((x1 - x0) * rendered.width));
  const h = Math.max(1, Math.ceil((y1 - y0) * rendered.height));
  const out = createCanvas(w, h);
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(rendered.canvas, sx, sy, w, h, 0, 0, w, h);
  return { png: new Uint8Array(out.toBuffer("image/png")), width: w, height: h };
}

/** Recently opened documents, so page jobs for the same file don't reload it every time. */
const cache = new Map<string, { doc: Promise<PDFDocumentProxy>; used: number }>();
const CACHE_SIZE = 3;

export function cachedPdf(key: string, load: () => Promise<Uint8Array>): Promise<PDFDocumentProxy> {
  const hit = cache.get(key);
  if (hit) {
    hit.used = Date.now();
    return hit.doc;
  }
  const doc = load().then(loadPdf);
  doc.catch(() => cache.delete(key));
  cache.set(key, { doc, used: Date.now() });
  if (cache.size > CACHE_SIZE) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].used - b[1].used)[0]!;
    cache.delete(oldest[0]);
    void oldest[1].doc.then((d) => d.loadingTask.destroy()).catch(() => undefined);
  }
  return doc;
}
