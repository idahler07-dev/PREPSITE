"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, m, useInView, useMotionValue, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

const CANCEL = Symbol("demo-cancel");
const EASE = [0.33, 0, 0.2, 1] as const;

export type DemoApi = {
  /** Glide the cursor to the element marked `data-demo={key}` (fx, fy: point inside it, 0–1). */
  move: (key: string, opts?: { fx?: number; fy?: number; speed?: number }) => Promise<void>;
  /** Press: the cursor dips, a ripple spreads and the element under it pushes in. */
  click: (key?: string) => Promise<void>;
  /** Hold the mouse down (for drags). */
  down: () => Promise<void>;
  up: () => Promise<void>;
  /** Wait; time only passes while the demo is running. */
  wait: (ms: number) => Promise<void>;
  cursor: { x: MotionValue<number>; y: MotionValue<number> };
};

type Ripple = { id: number; x: number; y: number };

/**
 * A tiny scripted "user" for product demos. A demo is real UI with state;
 * its script moves a custom cursor over that UI and changes the state, step by step.
 *  - Starts when scrolled into view, pauses off screen, when the tab is hidden,
 *    or when the visitor presses pause (WCAG 2.2.2); resumes where it stopped.
 *  - Under reduced motion nothing plays: `final()` sets the finished state.
 */
export function useCursorDemo({ script, reset, final }: { script: (api: DemoApi) => Promise<void>; reset: () => void; final: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.45 });
  const reduce = useReducedMotionSafe();
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const runningRef = useRef(false);
  const gen = useRef(0);
  const started = useRef(false);
  const fns = useRef({ script, reset, final });
  fns.current = { script, reset, final };

  useEffect(() => {
    const on = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  runningRef.current = inView && !paused && !hidden && !reduce;

  /** Await an animation, pausing it whenever the demo is not running. */
  const track = useCallback((c: AnimationPlaybackControls, my: number) => {
    return new Promise<void>((resolve, reject) => {
      let done = false;
      c.finished.then(() => {
        done = true;
        resolve();
      });
      const id = setInterval(() => {
        if (done) return clearInterval(id);
        if (my !== gen.current) {
          clearInterval(id);
          c.stop();
          return reject(CANCEL);
        }
        if (runningRef.current) c.play();
        else c.pause();
      }, 40);
    });
  }, []);

  useEffect(() => {
    if (reduce) {
      gen.current++;
      fns.current.final();
      return;
    }
    if (!inView || started.current) return;
    started.current = true;
    const my = ++gen.current;

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        let left = ms;
        let last = performance.now();
        const tick = () => {
          if (my !== gen.current) return reject(CANCEL);
          const now = performance.now();
          if (runningRef.current) left -= now - last;
          last = now;
          if (left <= 0) resolve();
          else setTimeout(tick, 30);
        };
        tick();
      });

    const box = ref.current!;
    const point = (key: string, fx = 0.5, fy = 0.5) => {
      const el = box.querySelector<HTMLElement>(`[data-demo="${key}"]`);
      if (!el) return null;
      const a = box.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      return { x: b.left - a.left + b.width * fx, y: b.top - a.top + b.height * fy, el };
    };
    let lastKey: string | undefined;

    const api: DemoApi = {
      cursor: { x, y },
      wait,
      async move(key, { fx, fy, speed = 1 } = {}) {
        const p = point(key, fx, fy);
        if (!p) return;
        lastKey = key;
        const dist = Math.hypot(p.x - x.get(), p.y - y.get());
        const duration = Math.min(1.1, Math.max(0.35, dist / 650)) / speed;
        await Promise.all([track(animate(x, p.x, { duration, ease: EASE }), my), track(animate(y, p.y, { duration, ease: EASE }), my)]);
      },
      async click(key) {
        const p = point(key ?? lastKey ?? "", 0.5, 0.5);
        p?.el.setAttribute("data-pressed", "true");
        setPressed(true);
        setRipples((r) => [...r, { id: performance.now(), x: x.get(), y: y.get() }]);
        await wait(140);
        p?.el.removeAttribute("data-pressed");
        setPressed(false);
        await wait(120);
      },
      async down() {
        setPressed(true);
        await wait(120);
      },
      async up() {
        setPressed(false);
        await wait(80);
      },
    };

    (async () => {
      try {
        const r = box.getBoundingClientRect();
        x.set(r.width * 0.78);
        y.set(r.height * 0.92);
        for (;;) {
          fns.current.reset();
          setVisible(true);
          await wait(500);
          await fns.current.script(api);
          await wait(2200);
          setVisible(false);
          await wait(500);
        }
      } catch (e) {
        if (e !== CANCEL) throw e;
      }
    })();
  }, [inView, reduce, track, x, y]);

  useEffect(
    () => () => {
      gen.current++;
    },
    [],
  );

  const cursor = reduce ? null : (
    <>
      <AnimatePresence>
        {ripples.map((r) => (
          <m.span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-40 size-9 rounded-full border-2 border-primary/50 bg-primary/10"
            style={{ x: r.x - 18, y: r.y - 18 }}
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setRipples((all) => all.filter((o) => o.id !== r.id))}
          />
        ))}
      </AnimatePresence>
      <m.div aria-hidden className="pointer-events-none absolute top-0 left-0 z-50" style={{ x, y }}>
        <m.svg
          width="22"
          height="26"
          viewBox="0 0 22 26"
          className="-translate-x-[3px] -translate-y-[2px] drop-shadow-[0_3px_5px_rgba(16,45,64,0.35)]"
          animate={{ opacity: visible ? 1 : 0, scale: pressed ? 0.84 : 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 30 }}
          style={{ transformOrigin: "3px 2px" }}
        >
          <path d="M3 2 L3 20.5 L7.6 16.4 L10.6 23.2 L13.9 21.8 L10.9 15.1 L17.2 14.7 Z" fill="#0B1D28" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
        </m.svg>
      </m.div>
    </>
  );

  const active = inView && !paused && !hidden && !reduce;
  return { ref, cursor, paused, toggle: useCallback(() => setPaused((p) => !p), []), reduce, active, x, y };
}

