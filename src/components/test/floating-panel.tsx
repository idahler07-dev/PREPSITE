"use client";

import { useEffect, useRef, useState } from "react";
import { GripHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A panel that floats over the test: drag it by its title bar, resize it from
 * the corner. Position and size are remembered per panel on this device.
 */
export function FloatingPanel({
  id,
  title,
  closeLabel,
  onClose,
  initial,
  children,
}: {
  id: string;
  title: string;
  closeLabel: string;
  onClose: () => void;
  initial: { width: number; height: number };
  children: React.ReactNode;
}) {
  const storeKey = `panel:${id}`;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 16, y: 72 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) ?? "null") as { x: number; y: number; w: number; h: number } | null;
      if (saved && ref.current) {
        setPos(clamp(saved.x, saved.y));
        ref.current.style.width = `${saved.w}px`;
        ref.current.style.height = `${saved.h}px`;
      } else if (window.innerWidth < 640 && ref.current) {
        // Phones: full width under the top bar.
        setPos({ x: 0, y: 56 });
        ref.current.style.width = "100vw";
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clamp(x: number, y: number) {
    const w = ref.current?.offsetWidth ?? 300;
    return { x: Math.max(0, Math.min(window.innerWidth - Math.min(w, 120), x)), y: Math.max(0, Math.min(window.innerHeight - 48, y)) };
  }

  function save(p = pos) {
    try {
      localStorage.setItem(storeKey, JSON.stringify({ ...p, w: ref.current?.offsetWidth, h: ref.current?.offsetHeight }));
    } catch {}
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="fixed z-40 flex resize flex-col overflow-hidden rounded-lg border bg-background shadow-xl"
      style={{ left: pos.x, top: pos.y, width: initial.width, height: initial.height, minWidth: 260, minHeight: 240, maxWidth: "100vw", maxHeight: "calc(100dvh - 56px)" }}
      onPointerUp={() => save()}
    >
      <div
        className="flex h-10 shrink-0 cursor-move touch-none items-center gap-2 border-b bg-muted px-2 select-none"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
        }}
        onPointerUp={() => {
          drag.current = null;
          save();
        }}
      >
        <GripHorizontal className="size-4 text-muted-foreground" aria-hidden />
        <span className="flex-1 truncate text-sm font-medium">{title}</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose} aria-label={closeLabel}>
          <X aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
