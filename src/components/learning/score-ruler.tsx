"use client";

import { useEffect, useRef } from "react";
import { animate, m, useDragControls, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { Odometer } from "@/components/motion/odometer";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STEP_PX = 14; // distance between two ticks (10 points)
const SCORE_STEP = 10;

/**
 * A tape-measure picker for one SAT section score (200-800): drag the tape
 * under the needle (it coasts and snaps to the nearest 10), use the - / +
 * buttons, or the arrow keys. The number above rolls like an odometer as the
 * tape moves. The whole control is one slider for assistive technology.
 */
export function ScoreRuler({
  label,
  value,
  onChange,
  min = 200,
  max = 800,
  tone = "primary",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  tone?: "primary" | "highlight";
}) {
  const reduce = useReducedMotion();
  const count = (max - min) / SCORE_STEP; // number of gaps
  const clamp = (n: number) => Math.min(count, Math.max(0, n));
  const idxOf = (v: number) => clamp(Math.round((v - min) / SCORE_STEP));
  const x = useMotionValue(-idxOf(value) * STEP_PX);
  const controls = useDragControls();
  const lastIdx = useRef(idxOf(value));
  const dragging = useRef(false);
  const gliding = useRef(false); // the tape is moving because the value changed, not because it was dragged
  const pending = useRef<number | null>(null); // the value rapid key presses are heading to

  // The tape's position is the source of truth while dragging; report whole steps.
  useMotionValueEvent(x, "change", (latest) => {
    if (gliding.current) return;
    const idx = clamp(Math.round(-latest / STEP_PX));
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    try {
      if (window.matchMedia("(pointer: coarse)").matches) navigator.vibrate?.(4);
    } catch {}
    onChange(min + idx * SCORE_STEP);
  });

  // Moves from outside (buttons, keys) glide the tape to the new value.
  useEffect(() => {
    if (pending.current === value) pending.current = null;
    if (dragging.current) return;
    lastIdx.current = idxOf(value);
    const target = -idxOf(value) * STEP_PX;
    if (Math.abs(x.get() - target) < 0.5) return;
    gliding.current = true;
    const controlsAnim = animate(x, target, { ...(reduce ? { duration: 0 } : spring.snappy), onComplete: () => (gliding.current = false) });
    return () => {
      controlsAnim.stop();
      gliding.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const set = (next: number) => {
    const v = Math.min(max, Math.max(min, next));
    pending.current = v;
    onChange(v);
  };
  const nudge = (delta: number) => set((pending.current ?? value) + delta);
  const color = tone === "primary" ? "var(--primary)" : "var(--highlight)";
  const ticks = Array.from({ length: count + 1 }, (_, i) => {
    const score = min + i * SCORE_STEP;
    return { i, score, major: score % 100 === 0, mid: score % 50 === 0 };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3 px-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[2.5rem] leading-none font-bold tracking-tight" style={{ color }}>
          <Odometer value={value} className="font-mono" />
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudge(-SCORE_STEP)}
          disabled={value <= min}
          aria-label={`${label}: -${SCORE_STEP}`}
          className="glass-card flex size-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-40"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={String(value)}
          onKeyDown={(e) => {
            const big = e.shiftKey ? 5 : 1;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") nudge(SCORE_STEP * big);
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") nudge(-SCORE_STEP * big);
            else if (e.key === "PageUp") nudge(50);
            else if (e.key === "PageDown") nudge(-50);
            else if (e.key === "Home") set(min);
            else if (e.key === "End") set(max);
            else return;
            e.preventDefault();
          }}
          className="glass-card relative h-[76px] min-w-0 flex-1 cursor-grab touch-pan-y overflow-hidden rounded-2xl outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/45 active:cursor-grabbing"
        >
          {/* Tape: ticks hang from the top, numbers every 100. */}
          <m.div
            drag="x"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ left: -count * STEP_PX, right: 0 }}
            dragElastic={0.1}
            dragTransition={reduce ? { power: 0 } : { power: 0.28, timeConstant: 180, modifyTarget: (t: number) => Math.round(t / STEP_PX) * STEP_PX }}
            onDragStart={() => (dragging.current = true)}
            onDragEnd={() => {
              dragging.current = false;
              // Glide to the exact tick if the coast ended between two.
              window.setTimeout(() => {
                if (!dragging.current) animate(x, -lastIdx.current * STEP_PX, reduce ? { duration: 0 } : spring.snappy);
              }, 0);
            }}
            style={{ x, left: "50%" }}
            className="absolute inset-y-0 w-0"
            aria-hidden
          >
            {ticks.map((t) => (
              <span key={t.i} className="absolute top-0 -translate-x-1/2" style={{ left: t.i * STEP_PX }}>
                <span className={cn("block w-px rounded-full bg-foreground/30", t.major ? "h-7 w-[1.5px] bg-foreground/70" : t.mid ? "h-5 bg-foreground/50" : "h-3")} />
                {t.major && <span className="absolute top-8 left-1/2 -translate-x-1/2 font-mono text-[11px] text-muted-foreground tabular-nums">{t.score}</span>}
              </span>
            ))}
          </m.div>
          {/* Capture drags anywhere on the control, even past the ends of the tape. */}
          <div className="absolute inset-0" onPointerDown={(e) => controls.start(e)} aria-hidden />
          {/* Needle */}
          <span className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-b-full" style={{ background: color }} aria-hidden>
            <span className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full border-2 border-surface" style={{ background: color }} />
          </span>
          {/* Edges fade out */}
          <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--glass-top)] to-transparent" aria-hidden />
          <span className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--glass-top)] to-transparent" aria-hidden />
        </div>
        <button
          type="button"
          onClick={() => nudge(SCORE_STEP)}
          disabled={value >= max}
          aria-label={`${label}: +${SCORE_STEP}`}
          className="glass-card flex size-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
