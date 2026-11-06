"use client";

import { useId, useState } from "react";
import { AnimatePresence, m, useAnimationControls, type Transition } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The Satify spirit: a soft aqua companion with a navy outline. One clean,
 * symmetric body shared by every pose (so it never deforms); only the face,
 * arms and props change. It floats, breathes, blinks and glances around,
 * and each pose has its own gesture. Hover or tap and it hops.
 * Reduced motion: still, with only the pose swap.
 *
 * Use at key moments only, never during a question, at most one on screen.
 */
export type SpiritPose = "idle" | "wave" | "cheer" | "think" | "oops" | "focus" | "study" | "sleep" | "peek";

export const SPIRIT_POSES: SpiritPose[] = ["idle", "wave", "cheer", "think", "oops", "focus", "study", "sleep", "peek"];

const INK = "#04404F";
const W = 200;
const H = 224;

/** One body for every pose: a rounded dome with two soft feet. */
const BODY =
  "M100 24C145 24 168 58 169 104C170 140 170 164 166 184C164 198 156 206 145 206C134 206 126 201 122 195Q100 187 78 195C74 201 66 206 55 206C44 206 36 198 34 184C30 164 30 140 31 104C32 58 55 24 100 24Z";

const ease = "easeInOut" as const;
const loop = (duration: number, extra: Partial<Transition> = {}): Transition => ({ duration, repeat: Infinity, ease, ...extra });

