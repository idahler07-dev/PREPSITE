"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, m, useAnimationControls, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The Satify owl: flat, chunky and friendly (no outlines, no gradients),
 * drawn inline so every part moves. It breathes and bobs, blinks, its eyes
 * follow your cursor, the ear tufts twitch, and each pose has its own body
 * language (happy waves, correct flaps with sparkles, oops sweats, thinking
 * rests a wing on its chin). Hover or tap and it hops.
 * Reduced motion: still, with only the pose swap.
 *
 * Use it at key moments only, and never more than one owl on screen.
 */
export type OwlPose = "happy" | "correct" | "oops" | "thinking";

export const OWL_POSES: OwlPose[] = ["happy", "correct", "oops", "thinking"];

const C = {
  body: "#3B82F6",
  shade: "#2563EB",
  deep: "#1D4ED8",
  light: "#60A5FA",
  belly: "#BFDBFE",
  bellyMark: "#93C5FD",
  white: "#FFFFFF",
  pupil: "#0F172A",
  beak: "#F59E0B",
  beakDark: "#D97706",
};
const W = 240;
const H = 250;

export function Owl({
  pose = "happy",
  size,
  className,
  label,
  bob = true,
}: {
  pose?: OwlPose;
  /** Width in px. Leave out to size it with className (e.g. `w-20`). */
  size?: number;
  className?: string;
  /** Accessible name. Without it the owl is decorative. */
  label?: string;
  bob?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const live = !reduce;
  const ref = useRef<SVGSVGElement>(null);
  const hop = useAnimationControls();

  // Eyes follow the pointer (a few units at most), springy.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 180, damping: 18 });
  const sy = useSpring(py, { stiffness: 180, damping: 18 });
  const tracking = live && pose === "happy";
  useEffect(() => {
    if (!tracking) {
      px.set(pose === "thinking" ? 5 : 0);
      py.set(pose === "thinking" ? -7 : pose === "oops" ? 3 : 0);
      return;
    }
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.42);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 240);
        px.set((dx / d) * 8 * k);
        py.set((dy / d) * 7 * k);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [tracking, pose, px, py]);

  const [flap, setFlap] = useState(0);
  function poke() {
    if (!live) return;
    setFlap((n) => n + 1);
    void hop.start({ y: [0, -16, 0], scaleY: [1, 1.05, 0.93, 1], scaleX: [1, 0.96, 1.06, 1], transition: { duration: 0.5, ease: "easeOut" } });
  }

  const rightWing = pose === "happy" ? { rotate: [0, -40, -20, -40, 0] } : pose === "correct" ? { rotate: [0, -50, -12, -50, 0] } : pose === "thinking" ? { rotate: 104 } : { rotate: 4 };
  const rightWingT =
    pose === "happy"
      ? { duration: 1.3, repeat: Infinity, repeatDelay: 2.4, ease: "easeInOut" as const }
      : pose === "correct"
        ? { duration: 0.65, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" as const }
        : { type: "spring" as const, stiffness: 220, damping: 16 };

  return (
    <m.span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-block w-24 shrink-0 select-none", className)}
      style={size ? { width: size } : undefined}
      animate={bob && live ? { y: [0, -4, 0] } : undefined}
      transition={bob && live ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : undefined}
      onPointerEnter={poke}
      onPointerDown={poke}
    >
      <m.svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" animate={hop}>
        <defs>
          <clipPath id={`${id}c`}>
            <path d={BODY} />
          </clipPath>
          <clipPath id={`${id}eL`}>
            <ellipse cx={93} cy={112} rx={26} ry={28} />
          </clipPath>
          <clipPath id={`${id}eR`}>
            <ellipse cx={147} cy={112} rx={26} ry={28} />
          </clipPath>
        </defs>

        {/* Ground shadow */}
        <m.ellipse cx={120} cy={246} rx={56} ry={6} fill="currentColor" className="text-foreground" opacity={0.1} animate={bob && live ? { rx: [56, 48, 56] } : undefined} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />

        {/* Squash and stretch on every pose change */}
        <m.g key={pose} style={{ originX: 0.5, originY: 1 }} initial={live ? { scaleY: 0.86, scaleX: 1.1 } : false} animate={{ scaleY: 1, scaleX: 1 }} transition={{ type: "spring", stiffness: 520, damping: 13 }}>
          {/* Feet */}
          <g fill={C.beak}>
            <path d="M84 230h22q4 0 4 5v4q0 5-5 5H85q-5 0-5-5v-4q0-5 4-5z" />
            <path d="M134 230h22q4 0 4 5v4q0 5-5 5h-20q-5 0-5-5v-4q0-5 4-5z" />
          </g>

          {/* Breathing body */}
          <m.g style={{ originX: 0.5, originY: 1 }} animate={live ? { scaleY: [1, 1.02, 1], scaleX: [1, 0.99, 1] } : undefined} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
            {/* Ear tufts */}
            <m.path d="M58 70L46 22Q72 32 92 52Z" fill={C.shade} style={{ originX: 0.8, originY: 1 }} animate={live ? { rotate: [0, 0, -10, 4, 0] } : undefined} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4.6, times: [0, 0.2, 0.45, 0.75, 1] }} />
            <m.path d="M182 70L194 22Q168 32 148 52Z" fill={C.shade} style={{ originX: 0.2, originY: 1 }} animate={live ? { rotate: [0, 0, 10, -4, 0] } : undefined} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4.6, delay: 0.1, times: [0, 0.2, 0.45, 0.75, 1] }} />

            <path d={BODY} fill={C.body} />
            <g clipPath={`url(#${id}c)`}>
              {/* Lower body shade and belly */}
              <ellipse cx={120} cy={250} rx={110} ry={50} fill={C.shade} opacity={0.35} />
              <ellipse cx={120} cy={196} rx={54} ry={46} fill={C.belly} />
              <g fill={C.bellyMark}>
                <path d="M96 166q6 7 12 0zM114 166q6 7 12 0zM132 166q6 7 12 0z" />
                <path d="M87 186q6 7 12 0zM105 186q6 7 12 0zM123 186q6 7 12 0zM141 186q6 7 12 0z" />
                <path d="M96 206q6 7 12 0zM114 206q6 7 12 0zM132 206q6 7 12 0z" />
              </g>
              {/* Head shine */}
              <path d="M62 66Q90 50 120 52Q96 60 74 80Z" fill={C.light} opacity={0.7} />
            </g>

            {/* Eyes */}
            <Eyes id={id} pose={pose} sx={sx} sy={sy} live={live} />

            {/* Brows */}
            <Brows pose={pose} live={live} />

            {/* Beak: upper and lower halves */}
            <path d="M106 138Q120 130 134 138L120 154Z" fill={C.beak} />
            <m.path d="M110 146L130 146L120 160Z" fill={C.beakDark} animate={pose === "correct" ? { y: [0, 3, 0] } : { y: 0 }} transition={pose === "correct" && live ? { duration: 0.65, repeat: Infinity, repeatDelay: 0.5 } : { duration: 0.2 }} />

            {/* Wings */}
            <m.path d="M40 132Q12 160 22 204Q44 204 58 180Q50 154 56 136Z" fill={C.shade} style={{ originX: 0.95, originY: 0.05 }} animate={pose === "correct" && live ? { rotate: [0, 48, 12, 48, 0] } : { rotate: 0 }} transition={pose === "correct" ? { duration: 0.65, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" } : { duration: 0.3 }} />
            <m.path
              key={`w-${flap}`}
              d="M200 132Q228 160 218 204Q196 204 182 180Q190 154 184 136Z"
              fill={C.shade}
              style={{ originX: 0.05, originY: 0.05 }}
              animate={live ? rightWing : { rotate: pose === "thinking" ? 104 : 0 }}
              transition={rightWingT}
            />
          </m.g>

          {/* Pose extras */}
          <AnimatePresence>
            {pose === "correct" && live && (
              <m.g key="sparkles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {[
                  { x: 20, y: 40, s: 1, c: "#FBBF24", d: 0 },
                  { x: 214, y: 30, s: 0.8, c: "#FBBF24", d: 0.5 },
                  { x: 228, y: 110, s: 0.6, c: C.light, d: 0.9 },
                  { x: 8, y: 116, s: 0.55, c: C.light, d: 1.3 },
                ].map((p, i) => (
                  <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
                    <m.path
                      d="M0 -12l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"
                      fill={p.c}
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      animate={{ scale: [0.4, 1.15, 0.4], rotate: [0, 45, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: p.d }}
                    />
                  </g>
                ))}
              </m.g>
            )}
            {pose === "oops" && (
              <m.path
                key="drop"
                d="M206 84q-10 14 0 20q10-6 0-20z"
                fill="#7DD3FC"
                initial={{ opacity: 0, y: -6 }}
                animate={live ? { opacity: [0, 1, 1, 0], y: [-6, 0, 14, 22] } : { opacity: 1, y: 0 }}
                transition={live ? { duration: 1.8, repeat: Infinity, repeatDelay: 0.6 } : undefined}
              />
            )}
            {pose === "thinking" && (
              <m.g key="bubble" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ originX: 0, originY: 1 }}>
                {[
                  { cx: 196, cy: 58, r: 5 },
                  { cx: 208, cy: 38, r: 8 },
                ].map((c, i) => (
                  <m.circle key={i} {...c} fill="#DBEAFE" animate={live ? { opacity: [0.35, 1, 0.35] } : undefined} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.25 }} />
                ))}
                <m.g animate={live ? { y: [0, -3, 0] } : undefined} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                  <ellipse cx={226} cy={8} rx={20} ry={16} fill="#DBEAFE" />
                  <path d="M220 2q0-8 7-8t7 6q0 5-6 7v4M227 17v1" stroke={C.shade} strokeWidth={4} strokeLinecap="round" fill="none" />
                </m.g>
              </m.g>
            )}
          </AnimatePresence>
        </m.g>
      </m.svg>
    </m.span>
  );
}

