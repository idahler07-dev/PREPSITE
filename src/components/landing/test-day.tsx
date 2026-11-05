"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m, useAnimationControls, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Bookmark, ChevronDown, Highlighter, MoreVertical, Rows3, Type, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ANSWER = 0;
const KEYS = ["A", "B", "C", "D"];
const ELIM_LABEL = "ABC";

/**
 * "Feels like test day": a working replica of the Bluebook screen with one
 * Reading and Writing question. Pick with a click or A–D, cross out with the
 * ABC tool, mark for review, drag the divider, then check (Enter).
 */
export function TestDay() {
  const t = useTranslations("landing.testday");
  const tools = t.raw("tools") as string[];
  const choices = t.raw("choices") as string[];
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });

  const [secs, setSecs] = useState(32 * 60 + 14);
  const [hideTimer, setHideTimer] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [crossed, setCrossed] = useState<number[]>([]);
  const [elim, setElim] = useState(false);
  const [marked, setMarked] = useState(false);
  const [result, setResult] = useState<"right" | "wrong" | null>(null);
  const [split, setSplit] = useState(50);
  const shake = useAnimationControls();

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [inView]);

  const check = useCallback(async () => {
    if (picked === null) return;
    if (picked === ANSWER) {
      setResult("right");
      if (!reduce) {
        const confetti = (await import("canvas-confetti")).default;
        const box = ref.current?.getBoundingClientRect();
        void confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 38,
          origin: box ? { x: (box.left + box.width * 0.75) / window.innerWidth, y: (box.top + box.height * 0.8) / window.innerHeight } : { y: 0.7 },
          colors: ["#2563EB", "#5B8CFF", "#F59E0B", "#16A34A", "#A78BFA"],
          disableForReducedMotion: true,
        });
      }
    } else {
      setResult("wrong");
      if (!reduce) void shake.start({ x: [0, -4, 4, -4, 4, -4, 0], transition: { duration: 0.36 } });
    }
  }, [picked, reduce, shake]);

  const choose = useCallback(
    (i: number) => {
      if (crossed.includes(i)) return;
      setPicked(i);
      setResult(null);
    },
    [crossed],
  );

  useEffect(() => {
    if (!inView) return;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      const idx = KEYS.indexOf(k);
      if (idx >= 0) {
        e.preventDefault();
        choose(idx);
      } else if (e.key === "Enter" && picked !== null && el?.tagName !== "BUTTON") {
        e.preventDefault();
        void check();
      } else if (k === "M") {
        setMarked((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, choose, check, picked]);

  function dragDivider(e: React.PointerEvent<HTMLButtonElement>) {
    const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => setSplit(Math.min(68, Math.max(32, ((ev.clientX - box.left) / box.width) * 100)));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const toolIcons = [Highlighter, Rows3, Type, MoreVertical];
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <section aria-labelledby="testday-title" className="mx-auto max-w-[1160px] px-4 py-20 sm:px-6 lg:py-28">
      <h2 id="testday-title" className="mb-10 text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
        {t("title")}
      </h2>
      <div ref={ref} className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_30px_70px_-35px_rgb(15_23_42/0.3)] dark:shadow-none">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 pt-3 pb-2 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold sm:text-sm">{t("section")}</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              {t("directions")}
              <ChevronDown className="size-3.5" aria-hidden />
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className={cn("font-display text-xl font-extrabold tabular-nums transition-opacity", hideTimer && "opacity-0", secs < 300 && "text-danger-ink")} aria-hidden={hideTimer}>
              {mm}:{ss}
            </span>
            <button type="button" onClick={() => setHideTimer((v) => !v)} className="rounded-full border border-border px-2.5 text-[11px] font-bold hover:bg-surface-2">
              {hideTimer ? t("show") : t("hide")}
            </button>
          </div>
          <div className="hidden justify-end gap-4 md:flex">
            {tools.map((label, i) => {
              const Icon = toolIcons[i] ?? MoreVertical;
              return (
                <span key={label} className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-muted-foreground">
                  <Icon className="size-4 text-foreground" aria-hidden />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
        <div aria-hidden className="h-[3px] bg-[repeating-linear-gradient(90deg,var(--foreground)_0_10px,transparent_10px_14px,var(--primary)_14px_24px,transparent_24px_28px)] opacity-80" />

        {/* Split panes */}
        <div className="relative flex flex-col md:flex-row">
          <div className="border-b border-border p-5 sm:p-8 md:border-b-0" style={{ flexBasis: `${split}%` }}>
            <p className="passage max-w-[60ch] text-[16px] sm:text-[17px]">
              {t.rich("passage", { hl: (c) => <mark className="rounded-sm bg-[var(--hl-yellow)] px-0.5 text-[var(--hl-text)]">{c}</mark> })}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("resize")}
            onPointerDown={dragDivider}
            className="group relative hidden w-[3px] shrink-0 cursor-col-resize bg-foreground/80 md:block"
          >
            <span className="absolute top-1/2 left-1/2 grid h-9 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md bg-foreground text-background transition-transform group-hover:scale-110">
              <span className="h-4 w-[2px] rounded bg-background/70" />
            </span>
          </button>
          <m.div animate={shake} className="flex-1 p-5 sm:p-8">
            <div className="mb-4 flex items-center gap-3 border-b-2 border-dashed border-border pb-2 bg-surface-2/50 -mx-2 px-2 pt-1 rounded-t-md">
              <span className="grid size-8 place-items-center bg-foreground font-display text-sm font-extrabold text-background">{t("number")}</span>
              <button type="button" onClick={() => setMarked((v) => !v)} aria-pressed={marked} className={cn("flex items-center gap-1.5 text-[13px] font-semibold", marked ? "text-review" : "text-foreground")}>
                <Bookmark className={cn("size-4 transition-transform", marked && "scale-110 fill-current")} aria-hidden />
                {t("mark")}
              </button>
              <button
                type="button"
                onClick={() => setElim((v) => !v)}
                aria-pressed={elim}
                className={cn("ms-auto rounded-md border px-1.5 text-[11px] font-extrabold line-through decoration-2", elim ? "border-primary bg-primary text-primary-foreground" : "border-foreground")}
              >
                {ELIM_LABEL}
              </button>
            </div>
            <p className="mb-4 text-[15px] font-medium">{t("prompt")}</p>
            <ul className="space-y-2.5">
              {choices.map((c, i) => {
                const isPicked = picked === i;
                const isCrossed = crossed.includes(i);
                const showRight = result === "right" && i === ANSWER;
                const showWrong = result === "wrong" && isPicked;
                return (
                  <li key={c} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => choose(i)}
                      aria-pressed={isPicked}
                      disabled={isCrossed}
                      className={cn(
                        "relative flex flex-1 items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-start text-[14px] transition-[border-color,background-color,transform] duration-150 active:translate-y-[1px]",
                        showRight ? "border-correct bg-correct-soft" : showWrong ? "border-danger bg-danger-soft" : isPicked ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/40",
                        isCrossed && "opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                          showRight ? "border-correct bg-correct text-white" : showWrong ? "border-danger bg-danger text-white" : isPicked ? "border-primary bg-primary text-primary-foreground" : "border-foreground/70",
                        )}
                      >
                        {showRight ? <DrawCheck /> : showWrong ? <X className="size-3.5" strokeWidth={3.5} aria-hidden /> : KEYS[i]}
                      </span>
                      <span className={cn(isCrossed && "line-through decoration-2")}>{c}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {elim && (
                        <m.button
                          type="button"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 32 }}
                          exit={{ opacity: 0, width: 0 }}
                          onClick={() => {
                            setCrossed((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]));
                            if (picked === i) setPicked(null);
                          }}
                          aria-label={t("elim", { key: KEYS[i] ?? "" })}
                          className="grid h-7 shrink-0 place-items-center overflow-hidden rounded-full border border-foreground/60 text-[11px] font-bold line-through"
                        >
                          {KEYS[i]}
                        </m.button>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => (result ? (setResult(null), setPicked(null), setCrossed([])) : void check())}
                disabled={picked === null && !result}
                className="rounded-full border-2 border-primary px-4 py-1.5 text-[13px] font-bold text-primary transition-colors hover:bg-primary-soft disabled:opacity-50"
              >
                {result ? t("again") : t("check")}
              </button>
              <AnimatePresence mode="wait" initial={false}>
                {result ? (
                  <m.span
                    key={result}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn("text-[14px] font-bold", result === "right" ? "text-correct-ink" : "text-danger-ink")}
                    role="status"
                  >
                    {result === "right" ? t("correct") : t("wrong")}
                  </m.span>
                ) : (
                  <m.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-muted-foreground">
                    {t("hint")}
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/** A check mark that draws itself. */
function DrawCheck() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
      <m.path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, ease: "easeOut" }} />
    </svg>
  );
}