export function Spirit({ pose = "idle", className, label, still = false }: { pose?: SpiritPose; className?: string; label?: string; /** No idle motion (e.g. in the logo). */ still?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotionSafe();
  const live = !reduce && !still;
  const hop = useAnimationControls();
  const [poked, setPoked] = useState(0);
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };

  function poke() {
    if (!live) return;
    setPoked((n) => n + 1);
    void hop.start({
      y: [0, -14, 0, -4, 0],
      scaleX: [1, 0.94, 1.06, 0.98, 1],
      scaleY: [1, 1.07, 0.93, 1.02, 1],
      transition: { duration: 0.7, ease: [0.33, 1, 0.68, 1] },
    });
  }

  const sleep = pose === "sleep";
  const peek = pose === "peek";
  const floatT = loop(sleep ? 5.2 : 3.6);

  return (
    <span className={cn("inline-block w-28 shrink-0 select-none", className)} {...a11y} onPointerEnter={poke} onPointerDown={poke}>
      <svg viewBox={peek ? `0 0 ${W} 150` : `0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible">
        <defs>
          <radialGradient id={`b-${id}`} cx="0.42" cy="0.38" r="0.68">
            <stop offset="0" stopColor="#D4F9E8" />
            <stop offset="0.55" stopColor="#BFF4E1" />
            <stop offset="0.85" stopColor="#93E6D2" />
            <stop offset="1" stopColor="#6CD6C4" />
          </radialGradient>
          <radialGradient id={`a-${id}`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#B8F2E0" />
            <stop offset="1" stopColor="#74DAC8" />
          </radialGradient>
          <linearGradient id={`hl-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`c-${id}`}>
            <path d={BODY} />
          </clipPath>
          {peek && (
            <clipPath id={`peek-${id}`}>
              <rect x={-40} y={-40} width={W + 80} height={190} />
            </clipPath>
          )}
        </defs>

        {/* Ground shadow, breathing opposite to the float */}
        {!peek && (
          <m.ellipse cx={100} cy={214} rx={52} ry={6} fill={INK} opacity={0.12} animate={live ? { rx: sleep ? [56, 52, 56] : [52, 44, 52], opacity: [0.12, 0.08, 0.12] } : undefined} transition={floatT} />
        )}

        {/* Float */}
        <m.g animate={live && !peek ? { y: sleep ? [8, 5, 8] : [0, -7, 0] } : { y: sleep ? 8 : peek ? 30 : 0 }} transition={floatT}>
          {/* Hop on hover/tap, then squash and stretch on every pose change */}
          <m.g animate={hop} style={{ originX: 0.5, originY: 1 }}>
            <m.g key={pose} style={{ originX: 0.5, originY: 1 }} initial={live ? { scaleX: 1.12, scaleY: 0.86 } : false} animate={{ scaleX: 1, scaleY: 1 }} transition={{ type: "spring", stiffness: 420, damping: 14 }}>
              <g clipPath={peek ? `url(#peek-${id})` : undefined}>

                {/* Breathing body */}
                <m.g style={{ originX: 0.5, originY: 1 }} animate={live ? { scaleY: sleep ? [0.9, 0.92, 0.9] : [1, 1.018, 1], scaleX: sleep ? [1.06, 1.05, 1.06] : [1, 0.994, 1] } : { scaleY: sleep ? 0.9 : 1, scaleX: sleep ? 1.06 : 1 }} transition={floatT}>
                  <path d={BODY} fill={`url(#b-${id})`} />
                  <g clipPath={`url(#c-${id})`}>
                    {/* Soft shade on the lower right and a highlight on the upper left */}
                    <path d="M150 60C168 84 170 150 160 196L190 210L190 30Z" fill="#5CCDBB" opacity={0.22} />
                    <ellipse cx={60} cy={110} rx={10} ry={42} fill={`url(#hl-${id})`} transform="rotate(8 60 110)" />
                  </g>
                  <path d={BODY} fill="none" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />

                  <Face pose={pose} live={live} />

                  {/* Headphones for focus */}
                  {pose === "focus" && (
                    <g>
                      <path d="M34 108C34 40 166 40 166 108" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
                      <rect x={18} y={92} width={24} height={40} rx={11} fill={INK} />
                      <rect x={158} y={92} width={24} height={40} rx={11} fill={INK} />
                      <rect x={22} y={99} width={8} height={26} rx={4} fill="#20B9D0" opacity={0.85} />
                      <rect x={170} y={99} width={8} height={26} rx={4} fill="#20B9D0" opacity={0.85} />
                    </g>
                  )}
                </m.g>

                {/* Arms in front of the body, as in the original art */}
                <Arms pose={pose} live={live} poked={poked} fill={`url(#a-${id})`} />

                {/* Front props drawn over the body */}
                {pose === "study" && <Laptop live={live} />}
                {pose === "think" && (
                  <m.path
                    d="M112 150C120 132 146 130 150 146C153 160 136 168 122 162Z"
                    fill={`url(#a-${id})`}
                    stroke={INK}
                    strokeWidth={4.5}
                    strokeLinejoin="round"
                    initial={false}
                    animate={live ? { rotate: [0, -3, 0] } : undefined}
                    style={{ originX: 0.8, originY: 0.9 }}
                    transition={loop(2.4)}
                  />
                )}
              </g>

              {/* Peek: a hand gripping the edge */}
              {peek && <path d="M132 150C132 132 162 130 166 150" fill={`url(#a-${id})`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />}
            </m.g>
          </m.g>
        </m.g>

        {/* Pose accents */}
        <AnimatePresence>
          {(pose === "wave" || pose === "cheer") && (
            <m.g key="spark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} stroke={INK} strokeWidth={5} strokeLinecap="round">
              {[
                "M158 40l8 -14",
                "M170 52l14 -6",
                "M174 68l14 2",
              ].map((d, i) => (
                <m.path key={d} d={d} animate={live ? { pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] } : { pathLength: 1 }} transition={live ? loop(1.6, { delay: i * 0.12, repeatDelay: 0.8 }) : undefined} />
              ))}
            </m.g>
          )}
          {pose === "think" && (
            <m.g key="q" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <m.path d="M158 34q0-12 12-12t12 10q0 8-10 11v6M172 58v1" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" animate={live ? { y: [0, -3, 0] } : undefined} transition={loop(2.4)} />
            </m.g>
          )}
          {pose === "oops" && (
            <m.path key="drop" d="M166 70q-9 13 0 18q9-5 0-18z" fill="#A8EEF0" stroke={INK} strokeWidth={3} initial={{ opacity: 0, y: -4 }} animate={live ? { opacity: [0, 1, 1, 0], y: [-4, 0, 10, 16] } : { opacity: 1, y: 0 }} transition={live ? loop(2, { repeatDelay: 0.6 }) : undefined} />
          )}
          {sleep && live && (
            <m.g key="z" fill={INK} fontFamily="var(--font-display)" fontWeight={800}>
              {[0, 1, 2].map((i) => (
                <m.text key={i} x={152 + i * 13} y={80 - i * 16} fontSize={14 + i * 5} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.75, 0], y: [0, -12] }} transition={loop(3, { delay: i * 0.9, ease: "easeOut" })}>
                  {Z}
                </m.text>
              ))}
            </m.g>
          )}
        </AnimatePresence>
      </svg>
    </span>
  );
}