/**
 * Window chrome around a demo. The live UI inside is decorative for assistive
 * tech (inert, aria-hidden); the frame carries a text label. Play/pause sits outside.
 */
export function DemoFrame({
  demo,
  label,
  path,
  children,
  className,
  bodyClassName,
}: {
  demo: ReturnType<typeof useCursorDemo>;
  label: string;
  path: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const td = useTranslations("home3.demo");
  return (
    <div className={cn("relative", className)}>
      <div ref={demo.ref} role="img" aria-label={label} className="demo relative overflow-hidden rounded-[22px] border border-border bg-surface shadow-[var(--elev-lg)]">
        <div aria-hidden inert className="select-none">
          <div className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-2.5">
            <span className="flex gap-1.5">
              <i className="size-2.5 rounded-full bg-border" />
              <i className="size-2.5 rounded-full bg-border" />
              <i className="size-2.5 rounded-full bg-border" />
            </span>
            <span className="mx-auto truncate rounded-md bg-surface px-3 py-0.5 text-[11px] font-medium text-muted-foreground">{path}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{td("sample")}</span>
          </div>
          <div className={cn("relative", bodyClassName)}>{children}</div>
        </div>
        {demo.cursor}
      </div>
      {!demo.reduce && (
        <button
          type="button"
          onClick={demo.toggle}
          className="absolute -bottom-3 left-4 z-10 grid size-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground shadow-[var(--elev-sm)] transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label={demo.paused ? td("play") : td("pause")}
        >
          {demo.paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
        </button>
      )}
    </div>
  );
}

/** A shimmering placeholder bar for loading states. */
export function Skel({ className }: { className?: string }) {
  return <span className={cn("demo-skel block rounded-md", className)} />;
}

/** A number that eases to `value` whenever it changes. */
export function Tween({ value, format = (n: number) => String(Math.round(n)), duration = 1.1 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [n, setN] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const c = animate(from.current, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => ((from.current = v), setN(v)) });
    return () => c.stop();
  }, [value, duration]);
  return <span className="tabular-nums">{format(n)}</span>;
}
