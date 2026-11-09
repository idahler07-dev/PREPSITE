"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { Coffee, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { Deer } from "@/components/mascot/deer";
import { saveFocusSession } from "@/server/actions/focus";
import { useReducedMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/utils";

const LENGTHS = [15, 25, 50] as const;
const BREAK_MIN = 5;
const STORE = "willoprep:focus";

type Phase = "idle" | "running" | "paused" | "done" | "break";
/** Timer state is kept as timestamps so it stays right in background tabs and across reloads. */
type Saved = { phase: Phase; minutes: number; label: string; startedAt: number | null; accumulated: number; runningSince: number | null };

const initial = (minutes = 25): Saved => ({ phase: "idle", minutes, label: "", startedAt: null, accumulated: 0, runningSince: null });

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function store(s: Saved) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* private mode: the timer still works for this visit */
  }
}

const elapsed = (s: Saved, now: number) => s.accumulated + (s.runningSince ? (now - s.runningSince) / 1000 : 0);
const mmss = (sec: number) => {
  const v = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

/**
 * The focus timer: pick a length and what you're working on, start, pause,
 * stop early or finish. Finished and stopped sessions (a minute or more) are
 * saved and count toward study time. Space starts and pauses.
 */
export function FocusTimer({ tasks }: { tasks: string[] }) {
  const t = useTranslations("focus");
  const reduce = useReducedMotionSafe();
  const [s, setS] = useState<Saved>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [custom, setCustom] = useState("");
  const [, startSaving] = useTransition();
  const restored = useRef(false);

  // Restore a session that was running before a reload.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const saved = load();
    if (saved && saved.phase !== "idle") setS(saved);
  }, []);

  const update = useCallback((next: Saved) => {
    setS(next);
    store(next);
  }, []);

  const ticking = s.phase === "running" || s.phase === "break";
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);

  const total = (s.phase === "break" ? BREAK_MIN : s.minutes) * 60;
  const spent = elapsed(s, now);
  const left = total - spent;

  const save = useCallback(
    (state: Saved, completed: boolean, focusedSeconds: number) => {
      if (!state.startedAt) return;
      const payload = { startedAt: new Date(state.startedAt).toISOString(), plannedMinutes: state.minutes, focusedSeconds: Math.round(focusedSeconds), completed, label: state.label || undefined };
      startSaving(async () => {
        await saveFocusSession(payload);
      });
    },
    [],
  );

  // Finish when the time is up.
  useEffect(() => {
    if (!ticking || left > 0) return;
    if (s.phase === "running") {
      save(s, true, s.minutes * 60);
      update({ ...s, phase: "done", accumulated: s.minutes * 60, runningSince: null });
    } else update(initial(s.minutes));
  }, [left, ticking, s, save, update]);

  // Show the time left in the tab title while running.
  useEffect(() => {
    if (!ticking) return;
    const before = document.title;
    document.title = `${mmss(left)} · ${s.phase === "break" ? t("break") : t("focus")}`;
    return () => {
      document.title = before;
    };
  }, [ticking, left, s.phase, t]);

  const label = s.label;
  const start = () => {
    const at = Date.now();
    setNow(at);
    update({ ...s, phase: "running", startedAt: s.startedAt ?? at, runningSince: at, label: label || custom.trim() });
  };
  const pause = () => update({ ...s, phase: "paused", accumulated: elapsed(s, Date.now()), runningSince: null });
  const stop = () => {
    const done = elapsed(s, Date.now());
    save(s, false, done);
    update(initial(s.minutes));
  };
  const reset = () => update(initial(s.minutes));
  const takeBreak = () => {
    const at = Date.now();
    setNow(at);
    update({ ...initial(s.minutes), phase: "break", startedAt: at, runningSince: at });
  };

  // Space toggles start / pause (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, button, [contenteditable=true]")) return;
      e.preventDefault();
      if (s.phase === "running") pause();
      else if (s.phase === "idle" || s.phase === "paused") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const r = 116;
  const circ = 2 * Math.PI * r;
  const frac = s.phase === "idle" ? 0 : Math.min(1, spent / total);
  const editable = s.phase === "idle";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
      {/* Ring */}
      <div className="relative mx-auto aspect-square w-full max-w-[320px]">
        <svg viewBox="0 0 260 260" className="size-full -rotate-90" aria-hidden>
          <circle cx="130" cy="130" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
          <circle
            cx="130"
            cy="130"
            r={r}
            fill="none"
            stroke={s.phase === "break" ? "var(--accent)" : "var(--primary)"}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - frac)}
            className={cn(!reduce && "transition-[stroke-dashoffset] duration-300 ease-linear")}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{s.phase === "break" ? t("break") : s.phase === "done" ? t("doneShort") : t("focus")}</p>
            <p className="mt-1 font-display text-6xl font-extrabold tracking-[-0.04em] tabular-nums sm:text-7xl" role="timer" aria-live="off">
              {s.phase === "done" ? mmss(0) : mmss(s.phase === "idle" ? s.minutes * 60 : left)}
            </p>
            {label && s.phase !== "idle" && <p className="mx-auto mt-2 max-w-[200px] truncate text-sm text-muted-foreground">{label}</p>}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-6">
        <AnimatePresence mode="wait" initial={false}>
          {s.phase === "done" ? (
            <m.div key="done" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-4 rounded-[var(--radius-panel)] border border-border bg-surface p-5">
              <Deer pose="cheer" className="w-20" />
              <div className="flex-1">
                <p className="font-display text-xl font-extrabold">{t("done", { minutes: s.minutes })}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("doneBody")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={takeBreak}>
                    <Coffee aria-hidden />
                    {t("takeBreak", { minutes: BREAK_MIN })}
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    {t("another")}
                  </Button>
                </div>
              </div>
            </m.div>
          ) : (
            <m.div key="setup" initial={false} animate={{ opacity: 1 }} className="space-y-6">
              <fieldset disabled={!editable} className="space-y-2">
                <legend className="text-sm font-semibold">{t("length")}</legend>
                <LiquidGroup activeKey={String(s.minutes)} className="inline-flex rounded-full bg-surface-2 p-1" indicatorClassName="rounded-full bg-surface shadow-[var(--elev-sm)]">
                  {LENGTHS.map((len) => (
                    <button
                      key={len}
                      type="button"
                      data-liquid-key={String(len)}
                      aria-pressed={s.minutes === len}
                      onClick={() => update({ ...s, minutes: len })}
                      className={cn(
                        "relative h-10 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed",
                        s.minutes === len ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t("minutes", { n: len })}
                    </button>
                  ))}
                </LiquidGroup>
              </fieldset>

              <div className="space-y-2">
                <label htmlFor="focus-task" className="text-sm font-semibold">
                  {t("workingOn")}
                </label>
                {tasks.length > 0 && editable && (
                  <div className="flex flex-wrap gap-2">
                    {tasks.map((task) => (
                      <button
                        key={task}
                        type="button"
                        onClick={() => update({ ...s, label: s.label === task ? "" : task })}
                        aria-pressed={s.label === task}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          s.label === task ? "border-primary bg-primary-soft font-semibold text-primary" : "border-border hover:border-primary/40",
                        )}
                      >
                        {task}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  id="focus-task"
                  value={editable ? (s.label && tasks.includes(s.label) ? "" : custom) : label}
                  onChange={(e) => {
                    setCustom(e.target.value.slice(0, 120));
                    if (s.label && tasks.includes(s.label)) update({ ...s, label: "" });
                  }}
                  disabled={!editable}
                  placeholder={t("workingOnPlaceholder")}
                  className="h-11 w-full rounded-[var(--radius-input)] border border-input bg-surface px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring disabled:opacity-60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {s.phase === "running" ? (
                  <Button size="lg" onClick={pause}>
                    <Pause aria-hidden />
                    {t("pause")}
                  </Button>
                ) : s.phase === "break" ? (
                  <Button size="lg" variant="outline" onClick={reset}>
                    <RotateCcw aria-hidden />
                    {t("skipBreak")}
                  </Button>
                ) : (
                  <Button size="lg" onClick={start}>
                    <Play aria-hidden className="fill-current" />
                    {s.phase === "paused" ? t("resume") : t("start")}
                  </Button>
                )}
                {(s.phase === "running" || s.phase === "paused") && (
                  <Button size="lg" variant="outline" onClick={stop}>
                    <Square aria-hidden />
                    {t("stop")}
                  </Button>
                )}
                <span className="ms-1 text-xs text-muted-foreground">{t("spaceHint")}</span>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
