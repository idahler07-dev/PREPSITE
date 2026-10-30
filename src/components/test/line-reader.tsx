"use client";

import { useEffect, useState } from "react";

/**
 * Line reader: dims the page except a band around the pointer (or move it
 * with the ↑ / ↓ keys) to help keep your place while reading.
 */
export function LineReader({ bandRem = 4 }: { bandRem?: number }) {
  const [y, setY] = useState<number | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => setY(e.clientY);
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable=true]")) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const step = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.6;
      setY((v) => Math.max(0, Math.min(window.innerHeight, (v ?? window.innerHeight / 2) + (e.key === "ArrowUp" ? -step : step))));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    setY((v) => v ?? window.innerHeight / 2);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  if (y === null) return null;
  const half = `${bandRem / 2}rem`;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <div className="absolute inset-x-0 top-0 bg-black/45" style={{ height: `calc(${y}px - ${half})` }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/45" style={{ top: `calc(${y}px + ${half})` }} />
    </div>
  );
}