/** A chunky rounded body, wider at the bottom. */
const BODY = "M120 42C176 42 206 78 206 132V178C206 218 170 236 120 236C70 236 34 218 34 178V132C34 78 64 42 120 42Z";

type Spring = ReturnType<typeof useSpring>;

/** Upper-lid shapes per pose (left, right): they set the mood and drop for a blink. */
const LIDS: Record<Exclude<OwlPose, "correct">, [string, string]> = {
  happy: ["M60 70H126V86Q100 80 64 90Z", "M114 70H180V90Q140 80 114 86Z"],
  oops: ["M60 70H126V84Q102 92 64 104Z", "M114 70H180V104Q138 92 114 84Z"],
  thinking: ["M60 70H126V104Q96 96 64 106Z", "M114 70H180V88Q144 80 114 92Z"],
};

function Eyes({ id, pose, sx, sy, live }: { id: string; pose: OwlPose; sx: Spring; sy: Spring; live: boolean }) {
  if (pose === "correct") {
    // Happy, squeezed-shut eyes
    return (
      <g fill="none" stroke={C.pupil} strokeWidth={8} strokeLinecap="round">
        <path d="M74 120Q93 98 112 120" />
        <path d="M128 120Q147 98 166 120" />
      </g>
    );
  }
  const lids = LIDS[pose];
  const pr = pose === "oops" ? 8 : 12;
  return (
    <g>
      {([
        { cx: 93, clip: `${id}eL`, lid: lids[0] },
        { cx: 147, clip: `${id}eR`, lid: lids[1] },
      ] as const).map((e, i) => (
        <g key={e.cx} clipPath={`url(#${e.clip})`}>
          <rect x={e.cx - 30} y={80} width={60} height={64} fill={C.white} />
          <m.g style={{ x: sx, y: sy }}>
            <circle cx={e.cx + (i === 0 ? 4 : -4)} cy={116} r={pr} fill={C.pupil} />
            <circle cx={e.cx + (i === 0 ? 0 : -8)} cy={111} r={pr * 0.36} fill={C.white} />
          </m.g>
          <m.path
            d={e.lid}
            fill={C.body}
            initial={false}
            animate={live ? { d: e.lid, y: [0, 0, 34, 0] } : { d: e.lid }}
            transition={live ? { y: { duration: 4.4, repeat: Infinity, times: [0, 0.92, 0.955, 1], delay: 1 + i * 0.04 }, d: { type: "spring", stiffness: 300, damping: 22 } } : undefined}
          />
        </g>
      ))}
    </g>
  );
}

function Brows({ pose, live }: { pose: OwlPose; live: boolean }) {
  const tilt = { happy: [8, -8], correct: [14, -14], oops: [-14, 14], thinking: [2, -16] }[pose];
  const lift = { happy: 0, correct: -6, oops: -2, thinking: -4 }[pose];
  return (
    <g fill={C.deep}>
      {[
        { d: "M66 80Q84 70 112 76Q110 84 68 88Z", ox: 0.9, r: tilt[0] },
        { d: "M174 80Q156 70 128 76Q130 84 172 88Z", ox: 0.1, r: tilt[1] },
      ].map((b, i) => (
        <m.path
          key={i}
          d={b.d}
          style={{ originX: b.ox, originY: 0.6 }}
          initial={false}
          animate={{ rotate: b.r, y: lift }}
          transition={live ? { type: "spring", stiffness: 300, damping: 14 } : { duration: 0 }}
        />
      ))}
    </g>
  );
}
