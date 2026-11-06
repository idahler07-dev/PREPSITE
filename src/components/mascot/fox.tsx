"use client";

import { m, type Transition } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The Satify fox. Flat two-tone cyan, white mask and chest, and a big
 * aqua-tipped tail (its signature shape). Drawn in code so every part can
 * move: it breathes, blinks, sways its tail and twitches an ear now and
 * then. Under reduced motion it holds still.
 *
 * Six poses: sit (default), happy, think, cheer, sleep, peek.
 * Pass `src` to show a designer's illustration instead; pages don't change.
 * Use at key moments only, never during a question, at most one on screen.
 */
export type FoxPose = "sit" | "happy" | "think" | "cheer" | "sleep" | "peek";

const C = {
  body: "#0E8BA3",
  shade: "#087F9B",
  dark: "#06607A",
  sock: "#0A4F63",
  tip: "#75DCE7",
  white: "#FFFFFF",
  inner: "#A7E3EC",
  eye: "#102D40",
};

const Z = "z";

const loop = (duration: number, delay = 0, repeatDelay = 0): Transition => ({ duration, delay, repeat: Infinity, repeatDelay, ease: "easeInOut" });

export function Fox({ pose = "sit", className, label, src }: { pose?: FoxPose; className?: string; label?: string; src?: string }) {
  const reduce = useReducedMotionSafe();
  const live = !reduce;
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- swappable art from /public
    return <img src={src} alt={label ?? ""} className={cn("inline-block h-auto w-28 select-none", className)} />;
  }

  const peek = pose === "peek";
  const sleep = pose === "sleep";
  const eyesClosed = pose === "happy" || pose === "cheer" || sleep;
  const headTilt = pose === "think" ? -9 : sleep ? 7 : 0;

  return (
    <span className={cn("inline-block w-28 shrink-0 select-none", className)} {...a11y}>
      <svg viewBox={peek ? "0 0 240 160" : "0 0 240 240"} className="block h-auto w-full overflow-visible">
        {!peek && <ellipse cx={118} cy={228} rx={76} ry={6} fill="currentColor" className="text-foreground" opacity={0.08} />}

        {/* Tail: a big plume from behind the body; sways, lifts when cheering, wraps when asleep */}
        {!peek && (
          <m.g
            style={{ originX: 0.95, originY: 0.88 }}
            initial={false}
            animate={pose === "cheer" ? { rotate: live ? [-24, -16, -24] : -20 } : sleep ? { rotate: 12 } : live ? { rotate: [0, 5, 0, -3, 0] } : { rotate: 0 }}
            transition={pose === "cheer" ? loop(0.9) : sleep ? { duration: 0.6 } : loop(4.2)}
          >
            <path d="M154 210C112 240 34 232 20 182C8 138 44 102 82 108C64 128 64 166 92 184C114 196 136 200 156 190Z" fill={C.shade} />
            <path d="M20 180C10 140 44 104 82 108C60 116 44 138 46 166Z" fill={C.tip} />
            <path d="M58 200C84 214 120 212 146 200" stroke={C.dark} strokeOpacity={0.3} strokeWidth={3} strokeLinecap="round" fill="none" />
          </m.g>
        )}

        {/* Body, legs and bib, breathing */}
        {!peek && (
          <m.g style={{ originX: 0.5, originY: 1 }} animate={live ? { scaleY: sleep ? [1, 1.03, 1] : [1, 1.02, 1] } : undefined} transition={loop(sleep ? 4.8 : 3.2)}>
            <path d="M120 112C154 112 170 142 170 178C170 208 152 224 120 224C88 224 70 208 70 178C70 142 86 112 120 112Z" fill={C.body} />
            <path d="M120 136C136 144 142 164 136 182C132 192 108 192 104 182C98 164 104 144 120 136Z" fill={C.white} />
            <rect x={96} y={180} width={16} height={44} rx={8} fill={C.sock} />
            <rect x={128} y={180} width={16} height={44} rx={8} fill={C.sock} />
          </m.g>
        )}

        {/* Head */}
        <m.g style={{ originX: 0.5, originY: 0.85 }} initial={false} animate={{ rotate: headTilt, y: peek ? 16 : sleep ? 6 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
          {/* Ears: solid, with a small inner and a dark tip. The right one twitches now and then. */}
          <g>
            <path d="M74 80L60 12L112 50Z" fill={C.body} />
            <path d="M83 64L76 38L96 53Z" fill={C.inner} />
            <path d="M60 12L66 34L74 26Z" fill={C.dark} />
          </g>
          <m.g style={{ originX: 0.3, originY: 1 }} animate={live && !sleep ? { rotate: [0, 0, 9, -2, 0] } : { rotate: 0 }} transition={live && !sleep ? loop(0.5, 1.5, 8) : { duration: 0.3 }}>
            <path d="M166 80L180 12L128 50Z" fill={C.body} />
            <path d="M157 64L164 38L144 53Z" fill={C.inner} />
            <path d="M180 12L174 34L166 26Z" fill={C.dark} />
          </m.g>

          {/* Fox head: rounded crown, cheek fluff points, tapered snout */}
          <path d="M120 42C152 42 172 56 177 76C181 92 179 104 174 110L184 118C168 126 152 132 140 144C131 152 109 152 100 144C88 132 72 126 56 118L66 110C61 104 59 92 63 76C68 56 88 42 120 42Z" fill={C.body} />
          {/* White mask: cheeks to snout */}
          <path d="M120 94C129 107 148 115 184 118C168 126 152 132 140 144C131 152 109 152 100 144C88 132 72 126 56 118C92 115 111 107 120 94Z" fill={C.white} />
          {/* Forehead mark */}
          <path d="M120 48C127 60 127 74 120 84C113 74 113 60 120 48Z" fill={C.shade} />

          {/* Eyes */}
          {eyesClosed ? (
            <g fill="none" stroke={C.eye} strokeWidth={4.5} strokeLinecap="round">
              {sleep ? <path d="M90 98q9 5 18 0M132 98q9 5 18 0" /> : <path d="M90 100q9 -11 18 0M132 100q9 -11 18 0" />}
            </g>
          ) : (
            <m.g style={{ originX: 0.5, originY: 0.5 }} animate={live ? { scaleY: [1, 1, 0.1, 1] } : undefined} transition={live ? { duration: 5, times: [0, 0.94, 0.97, 1], repeat: Infinity, delay: 0.8 } : undefined}>
              {[99, 141].map((cx) => (
                <g key={cx}>
                  <ellipse cx={cx} cy={96} rx={7} ry={8.5} fill={C.eye} />
                  <circle cx={cx + 2.5} cy={pose === "think" ? 90 : 92.5} r={2.6} fill={C.white} />
                </g>
              ))}
            </m.g>
          )}

          {/* Nose and mouth at the snout tip */}
          <path d="M113 134Q120 130 127 134Q124 141 120 142Q116 141 113 134Z" fill={C.eye} />
          <path d={pose === "cheer" ? "M113 144Q120 151 127 144Z" : "M120 142q-3 5 -7 3M120 142q3 5 7 3"} fill={pose === "cheer" ? C.eye : "none"} stroke={C.eye} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </m.g>

        {/* Peek: paws resting on the edge either side of the snout */}
        {peek && (
          <g fill={C.body}>
            <ellipse cx={72} cy={156} rx={18} ry={10} />
            <ellipse cx={168} cy={156} rx={18} ry={10} />
            <path d="M66 152v6M74 152v6M162 152v6M170 152v6" stroke={C.dark} strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" />
          </g>
        )}

        {/* Sleep: soft z's drifting up */}
        {sleep && live && (
          <g fill={C.shade} fontFamily="var(--font-display)" fontWeight={800}>
            {[0, 1, 2].map((i) => (
              <m.text key={i} x={172 + i * 12} y={52 - i * 14} fontSize={12 + i * 4} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0], y: [0, -10] }} transition={loop(2.6, i * 0.7)}>
                {Z}
              </m.text>
            ))}
          </g>
        )}
      </svg>
    </span>
  );
}