const Z = "z";

/** Arms: rounded paddles. Resting arms sit at the sides; raised arms are their own shape, outside the body, and wag from the shoulder. */
const ARM_REST = {
  l: "M52 126C32 120 9 136 11 158C13 176 33 181 45 168C52 160 54 147 54 138Z",
  r: "M148 126C168 120 191 136 189 158C187 176 167 181 155 168C148 160 146 147 146 138Z",
};
const ARM_UP = {
  l: "M38 136C30 116 22 96 12 84C4 75 -9 81 -5 94C-1 106 12 124 26 142Z",
  r: "M162 136C170 116 178 96 188 84C196 75 209 81 205 94C201 106 188 124 174 142Z",
};

function Arms({ pose, live, poked, fill }: { pose: SpiritPose; live: boolean; poked: number; fill: string }) {
  const upL = pose === "cheer";
  const upR = pose === "wave" || pose === "cheer";
  // Resting tilt (deg) per pose, pivoting at the shoulder.
  const restL = { idle: 0, wave: 0, cheer: 0, think: 0, oops: 6, focus: 0, study: -40, sleep: -8, peek: 0 }[pose];
  const restR = { idle: 0, wave: 0, cheer: 0, think: 0, oops: -6, focus: 0, study: 40, sleep: 8, peek: 0 }[pose];
  const hideR = pose === "think" || pose === "peek";
  const hideL = pose === "peek";
  const spring = { type: "spring" as const, stiffness: 260, damping: 18 };
  const common = { fill, stroke: INK, strokeWidth: 4.5, strokeLinejoin: "round" as const };

  return (
    <g>
      {!hideL &&
        (upL ? (
          <m.path key="lu" d={ARM_UP.l} {...common} style={{ originX: 0.85, originY: 1 }} initial={{ rotate: 30, opacity: 0 }} animate={live ? { rotate: [0, 10, 0], opacity: 1 } : { rotate: 0, opacity: 1 }} transition={live ? { rotate: loop(0.8), opacity: { duration: 0.15 } } : { duration: 0 }} />
        ) : (
          <m.path key="lr" d={ARM_REST.l} {...common} style={{ originX: 0.95, originY: 0.1 }} initial={false} animate={live && pose === "idle" ? { rotate: [0, 5, 0] } : { rotate: restL }} transition={live && pose === "idle" ? loop(3.6) : spring} />
        ))}
      {!hideR &&
        (upR ? (
          <m.path
            key={`ru-${poked}`}
            d={ARM_UP.r}
            {...common}
            style={{ originX: 0.15, originY: 1 }}
            initial={{ rotate: -30, opacity: 0 }}
            animate={live ? { rotate: pose === "wave" ? [0, -14, 6, -14, 0] : [0, -10, 0], opacity: 1 } : { rotate: 0, opacity: 1 }}
            transition={live ? { rotate: loop(pose === "wave" ? 1.3 : 0.8, { repeatDelay: pose === "wave" ? 1.4 : 0 }), opacity: { duration: 0.15 } } : { duration: 0 }}
          />
        ) : (
          <m.path key="rr" d={ARM_REST.r} {...common} style={{ originX: 0.05, originY: 0.1 }} initial={false} animate={live && pose === "idle" ? { rotate: [0, -5, 0] } : { rotate: restR }} transition={live && pose === "idle" ? loop(3.6, { delay: 0.3 }) : spring} />
        ))}
    </g>
  );
}

