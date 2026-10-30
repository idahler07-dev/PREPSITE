"use client";

import "katex/dist/katex.min.css"; // math styles only where math is shown
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type HighlightColor = "yellow" | "blue" | "pink";
export interface Highlight {
  start: number;
  end: number;
  color: HighlightColor;
}

/** Text nodes in document order; offsets count every character of each node. */
function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

function offsetOf(root: HTMLElement, container: Node, offset: number): number {
  const r = document.createRange();
  r.selectNodeContents(root);
  r.setEnd(container, offset);
  return r.toString().length;
}

/** Wrap highlighted ranges in <mark>; math (KaTeX) is counted but never wrapped. */
function paint(root: HTMLElement, highlights: Highlight[]) {
  let pos = 0;
  for (const node of textNodes(root)) {
    const len = node.data.length;
    const from = pos;
    pos += len;
    if (node.parentElement?.closest(".katex")) continue;
    const parts = highlights
      .map((h, i) => ({ s: Math.max(h.start, from) - from, e: Math.min(h.end, pos) - from, color: h.color, i }))
      .filter((p) => p.e > p.s)
      .sort((a, b) => a.s - b.s);
    if (!parts.length) continue;
    const frag = document.createDocumentFragment();
    let cur = 0;
    for (const p of parts) {
      if (p.s < cur) continue;
      if (p.s > cur) frag.append(node.data.slice(cur, p.s));
      const mark = document.createElement("mark");
      mark.className = `hl hl-${p.color}`;
      mark.dataset.i = String(p.i);
      mark.textContent = node.data.slice(p.s, p.e);
      frag.append(mark);
      cur = p.e;
    }
    if (cur < len) frag.append(node.data.slice(cur));
    node.replaceWith(frag);
  }
}

/** Add a highlight, trimming any it overlaps (the new color wins). */
export function addHighlight(list: Highlight[], h: Highlight): Highlight[] {
  const out: Highlight[] = [];
  for (const x of list) {
    if (x.end <= h.start || x.start >= h.end) out.push(x);
    else {
      if (x.start < h.start) out.push({ ...x, end: h.start });
      if (x.end > h.end) out.push({ ...x, start: h.end });
    }
  }
  out.push(h);
  return out.sort((a, b) => a.start - b.start);
}

/**
 * Passage text that can be highlighted: select text while the highlighter is
 * on to mark it; click a mark to remove it.
 */
export function HighlightablePassage({
  html,
  highlights,
  enabled,
  color,
  onChange,
  className,
}: {
  html: string;
  highlights: Highlight[];
  enabled: boolean;
  color: HighlightColor;
  onChange: (next: Highlight[]) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // html comes from renderMarkdown (sanitized); see RichText.
    el.innerHTML = html;
    paint(el, highlights);
  }, [html, highlights]);

  function onPointerUp(e: React.PointerEvent) {
    const el = ref.current;
    if (!enabled || !el) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;
      const start = offsetOf(el, range.startContainer, range.startOffset);
      const end = offsetOf(el, range.endContainer, range.endOffset);
      sel.removeAllRanges();
      if (end > start) onChange(addHighlight(highlights, { start, end, color }));
      return;
    }
    const mark = (e.target as HTMLElement).closest("mark.hl") as HTMLElement | null;
    if (mark?.dataset.i) onChange(highlights.filter((_, i) => i !== Number(mark.dataset.i)));
  }

  return <div ref={ref} onPointerUp={onPointerUp} className={cn("question-content", enabled && "cursor-text selection:bg-primary/25", className)} />;
}
