"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowDown, BookOpen, Check, Flame, Gift, Loader2, Lock, RotateCcw, Star, Trophy, Zap } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Owl } from "@/components/mascot/owl";
import { useStartDrill } from "@/components/practice/use-start-drill";
import { nodeOffset, type NodeKind, type NodeState } from "@/lib/path";
import { cn } from "@/lib/utils";

export interface NodeVM {
  id: string;
  kind: NodeKind;
  state: NodeState;
  key: string;
  title: string;
  mastery: number | null;
  /** 1-based lesson number within the unit (lessons only). */
  lesson?: number;
}
export interface UnitVM {
  index: number;
  domain: string;
  title: string;
  section: "RW" | "MATH";
  done: number;
  total: number;
  nodes: NodeVM[];
}

const ROW = 104;
const COL = 320;

/**
 * The learning path (brief §6): a winding road per unit with sticky unit
 * banners. Finished stretches draw in blue; the current lesson pulses with
 * a floating START bubble and the owl beside it. Tap a node for its popover.
 * The page scrolls to the current lesson on load, and a button brings you
 * back to it when it's off screen.
 */
export function PathView({ units, dueReviews }: { units: UnitVM[]; dueReviews: number }) {
  const t = useTranslations("path");
  const reduce = useReducedMotion();
  const currentRef = useRef<HTMLDivElement>(null);
  const currentVisible = useInView(currentRef, { margin: "-80px 0px -100px 0px" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setTimeout(() => currentRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }), 350);
    return () => clearTimeout(id);
  }, [reduce]);

  return (
    <div className="relative">
      {units.map((u) => (
        <UnitBlock key={u.domain} unit={u} dueReviews={dueReviews} currentRef={currentRef} />
      ))}
      <AnimatePresence>
        {mounted && !currentVisible && units.some((u) => u.nodes.some((n) => n.state === "current")) && (
          <m.button
            type="button"
            onClick={() => currentRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })}
            className="fixed right-4 bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] active:translate-y-[2px] lg:right-[calc(300px+5rem)] lg:bottom-8"
            aria-label={t("jump")}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <ArrowDown className="size-5" aria-hidden />
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitBlock({ unit, dueReviews, currentRef }: { unit: UnitVM; dueReviews: number; currentRef: React.RefObject<HTMLDivElement | null> }) {
  const t = useTranslations("path");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const rw = unit.section === "RW";
  const pts = unit.nodes.map((_, i) => ({ x: COL / 2 + nodeOffset(i), y: i * ROW + ROW / 2 }));
  const curve = (p: { x: number; y: number }[]) =>
    p.reduce((d, pt, i) => {
      if (i === 0) return `M${pt.x} ${pt.y}`;
      const prev = p[i - 1]!;
      const my = (prev.y + pt.y) / 2;
      return `${d} C ${prev.x} ${my}, ${pt.x} ${my}, ${pt.x} ${pt.y}`;
    }, "");
  const currentIdx = unit.nodes.findIndex((n) => n.state === "current");
  const allDone = unit.done === unit.total;
  const doneTo = currentIdx >= 0 ? currentIdx : allDone ? unit.nodes.length - 1 : (() => {
    let last = -1;
    unit.nodes.forEach((n, i) => {
      if (n.state === "done" && last === i - 1) last = i;
    });
    return last;
  })();
  const height = unit.nodes.length * ROW;

  return (
    <section id={`unit-${unit.index}`} aria-labelledby={`unit-${unit.index}-title`} className="relative scroll-mt-24 pb-10">
      <UnitBackdrop index={unit.index} rw={rw} height={height} />
      <div className="sticky top-[72px] z-20 mb-6">
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-primary-foreground",
            rw ? "bg-review shadow-[0_4px_0_color-mix(in_oklab,var(--review),black_25%)]" : "bg-primary shadow-[0_4px_0_var(--primary-edge)]",
          )}
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold opacity-85">{t("unit", { n: unit.index })}</p>
            <h2 id={`unit-${unit.index}-title`} className="truncate font-display text-lg font-extrabold">
              {unit.title}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="font-display text-sm font-extrabold tabular-nums opacity-90">
              {unit.done}/{unit.total}
            </span>
            <span className="grid size-10 place-items-center rounded-xl border-2 border-white/25">
              <BookOpen className="size-5" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <div ref={ref} className="relative mx-auto" style={{ width: COL, height }}>
        <svg width={COL} height={height} className="absolute inset-0 overflow-visible" aria-hidden>
          <path d={curve(pts)} fill="none" stroke="var(--border)" strokeWidth={12} strokeLinecap="round" />
          {doneTo > 0 && (
            <m.path
              d={curve(pts.slice(0, doneTo + 1))}
              fill="none"
              stroke={rw ? "var(--review)" : "var(--primary)"}
              strokeWidth={12}
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: inView || reduce ? 1 : 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          )}
        </svg>
        {unit.nodes.map((n, i) => (
          <div key={n.id} ref={n.state === "current" ? currentRef : undefined} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pts[i]!.x, top: pts[i]!.y }}>
            <NodeButton node={n} unitSize={unit.total} rw={rw} dueReviews={dueReviews} />
            {n.state === "current" && (
              <div className={cn("pointer-events-none absolute top-1/2 w-[78px] -translate-y-[60%]", nodeOffset(i) > 0 ? "right-[calc(100%+18px)]" : "left-[calc(100%+18px)]")}>
                <Owl pose="happy" className="w-full" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Backdrop ---------- */

const GLYPHS = {
  RW: ["¶", "Aa", "“”", "?", "§", "&", "abc", ";", "—"],
  MATH: ["π", "√x", "Σ", "x²", "∠", "%", "≈", "f(x)", "θ"],
};

/** Tiny deterministic random, so glyphs sit in the same places on every render. */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  // Rounded, so the server and the browser print identical style values (no hydration mismatch).
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
}
const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Behind each unit: a giant outlined unit number that drifts with scroll
 * (parallax), and SAT glyphs (π, √x, ¶…) floating slowly on both sides of
 * the road, tinted by section. Purely decorative.
 */
function UnitBackdrop({ index, rw, height }: { index: number; rw: boolean; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const left = index % 2 === 1;
  const glyphs = GLYPHS[rw ? "RW" : "MATH"];
  const tone = rw ? "text-review" : "text-primary";
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 top-24 -z-10 overflow-hidden" style={{ height: height + 40 }}>
      <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(60%_55%_at_50%_45%,#000,transparent)]" />
      <m.span
        className={cn("unit-numeral absolute top-[28%] text-[150px] opacity-[0.16] sm:text-[220px] dark:opacity-[0.2]", left ? "left-[-2%] sm:left-[2%]" : "right-[-2%] sm:right-[2%]")}
        style={{ WebkitTextStrokeColor: rw ? "var(--review)" : "var(--primary)", ...(reduce ? {} : { y }) }}
      >
        {String(index).padStart(2, "0")}
      </m.span>
      {Array.from({ length: 8 }, (_, i) => {
        const side = i % 2 === 0 ? "left" : "right";
        const x = r2(3 + rand(index * 31 + i) * 22);
        const top = r2(8 + ((i + rand(index * 7 + i)) / 8) * 84);
        const size = r2(22 + rand(index * 13 + i) * 26);
        return (
          <span
            key={i}
            className={cn("path-glyph", tone)}
            style={
              {
                [side]: `${x}%`,
                top: `${top}%`,
                fontSize: size,
                opacity: r2(0.12 + rand(index * 5 + i) * 0.1),
                "--r": `${Math.round(rand(index * 3 + i) * 40 - 20)}deg`,
                "--dx": `${Math.round(rand(index + i * 11) * 16 - 8)}px`,
                "--t": `${7 + rand(index * 17 + i) * 6}s`,
                "--d": `${-rand(index * 19 + i) * 8}s`,
              } as React.CSSProperties
            }
          >
            {glyphs[(i + index) % glyphs.length]}
          </span>
        );
      })}
    </div>
  );
}

const KIND_ICON: Record<NodeKind, typeof Check> = { lesson: Star, review: RotateCcw, chest: Gift, test: Trophy };

function NodeButton({ node, unitSize, rw, dueReviews }: { node: NodeVM; unitSize: number; rw: boolean; dueReviews: number }) {
  const t = useTranslations("path");
  const reduce = useReducedMotion();
  const { launch, pending } = useStartDrill();
  const [open, setOpen] = useState(false);
  const current = node.state === "current";
  const locked = node.state === "locked";
  const done = node.state === "done";
  const size = current ? 76 : 64;

  const face = locked
    ? "bg-surface-2 text-muted-foreground border-2 border-border [--edge:var(--border)]"
    : node.kind === "chest"
      ? "bg-accent text-accent-foreground [--edge:color-mix(in_oklab,var(--accent),black_25%)]"
      : node.kind === "review"
        ? "bg-review text-primary-foreground [--edge:color-mix(in_oklab,var(--review),black_25%)]"
        : rw
          ? "bg-review text-primary-foreground [--edge:color-mix(in_oklab,var(--review),black_25%)]"
          : "bg-primary text-primary-foreground [--edge:var(--primary-edge)]";
  const Icon = locked ? (node.kind === "lesson" ? Lock : KIND_ICON[node.kind]) : done && node.kind === "lesson" ? Check : KIND_ICON[node.kind];

  function go() {
    setOpen(false);
    if (node.kind === "lesson") launch({ skills: [node.key], count: 10 });
    else if (node.kind === "chest") launch({ domains: [node.key], count: 10 });
    else if (node.kind === "test") launch({ domains: [node.key], count: 20, timed: true, feedback: "END" });
  }

  const title = node.kind === "lesson" ? node.title : node.kind === "chest" ? t("chest") : node.kind === "test" ? t("test") : t("reviewNode");
  const body = locked
    ? t("lockedBody")
    : node.kind === "lesson"
      ? node.mastery != null
        ? t("progress", { pct: Math.round(node.mastery * 100) })
        : t("notStarted")
      : node.kind === "chest"
        ? t("chestBody")
        : node.kind === "test"
          ? t("testBody")
          : t("reviewBody", { count: dueReviews });

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      {current && (
        <m.span
          className="pointer-events-none absolute -top-11 left-1/2 z-10 -translate-x-1/2 rounded-xl border-2 border-border bg-surface px-3 py-1 font-display text-xs font-extrabold tracking-wider text-primary uppercase shadow-sm"
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          {t("startBubble")}
          <span className="absolute -bottom-[6px] left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-border bg-surface" />
        </m.span>
      )}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`${title}${locked ? `, ${t("lockedTitle")}` : ""}`}
          className="group relative grid place-items-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
          style={{ width: size, height: size }}
        >
          {current && (
            <>
              <span aria-hidden className={cn("node-pulse absolute inset-0 rounded-full", rw ? "bg-review/40" : "bg-primary/40")} />
              <span aria-hidden className={cn("absolute -inset-[7px] rounded-full border-[5px]", rw ? "border-review/30" : "border-primary/30")} />
            </>
          )}
          <span
            className={cn(
              "relative grid size-full place-items-center rounded-full shadow-[0_6px_0_var(--edge)] transition-[transform,box-shadow] duration-100 group-active:translate-y-[4px] group-active:shadow-[0_2px_0_var(--edge)]",
              face,
            )}
          >
            <Icon className={cn("relative", current ? "size-8 fill-current" : "size-7")} strokeWidth={2.75} aria-hidden />
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <AnimatePresence>
        {open && (
          <PopoverPrimitive.Portal forceMount>
            <PopoverPrimitive.Content side="bottom" sideOffset={14} collisionPadding={16} asChild forceMount>
              <m.div
                className={cn("z-50 w-[260px] rounded-2xl border-2 p-4 shadow-lg outline-none", locked ? "border-border bg-surface" : rw || node.kind === "review" ? "border-review/40 bg-surface" : "border-primary/40 bg-surface")}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              >
                <p className="font-display text-base leading-snug font-extrabold">{title}</p>
                {node.lesson && <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{t("lesson", { i: node.lesson, n: unitSize })}</p>}
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                {done && node.kind === "lesson" && (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-correct-soft px-2 py-0.5 text-xs font-bold text-correct-ink">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                    {t("mastered")}
                  </p>
                )}
                {!locked && (
                  <div className="mt-4">
                    {node.kind === "review" ? (
                      <Button asChild className="w-full">
                        <Link href="/review">{t("review")}</Link>
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={go} disabled={pending} variant={done ? "outline" : "default"}>
                        {pending && <Loader2 className="animate-spin" aria-hidden />}
                        {done ? t("again") : t("start")}
                      </Button>
                    )}
                  </div>
                )}
                <PopoverPrimitive.Arrow className="fill-surface" width={14} height={7} />
              </m.div>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        )}
      </AnimatePresence>
    </PopoverPrimitive.Root>
  );
}

/* ---------- Right rail ---------- */

export interface RailData {
  score: number | null;
  history: number[];
  week: { label: string; state: "done" | "today" | "missed" | "future"; description: string }[];
  quests: { label: string; n: number; of: number; tone: "primary" | "correct" | "review" }[];
  weak: { key: string; label: string; pct: number }[];
  units: { index: number; title: string; done: number; total: number; section: "RW" | "MATH" }[];
}

export function Rail({ data, scoreSlot, questSlot }: { data: RailData; scoreSlot?: React.ReactNode; questSlot?: React.ReactNode }) {
  const t = useTranslations("path.rail");
  const tp = useTranslations("path");
  const { launch } = useStartDrill();
  const card = "w-[264px] shrink-0 rounded-3xl border border-border bg-surface p-4 shadow-sm lg:w-auto";
  return (
    <div className="swipe-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      {/* Score */}
      <div className={card}>
        <p className="mb-2 text-sm font-bold">{t("score")}</p>
        {data.score != null ? (
          <div className="flex items-center gap-3">
            <ScoreRing value={data.score} />
            <div className="min-w-0 flex-1">{data.history.length > 1 && <Spark points={data.history} />}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("noScore")}</p>
            {scoreSlot}
          </div>
        )}
      </div>

      {/* Week */}
      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold">{t("week")}</p>
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {data.week.filter((d) => d.state === "done").length}/{data.week.length}
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1">
          {data.week.map((d, i) => (
            <li key={i} className="flex flex-col items-center gap-1" title={d.description}>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full",
                  d.state === "done" ? "bg-accent-soft text-accent" : d.state === "today" ? "border-2 border-primary" : d.state === "missed" ? "bg-surface-2" : "bg-surface-2/60",
                )}
              >
                {d.state === "done" && <Flame className="size-4 fill-current" aria-hidden />}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">{d.label}</span>
              <span className="sr-only">{d.description}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Quests */}
      <div className={card}>
        <p className="mb-3 text-sm font-bold">{t("quests")}</p>
        <ul className="space-y-3">
          {data.quests.map((q) => {
            const doneQ = q.of > 0 ? q.n >= q.of : true;
            const pct = q.of > 0 ? Math.min(100, (q.n / q.of) * 100) : 100;
            return (
              <li key={q.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-[13px] font-semibold">
                  <span className="flex items-center gap-1.5">
                    {doneQ ? <Check className="size-3.5 text-correct-ink" strokeWidth={3} aria-hidden /> : <Zap className="size-3.5 text-muted-foreground" aria-hidden />}
                    {q.label}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.min(q.n, q.of)}/{q.of}
                  </span>
                </div>
                <span className="block h-2 overflow-hidden rounded-full bg-surface-2">
                  <m.span
                    className={cn("block h-full rounded-full", doneQ ? "bg-correct" : q.tone === "review" ? "bg-review" : "bg-primary")}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.2 }}
                  />
                </span>
              </li>
            );
          })}
        </ul>
        {questSlot && <div className="mt-4 [&>button]:w-full">{questSlot}</div>}
      </div>

      {/* Weak spots */}
      {data.weak.length > 0 && (
        <div className={card}>
          <p className="mb-3 text-sm font-bold">{t("weak")}</p>
          <div className="flex flex-wrap gap-1.5">
            {data.weak.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => launch({ skills: [w.key], count: 10 })}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary-soft"
              >
                {w.label} <span className="text-danger-ink tabular-nums">{w.pct}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mini unit map */}
      <div className={cn(card, "hidden lg:block")}>
        <p className="mb-2 text-sm font-bold">{tp("units")}</p>
        <ol className="space-y-1">
          {data.units.map((u) => (
            <li key={u.index}>
              <a href={`#unit-${u.index}`} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13px] font-semibold hover:bg-surface-2">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold text-primary-foreground", u.section === "RW" ? "bg-review" : "bg-primary", u.done === 0 && "opacity-45")}>
                  {u.index}
                </span>
                <span className="min-w-0 flex-1 truncate">{u.title}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {u.done}/{u.total}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const pct = (value - 400) / 1200;
  return (
    <span className="relative grid size-20 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={8} />
        <m.circle cx={40} cy={40} r={r} fill="none" stroke="var(--primary)" strokeWidth={8} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ type: "spring", stiffness: 60, damping: 16 }} />
      </svg>
      <span className="font-display text-lg font-extrabold tabular-nums">{value}</span>
    </span>
  );
}

function Spark({ points }: { points: number[] }) {
  const min = Math.min(...points) - 20;
  const max = Math.max(...points) + 20;
  const x = (i: number) => 4 + (i / (points.length - 1)) * 112;
  const y = (v: number) => 44 - ((v - min) / (max - min || 1)) * 40;
  const d = points.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ");
  const delta = points.at(-1)! - points[0]!;
  return (
    <div>
      {delta !== 0 && (
        <span className={cn("mb-1 inline-block rounded-md px-1.5 text-xs font-bold tabular-nums", delta > 0 ? "bg-correct-soft text-correct-ink" : "bg-danger-soft text-danger-ink")}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
      <svg viewBox="0 0 120 48" className="h-12 w-full overflow-visible" aria-hidden>
        <m.path d={d} fill="none" stroke="var(--primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
        <circle cx={x(points.length - 1)} cy={y(points.at(-1)!)} r={3.5} fill="var(--primary)" />
      </svg>
    </div>
  );
}