/** Eyes and mouth. Open eyes blink and glance around; other poses swap the expression. */
function Face({ pose, live }: { pose: SpiritPose; live: boolean }) {
  const closedHappy = pose === "cheer";
  const closedCalm = pose === "sleep" || pose === "focus";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.g key={closedHappy ? "happy" : closedCalm ? "calm" : "open"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.14 }}>
        {closedHappy ? (
          <g fill="none" stroke={INK} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M70 98l13 8-13 8" />
            <path d="M130 98l-13 8 13 8" />
            <path d="M88 122Q100 142 112 122Z" fill={INK} />
            <path d="M94 130Q100 126 106 130Q104 136 100 136Q96 136 94 130Z" fill="#E86A5C" stroke="none" />
          </g>
        ) : closedCalm ? (
          <g fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round">
            <path d="M70 108q11 7 22 0M108 108q11 7 22 0" />
            <path d="M94 124q6 4 12 0" />
          </g>
        ) : (
          <g>
            {/* Glance: the eyes drift left and right with holds */}
            <m.g animate={live ? { x: pose === "think" ? [4, 4] : pose === "oops" ? [-3, -3] : [0, 0, 3, 3, -3, -3, 0], y: pose === "think" ? -5 : pose === "oops" ? 3 : 0 } : { x: pose === "think" ? 4 : pose === "oops" ? -3 : 0, y: pose === "think" ? -5 : pose === "oops" ? 3 : 0 }} transition={live ? loop(9, { times: [0, 0.3, 0.38, 0.55, 0.62, 0.85, 1] }) : undefined}>
              {/* Blink: a quick squeeze every few seconds, with an occasional double */}
              <m.g style={{ originX: 0.5, originY: 0.5 }} animate={live ? { scaleY: [1, 1, 0.08, 1, 1, 0.08, 1, 1] } : undefined} transition={live ? { duration: 7, times: [0, 0.4, 0.42, 0.44, 0.9, 0.92, 0.94, 1], repeat: Infinity } : undefined}>
                <ellipse cx={79} cy={100} rx={8.5} ry={13} fill={INK} />
                <ellipse cx={121} cy={100} rx={8.5} ry={13} fill={INK} />
              </m.g>
            </m.g>
            {pose === "think" || pose === "oops" ? (
              <path d={pose === "think" ? "M94 126q6 -2 12 0" : "M90 126q5 -5 10 0t10 0"} fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M94 116Q100 117 106 116Q106 125 100 125Q94 125 94 116Z" fill={INK} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
            )}
          </g>
        )}
      </m.g>
    </AnimatePresence>
  );
}

/** A small navy laptop held in front, with a heart-ish sticker that pulses. */
function Laptop({ live }: { live: boolean }) {
  return (
    <g>
      <path d="M56 168L72 134H160L144 168Z" fill={INK} />
      <path d="M44 168H156Q161 168 158 175L154 182H46L42 175Q40 168 44 168Z" fill={INK} />
      <m.path d="M110 148c3-4 9-2 8 2c-1 3-5 5-7 7c-2-2-6-4-7-7c-1-4 5-6 6-2z" fill="#20B9D0" style={{ originX: 0.5, originY: 0.5 }} animate={live ? { scale: [1, 1.15, 1] } : undefined} transition={loop(1.8)} />
    </g>
  );
}
