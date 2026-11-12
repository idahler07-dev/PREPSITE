"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, m } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { DEER_POSES, type DeerPose } from "./deer";
import { Sim, loadPose, renderPose, type Asset } from "./willo-rig";

/**
 * Willo, alive. Not a squashed sticker: each region of the artwork moves with
 * its own physics through a small warp rig (see willo-rig.ts).
 *  - the head drifts and turns, now and then glancing to one side; antlers lag it
 *    and settle with a little overshoot; ears flick on their own; the scarf tail
 *    flutters; the pupils wander, look where the head looks and follow the pointer
 *  - blinks (drawn lids that follow the head), breathing, a heartbeat, a bulb that
 *    bobs, accent marks that flick, a raised arm that waves now and then
 *  - cheer, jump and trophy hop (a lift, no squash)
 * Reduced motion, or no WebGL: the still illustration.
 */

/** Open-eye boxes (x0, y0, x1, y1) in the illustrated art, for the blink lids (art/mascot/illustrated-geometry.json). */
const EYES: Partial<Record<DeerPose, [number, number, number, number][]>> = {
  stand: [
    [219, 290, 285, 369],
    [378, 262, 440, 336],
  ],
  wink: [[363, 252, 420, 324]],
  idea: [
    [215, 275, 278, 349],
    [373, 236, 429, 302],
  ],
  think: [
    [299, 302, 366, 387],
    [467, 249, 536, 334],
  ],
  read: [
    [293, 353, 361, 430],
    [461, 324, 521, 400],
  ],
  laptop: [
    [329, 334, 398, 406],
    [492, 303, 547, 374],
  ],
  sad: [
    [253, 370, 333, 454],
    [432, 327, 507, 411],
  ],
};

// ─── shared frame loop ──────────────────────────────────────────────────────
interface Inst {
  visible: boolean;
  tick: (dt: number) => void;
}
const insts = new Set<Inst>();
let raf = 0;
let last = 0;
const pointer = { x: 0, y: 0, t: -1e9 };
let listening = false;

function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  if (!document.hidden) for (const i of insts) if (i.visible) i.tick(dt);
  raf = insts.size ? requestAnimationFrame(loop) : 0;
}
function addInst(i: Inst) {
  insts.add(i);
  if (!listening) {
    listening = true;
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.t = performance.now();
      },
      { passive: true },
    );
  }
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  return () => {
    insts.delete(i);
  };
}

// ─── component ──────────────────────────────────────────────────────────────

