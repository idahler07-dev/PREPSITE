"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, type TargetAndTransition, type Transition } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DEER_POSES, type DeerPose } from "./deer";

/**
 * Willo, animated. The illustrated poses are layered with motion:
 *  - breathing anchored at the feet (every pose),
 *  - blinks on open-eyed poses (cream lids with a navy lash line, matching
 *    how the art draws closed eyes),
 *  - a hop with squash and a ground shadow for cheer / jump / trophy,
 *  - a sway for idea / wink / heart, a heartbeat for heart, a glow for the idea bulb,
 *  - a small hop when the pose changes, and on hover.
 * Under reduced motion it is a still image.
 */

/** Eye boxes (x0, y0, x1, y1) in each pose's 720px image, measured from the art. */
const EYES: Partial<Record<DeerPose, [number, number, number, number][]>> = {
  stand: [
    [206, 275, 284, 366],
    [376, 246, 448, 331],
  ],
  wink: [[361, 235, 428, 318]],
  idea: [
    [202, 261, 276, 346],
    [370, 220, 436, 296],
  ],
  think: [
    [284, 287, 363, 384],
    [463, 230, 544, 328],
  ],
  read: [
    [280, 338, 359, 426],
    [459, 307, 530, 394],
  ],
  laptop: [
    [317, 320, 396, 403],
    [490, 287, 555, 369],
  ],
  sad: [
    [238, 354, 331, 451],
    [429, 308, 516, 405],
  ],
};

type Idle = "breathe" | "hop" | "sway" | "beat" | "sleep";
const IDLE: Record<DeerPose, Idle> = {
  stand: "breathe",
  wink: "sway",
  cheer: "hop",
  jump: "hop",
  trophy: "hop",
  heart: "beat",
  idea: "sway",
  think: "breathe",
  read: "breathe",
  laptop: "breathe",
  sleep: "sleep",
  sad: "breathe",
};

const LOOPS: Record<Idle, { animate: TargetAndTransition; transition: Transition }> = {
  breathe: { animate: { scaleY: [1, 1.018, 1], scaleX: [1, 0.996, 1] }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" } },
  sleep: { animate: { scaleY: [1, 1.035, 1], scaleX: [1, 1.01, 1] }, transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" } },
  sway: { animate: { rotate: [-1.6, 1.6, -1.6] }, transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" } },
  beat: { animate: { scale: [1, 1.035, 1, 1.03, 1] }, transition: { duration: 1.6, times: [0, 0.12, 0.26, 0.38, 0.6], repeat: Infinity, repeatDelay: 0.9, ease: "easeOut" } },
  hop: {
    animate: { y: [0, 0, -16, 0, 0], scaleY: [1, 0.94, 1.04, 0.96, 1], scaleX: [1, 1.04, 0.98, 1.03, 1] },
    transition: { duration: 1.1, times: [0, 0.18, 0.5, 0.78, 1], repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" },
  },
};

/** Light bulb centre in the idea pose (for the glow). */
const BULB = { cx: 560, cy: 120, r: 120 };

function useBlink(enabled: boolean) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(
        () => {
          setClosed(true);
          setTimeout(() => setClosed(false), 140);
          // Now and then, a double blink.
          if (Math.random() < 0.25) setTimeout(() => (setClosed(true), setTimeout(() => setClosed(false), 120)), 300);
          schedule();
        },
        2600 + Math.random() * 3200,
      );
    };
    schedule();
    return () => clearTimeout(t);
  }, [enabled]);
  return closed;
}

export function Willo({ pose = "stand", className, label, shadow = true }: { pose?: DeerPose; className?: string; label?: string; shadow?: boolean }) {
  const reduce = useReducedMotionSafe();
  const [w, h] = DEER_POSES[pose];
  const eyes = EYES[pose] ?? [];
  const closed = useBlink(!reduce && eyes.length > 0);
  const idle = IDLE[pose];
  const loop = LOOPS[idle];

  return (
    <span className={cn("relative inline-block w-40 shrink-0 select-none", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {shadow && (
        <m.span
          aria-hidden
          className="absolute bottom-[1%] left-1/2 h-[5%] w-[62%] -translate-x-1/2 rounded-[50%] bg-[#0B3C50]/12 blur-[2px]"
          animate={!reduce && idle === "hop" ? { scaleX: [1, 1.06, 0.72, 1.04, 1], opacity: [1, 1, 0.55, 1, 1] } : undefined}
          transition={loop.transition}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={pose}
          className="relative block"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          whileHover={reduce ? undefined : { y: -6, transition: { type: "spring", stiffness: 500, damping: 14 } }}
        >
          <m.span className="block" style={{ transformOrigin: "50% 100%" }} animate={reduce ? undefined : loop.animate} transition={loop.transition}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static WebP with srcset */}
            <img
              src={`/mascot/deer-${pose}.webp`}
              srcSet={`/mascot/deer-${pose}-sm.webp 360w, /mascot/deer-${pose}.webp 720w`}
              sizes="(max-width: 640px) 50vw, 320px"
              width={w}
              height={h}
              alt=""
              draggable={false}
              className="block h-auto w-full"
            />
            <svg viewBox={`0 0 ${w} ${h}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
              {pose === "idea" && !reduce && (
                <>
                  <defs>
                    <radialGradient id="willo-bulb">
                      <stop offset="0" stopColor="#FFE58A" stopOpacity=".75" />
                      <stop offset="1" stopColor="#FFE58A" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <m.circle cx={BULB.cx} cy={BULB.cy} r={BULB.r} fill="url(#willo-bulb)" animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
                </>
              )}
              {eyes.map(([x0, y0, x1, y1]) => {
                const cx = (x0 + x1) / 2;
                const cy = (y0 + y1) / 2;
                const rx = ((x1 - x0) / 2) * 1.16;
                const ry = ((y1 - y0) / 2) * 1.14;
                return (
                  <m.g key={x0} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }} initial={false} animate={{ scaleY: closed ? 1 : 0, opacity: closed ? 1 : 0 }} transition={{ duration: 0.07, ease: "easeOut" }}>
                    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FCE9D4" />
                    <path d={`M${cx - rx * 0.8} ${cy + ry * 0.05} Q${cx} ${cy + ry * 0.7} ${cx + rx * 0.8} ${cy + ry * 0.05}`} stroke="#0B3C50" strokeWidth={rx * 0.17} strokeLinecap="round" fill="none" />
                  </m.g>
                );
              })}
            </svg>
          </m.span>
        </m.span>
      </AnimatePresence>
    </span>
  );
}