function Body({
  pose,
  still,
  shadowRef,
}: {
  pose: DeerPose;
  still: boolean;
  shadowRef: RefObject<HTMLSpanElement | null>;
}) {
  const [w, h] = DEER_POSES[pose];
  const wrap = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const lids = useRef<SVGSVGElement>(null);
  const lidEls = useRef<(SVGGElement | null)[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const eyes = EYES[pose] ?? [];

  useEffect(() => {
    if (still) return;
    let alive = true;
    void loadPose(pose).then((a) => alive && setAsset(a));
    return () => {
      alive = false;
    };
  }, [pose, still]);

  useEffect(() => {
    if (!asset || !wrap.current || !canvas.current) return;
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const sim = new Sim(asset.meta, pose);
    const inst: Inst = {
      visible: false,
      tick(dt) {
        const rect = el.getBoundingClientRect();
        if (!rect.width) return;
        const active = performance.now() - pointer.t < 2600;
        const ptr = active
          ? {
              dx: Math.max(
                -1,
                Math.min(1, (pointer.x - (rect.left + rect.width / 2)) / 420),
              ),
              dy: Math.max(
                -1,
                Math.min(
                  1,
                  (pointer.y - (rect.top + rect.height * 0.38)) / 420,
                ),
              ),
            }
          : null;
        const { frame, blink, hop } = sim.step(dt, ptr);
        const out = renderPose(asset, frame);
        const cw = Math.min(
          asset.meta.w,
          Math.round(rect.width * Math.min(2, window.devicePixelRatio || 1)),
        );
        const ch = Math.round((cw * asset.meta.h) / asset.meta.w);
        if (cv.width !== cw || cv.height !== ch) {
          cv.width = cw;
          cv.height = ch;
        }
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(out, 0, 0, asset.meta.w, asset.meta.h, 0, 0, cw, ch);
        // lids ride along with the head
        const k = rect.width / asset.meta.w;
        const svg = lids.current;
        if (svg && asset.meta.n) {
          const [nx, ny] = asset.meta.n;
          svg.style.transformOrigin = `${(nx / asset.meta.w) * 100}% ${(ny / asset.meta.h) * 100}%`;
          svg.style.transform = `translate(${(frame.headT[0] + frame.globalT[0]) * k}px, ${(frame.headT[1] + frame.globalT[1]) * k}px) rotate(${frame.head}rad)`;
        }
        for (const g of lidEls.current) {
          if (!g) continue;
          g.style.transform = `scaleY(${blink})`;
          g.style.opacity = blink > 0.02 ? "1" : "0";
        }
        const sh = shadowRef.current;
        if (sh)
          sh.style.transform = `translateX(-50%) scale(${1 - 0.28 * Math.sin(Math.PI * hop)}, 1)`;
      },
    };
    const io = new IntersectionObserver(
      ([e]) => (inst.visible = !!e?.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(el);
    const off = addInst(inst);
    return () => {
      io.disconnect();
      off();
    };
  }, [asset, pose, shadowRef]);

  return (
    <span ref={wrap} className="relative block">
      {/* eslint-disable-next-line @next/next/no-img-element -- static WebP with srcset */}
      <img
        src={`/mascot/deer-${pose}.webp`}
        srcSet={`/mascot/deer-${pose}-sm.webp 360w, /mascot/deer-${pose}.webp 720w`}
        sizes="(max-width: 640px) 50vw, 320px"
        width={w}
        height={h}
        alt=""
        draggable={false}
        className={cn("block h-auto w-full", asset && "opacity-0")}
      />
      {asset && (
        <canvas
          ref={canvas}
          className="absolute inset-0 size-full"
          aria-hidden
        />
      )}
      {asset && eyes.length > 0 && (
        <svg
          ref={lids}
          viewBox={`0 0 ${w} ${h}`}
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          {eyes.map(([x0, y0, x1, y1], i) => {
            const cx = (x0 + x1) / 2;
            const cy = (y0 + y1) / 2;
            const rx = ((x1 - x0) / 2) * 1.16;
            const ry = ((y1 - y0) / 2) * 1.14;
            return (
              <g
                key={x0}
                ref={(g) => void (lidEls.current[i] = g)}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "50% 0%",
                  transform: "scaleY(0)",
                  opacity: 0,
                }}
              >
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FCE9D4" />
                <path
                  d={`M${cx - rx * 0.8} ${cy + ry * 0.05} Q${cx} ${cy + ry * 0.7} ${cx + rx * 0.8} ${cy + ry * 0.05}`}
                  stroke="#0B3C50"
                  strokeWidth={rx * 0.17}
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            );
          })}
        </svg>
      )}
    </span>
  );
}

export function Willo({
  pose = "stand",
  className,
  label,
  shadow = true,
}: {
  pose?: DeerPose;
  className?: string;
  label?: string;
  shadow?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const shadowRef = useRef<HTMLSpanElement>(null);
  return (
    <span
      className={cn(
        "relative inline-block w-40 shrink-0 select-none",
        className,
      )}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {shadow && (
        <span
          ref={shadowRef}
          aria-hidden
          className="absolute bottom-[1%] left-1/2 h-[5%] w-[62%] -translate-x-1/2 rounded-[50%] bg-[#0B3C50]/12 blur-[2px]"
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={pose}
          className="relative block"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, y: -4, transition: { duration: 0.14 } }
          }
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          <Body pose={pose} still={reduce} shadowRef={shadowRef} />
        </m.span>
      </AnimatePresence>
    </span>
  );
}
