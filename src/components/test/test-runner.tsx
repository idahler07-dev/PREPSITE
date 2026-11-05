"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, Highlighter, Loader2, LogOut, MessageCircle, NotebookPen, Sparkles, Wifi, WifiOff } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { spring } from "@/lib/motion";
import { DrawCheck, DrawX } from "./answer-effects";
import { useRouter } from "@/i18n/navigation";
import type { RunnerItem, RunnerState } from "@/server/attempts/service";
import { testStructure } from "@/config/test-structure";
import { validateSprInput } from "@/lib/questions/spr";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichText } from "@/components/content/rich-text";
import { cn } from "@/lib/utils";
import { MascotCheerPop } from "@/components/mascot/celebrate";
import { useAutosave, type SaveStatus } from "./use-autosave";
import { CountdownTimer } from "./timer";
import { ChoiceList } from "./choice-list";
import { SprInput } from "./spr-input";
import { Legend, NavigatorPopover, QuestionGrid } from "./navigator";
import { ReportDialog } from "./report-dialog";
import { CalculatorPanel } from "./calculator";
import { ReferenceSheet } from "./reference-sheet";
import { HighlightablePassage, type Highlight, type HighlightColor } from "./highlightable";
import { LineReader } from "./line-reader";
import { playSfx } from "@/lib/sfx";
import { TestToolbar } from "./test-toolbar";
import { QuestionHeader } from "./question-header";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { AiTutor } from "@/components/tutor/ai-tutor";
import { Owl } from "@/components/mascot/owl";
import { LessonCheckBar, LessonHeader } from "./lesson-chrome";

type Annotations = Record<string, { highlights: Highlight[]; note: string | null }>;
const HL_COLORS: HighlightColor[] = ["yellow", "blue", "pink"];

const ZOOM_STEPS = [0.9, 1, 1.15, 1.3, 1.5];

type Feedback = NonNullable<RunnerItem["feedback"]>;

export function TestRunner({
  initial,
  annotations: initialAnnotations = {},
  desmosKey = null,
  desmosDemoKey = false,
  aiEnabled = false,
}: {
  initial: RunnerState;
  annotations?: Annotations;
  desmosKey?: string | null;
  /** The key is Desmos's public demo key (development only). */
  desmosDemoKey?: boolean;
  aiEnabled?: boolean;
}) {
  const t = useTranslations("test");
  const tx = useTranslations("taxonomy");
  const c = useTranslations("common");
  const router = useRouter();
  const attemptId = initial.id;
  const moduleId = initial.module.id;
  const lastPosKey = `last:${attemptId}:${moduleId}`;

  const [items, setItems] = useState<RunnerItem[]>(initial.items);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<"question" | "review">("question");
  const [navOpen, setNavOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [annotations, setAnnotations] = useState<Annotations>(initialAnnotations);
  const [highlighterOn, setHighlighterOn] = useState(false);
  const [hlColor, setHlColor] = useState<HighlightColor>("yellow");
  const [lineReader, setLineReader] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcSide, setCalcSide] = useState<"left" | "right">("left");
  // Set when the page was reloaded so the calculator could run (see CalculatorPanel).
  const [reloadedForCalc, setReloadedForCalc] = useState(false);
  const reopenCalcKey = `reopen-calc:${attemptId}`;
  const [refOpen, setRefOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  // Bluebook's ABC tool and the draggable divider between passage and question (percent of the width).
  const [elimMode, setElimMode] = useState(false);
  const reduceMotion = useReducedMotion();
  const [split, setSplit] = useState(50);
  const annotationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const submittedRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  const goToResults = useCallback(() => router.replace(`/attempts/${attemptId}`), [router, attemptId]);

  const submitNow = useCallback(
    async (reason: "user" | "time") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      await autosave.flush();
      try {
        const res = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { completed: boolean };
        try {
          localStorage.removeItem(lastPosKey);
        } catch {}
        if (reason === "time") toast.info(t("timer.timeUp"));
        if (body.completed) goToResults();
        else router.refresh();
      } catch {
        submittedRef.current = false;
        setSubmitting(false);
        toast.error(c("networkError"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptId, moduleId, lastPosKey, goToResults, router, t, c],
  );

  const autosave = useAutosave(attemptId, moduleId, (reason) => {
    if (reason === "TIME_UP") void submitNow("time");
    else goToResults();
  });

  // Restore unsent local changes and the last question viewed.
  useEffect(() => {
    const leftovers = autosave.restored();
    if (leftovers.length) {
      setItems((prev) =>
        prev.map((it) => {
          const u = leftovers.find((x) => x.position === it.position);
          if (!u) return it;
          return {
            ...it,
            ...(u.answer !== undefined && !it.feedback ? { answer: u.answer } : {}),
            ...(u.flagged !== undefined ? { flagged: u.flagged } : {}),
            ...(u.eliminated !== undefined ? { eliminated: u.eliminated } : {}),
          };
        }),
      );
    }
    try {
      const last = Number(localStorage.getItem(lastPosKey));
      if (Number.isInteger(last) && last >= 0 && last < initial.items.length) setIndex(last);
      else {
        const firstOpen = initial.items.findIndex((i) => !i.answer);
        if (firstOpen > 0) setIndex(firstOpen);
      }
      setZoom(Number(localStorage.getItem("test-zoom")) || 1);
      if (localStorage.getItem("calc-side") === "right") setCalcSide("right");
      if (sessionStorage.getItem(reopenCalcKey)) {
        sessionStorage.removeItem(reopenCalcKey);
        setReloadedForCalc(true);
        setCalcOpen(true);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    try {
      localStorage.setItem(lastPosKey, String(index));
    } catch {}
  }, [index, view, lastPosKey]);

  // Time on the current question, counted only while the page is visible.
  const timeAcc = useRef(0);
  const lastTick = useRef<number>(0);
  // Time per question including what's not yet saved, for the feedback strip.
  const spent = useRef<Record<number, number>>(Object.fromEntries(initial.items.map((i) => [i.position, i.timeSpentMs])));
  const [checkedTime, setCheckedTime] = useState<Record<number, number>>({});
  useEffect(() => {
    lastTick.current = performance.now();
    timeAcc.current = 0;
    const pos = items[index]?.position;
    const commit = () => {
      if (pos === undefined || timeAcc.current < 500) return;
      spent.current[pos] = (spent.current[pos] ?? 0) + Math.round(timeAcc.current);
      autosave.queue({ position: pos, timeDeltaMs: Math.round(timeAcc.current) });
      timeAcc.current = 0;
    };
    const id = setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === "visible" && view === "question") timeAcc.current += Math.min(now - lastTick.current, 2000);
      lastTick.current = now;
      if (timeAcc.current >= 15_000) commit();
    }, 1000);
    return () => {
      clearInterval(id);
      commit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, view]);

  const saveAnnotation = useCallback(
    (questionId: string, patch: Partial<Annotations[string]>) => {
      setAnnotations((prev) => {
        const next = { highlights: [], note: null, ...prev[questionId], ...patch };
        clearTimeout(annotationTimers.current[questionId]);
        annotationTimers.current[questionId] = setTimeout(() => {
          void fetch(`/api/attempts/${attemptId}/annotations`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, ...next }),
          }).catch(() => toast.error(c("networkError")));
        }, 600);
        return { ...prev, [questionId]: next };
      });
    },
    [attemptId, c],
  );

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => toast.error(t("tools.fullscreenFailed")));
  };

  const immediate = initial.feedbackMode === "IMMEDIATE";
  // Untimed practice with checking (Path lessons, drills, review) gets the lesson screen (brief §7); tests keep Bluebook (§8).
  const lessonMode = immediate && initial.kind !== "MOCK" && !initial.module.deadline && !initial.returnTo;
  const item = items[index]!;
  const isMath = (initial.module.section ?? item.section) === "MATH";
  const annotation = annotations[item.questionId];
  const update = useCallback(
    (position: number, patch: Partial<Pick<RunnerItem, "answer" | "flagged" | "eliminated">>) => {
      setItems((prev) => prev.map((it) => (it.position === position ? { ...it, ...patch } : it)));
      autosave.queue({ position, ...patch });
    },
    [autosave],
  );

  const selectChoice = (key: string) => {
    if (item.feedback) return;
    if (initial.feedbackMode === "IMMEDIATE") playSfx("select");
    // Choosing a crossed-out answer un-crosses it.
    update(item.position, { answer: key, ...(item.eliminated.includes(key) ? { eliminated: item.eliminated.filter((k) => k !== key) } : {}) });
  };
  const toggleEliminate = (key: string) => {
    const struck = item.eliminated.includes(key);
    const eliminated = struck ? item.eliminated.filter((k) => k !== key) : [...item.eliminated, key];
    update(item.position, { eliminated, ...(!struck && item.answer === key ? { answer: null } : {}) });
  };
  const toggleFlag = () => update(item.position, { flagged: !item.flagged });

  async function check() {
    if (!item.answer || item.feedback) return;
    if (item.type === "SPR" && validateSprInput(item.answer)) return;
    setChecking(true);
    try {
      if (!(await autosave.flush())) throw new Error("save");
      const res = await fetch(`/api/attempts/${attemptId}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, position: item.position }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const feedback = (await res.json()) as Feedback;
      setCheckedTime((prev) => ({ ...prev, [item.position]: (spent.current[item.position] ?? 0) + timeAcc.current }));
      setItems((prev) => prev.map((it) => (it.position === item.position ? { ...it, feedback } : it)));
      playSfx(feedback.isCorrect ? "correct" : "incorrect");
    } catch {
      toast.error(c("networkError"));
    } finally {
      setChecking(false);
    }
  }

  function lessonContinue() {
    if (index === items.length - 1) void submitNow("user");
    else go(index + 1);
  }
  const checkedCount = items.filter((it) => it.feedback).length;
  const combo = (() => {
    let n = 0;
    for (const it of items) {
      if (!it.feedback) continue;
      n = it.feedback.isCorrect ? n + 1 : 0;
    }
    return n;
  })();

  const go = useCallback(
    (i: number) => {
      setView("question");
      setIndex(Math.max(0, Math.min(items.length - 1, i)));
      void autosave.flush();
    },
    [items.length, autosave],
  );
  const next = () => (index === items.length - 1 ? setView("review") : go(index + 1));
  const prev = () => (view === "review" ? setView("question") : go(index - 1));

  // Keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=dialog]") || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (view === "question" && item.type === "MCQ" && ["a", "b", "c", "d", "1", "2", "3", "4"].includes(k)) {
        const key = "abcd".includes(k) ? k.toUpperCase() : "ABCD"[Number(k) - 1]!;
        if (item.choices.some((ch) => ch.key === key)) {
          e.preventDefault();
          if (e.shiftKey) toggleEliminate(key);
          else selectChoice(key);
        }
      } else if (k === "enter" && view === "question" && immediate) {
        if (target.closest("button, a")) return;
        e.preventDefault();
        if (item.feedback) {
          if (lessonMode) lessonContinue();
        } else void check();
      } else if (k === "e" && !lessonMode && item.type === "MCQ") {
        e.preventDefault();
        setElimMode((x) => !x);
      } else if (k === "arrowright" || k === "n") {
        if (lessonMode && !item.feedback) return;
        e.preventDefault();
        if (lessonMode) lessonContinue();
        else next();
      } else if (k === "arrowleft" || k === "p") {
        e.preventDefault();
        prev();
      } else if (k === "m") {
        e.preventDefault();
        toggleFlag();
      } else if (k === "h" && item.passageHtml) {
        e.preventDefault();
        setHighlighterOn((x) => !x);
      } else if (k === "l") {
        e.preventDefault();
        setLineReader((x) => !x);
      } else if (k === "c" && isMath) {
        e.preventDefault();
        setCalcOpen((x) => !x);
      } else if (k === "r" && isMath) {
        e.preventDefault();
        setRefOpen(true);
      } else if (k === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (k === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const navItems = useMemo(() => items.map((it) => ({ answered: !!it.answer, flagged: it.flagged })), [items]);
  const unanswered = navItems.filter((n) => !n.answered).length;
  const marked = navItems.filter((n) => n.flagged).length;
  const title =
    initial.kind === "DRILL" || !initial.module.section
      ? t("drillTitle")
      : t("moduleTitle", { section: tx(`sections.${initial.module.section}`), module: initial.module.moduleNumber ?? 1 });

  const setZoomLevel = (dir: 1 | -1) => {
    const i = ZOOM_STEPS.findIndex((z) => z >= zoom);
    const nextZoom = ZOOM_STEPS[Math.max(0, Math.min(ZOOM_STEPS.length - 1, (i === -1 ? 1 : i) + dir))]!;
    setZoom(nextZoom);
    try {
      localStorage.setItem("test-zoom", String(nextZoom));
    } catch {}
  };

  if (lessonMode && view === "question") {
    const fb = item.feedback;
    const barState = fb ? (fb.isCorrect ? "right" : "wrong") : item.answer ? "ready" : "empty";
    const owlPose = fb ? (fb.isCorrect ? "correct" : "oops") : "thinking";
    const wrong = !!fb && !fb.isCorrect;
    return (
      <div className="flex h-dvh flex-col bg-background">
        <LessonHeader
          done={checkedCount}
          total={items.length}
          combo={combo}
          onClose={() => setConfirmExit(true)}
          tools={
            <TestToolbar
              showSound
              isMath={isMath}
              calcOpen={calcOpen}
              onCalculator={() => setCalcOpen((x) => !x)}
              onReference={() => setRefOpen(true)}
              lineReader={lineReader}
              onLineReader={() => setLineReader((x) => !x)}
              fullscreen={fullscreen}
              onFullscreen={toggleFullscreen}
              canZoomIn={zoom < ZOOM_STEPS.at(-1)!}
              canZoomOut={zoom > ZOOM_STEPS[0]!}
              onZoom={setZoomLevel}
              onShortcuts={() => setShortcutsOpen(true)}
            />
          }
        />
        <div className="flex min-h-0 flex-1">
          {isMath && (
            <CalculatorPanel
              open={calcOpen}
              onClose={() => setCalcOpen(false)}
              desmosKey={desmosKey}
              demoKey={desmosDemoKey}
              attemptId={attemptId}
              initialState={initial.calculatorState}
              side={calcSide}
              onNeedsReload={null}
              onSideChange={setCalcSide}
            />
          )}
          <main ref={mainRef} id="main" className="min-h-0 min-w-0 flex-1 overflow-y-auto" style={{ fontSize: `${zoom}rem` }}>
            <m.div
              key={item.position}
              className="mx-auto w-full max-w-[720px] space-y-6 px-4 pt-14 pb-8 sm:px-6"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={spring.soft}
            >
              <div className="relative rounded-3xl border-2 border-border bg-surface p-5 sm:p-6">
                <div className="pointer-events-none absolute -top-[54px] right-5 w-[80px]">
                  <Owl pose={owlPose} className="w-full" />
                </div>
                {item.passageHtml && <RichText html={item.passageHtml} className="passage mb-4 border-b border-border pb-4" />}
                <RichText html={item.stemHtml} className="q-stem font-medium" />
              </div>
              <m.div
                key={wrong ? "wrong" : "open"}
                initial={false}
                animate={wrong && !reduceMotion ? { x: [0, -4, 4, -4, 4, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.36 }}
              >
                {item.type === "MCQ" ? (
                  <ChoiceList
                    variant="lesson"
                    name={`q-${item.position}`}
                    choices={item.choices}
                    value={item.answer}
                    eliminated={item.eliminated}
                    disabled={!!fb}
                    correctAnswers={fb?.correctAnswers}
                    onSelect={selectChoice}
                    onToggleEliminate={toggleEliminate}
                  />
                ) : (
                  <SprInput value={item.answer ?? ""} onChange={(v) => update(item.position, { answer: v || null })} disabled={!!fb} />
                )}
              </m.div>
            </m.div>
          </main>
        </div>
        <LessonCheckBar
          key={item.position}
          state={barState}
          answer={fb?.correctAnswers.join(", ") ?? ""}
          explanationHtml={fb?.explanationHtml ?? null}
          rationaleHtml={fb?.rationaleHtml ?? null}
          checking={checking || submitting}
          last={index === items.length - 1}
          attemptId={attemptId}
          questionId={item.questionId}
          canCheck={!!item.answer && !(item.type === "SPR" && !!validateSprInput(item.answer ?? ""))}
          onCheck={() => void check()}
          onContinue={lessonContinue}
        />
        <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("exitConfirm.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("exitConfirm.body")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("exitConfirm.stay")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  await autosave.flush();
                  router.push("/sat");
                }}
              >
                {t("exitConfirm.leave")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {lineReader && <LineReader />}
        {isMath && <ReferenceSheet open={refOpen} onOpenChange={setRefOpen} />}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar: exit and title | timer | tools. The timer stays centered. */}
      <header className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b glass px-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)} aria-label={initial.returnTo ? t("backToBank") : t("tools.exit")} className="shrink-0">
            {initial.returnTo ? <ChevronLeft aria-hidden /> : <LogOut aria-hidden />}
            <span className="hidden sm:inline">{initial.returnTo ? t("backToBank") : t("exit")}</span>
          </Button>
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-sm font-bold">{title}</h1>
            <Popover>
              <PopoverTrigger className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                {t("directions")}
                <ChevronDown className="size-3.5" aria-hidden />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96 text-sm leading-relaxed">
                {t(`directionsBody.${isMath ? "MATH" : "RW"}`)}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          {initial.module.deadline && (
            <CountdownTimer
              deadline={initial.module.deadline}
              serverNow={initial.serverNow}
              warningSec={testStructure.warningSec}
              onExpire={() => void submitNow("time")}
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-1">
          <span className="md:hidden">
            <SaveIndicator status={autosave.status} compact />
          </span>
          <TestToolbar
            showSound={immediate}
            isMath={isMath}
            calcOpen={calcOpen}
            onCalculator={() => setCalcOpen((x) => !x)}
            onReference={() => setRefOpen(true)}
            lineReader={lineReader}
            onLineReader={() => setLineReader((x) => !x)}
            fullscreen={fullscreen}
            onFullscreen={toggleFullscreen}
            canZoomIn={zoom < ZOOM_STEPS.at(-1)!}
            canZoomOut={zoom > ZOOM_STEPS[0]!}
            onZoom={setZoomLevel}
            onShortcuts={() => setShortcutsOpen(true)}
          />
        </div>
      </header>
      {/* Bluebook's dashed rule, with a thin bar for how many questions are answered. */}
      <div aria-hidden className="relative h-[3px] shrink-0 bg-[repeating-linear-gradient(90deg,var(--foreground)_0_10px,transparent_10px_14px,var(--primary)_14px_24px,transparent_24px_28px)] opacity-80">
        <m.span className="absolute inset-y-0 left-0 bg-primary" initial={false} animate={{ width: `${(navItems.filter((n) => n.answered).length / items.length) * 100}%` }} transition={spring.soft} />
      </div>

      {/* Main */}
      {/* One scroll area on phones; side-by-side panes that scroll separately on large screens. */}
      <div className="flex min-h-0 flex-1">
      {isMath && (
        <CalculatorPanel
          open={calcOpen}
          onClose={() => setCalcOpen(false)}
          desmosKey={desmosKey}
          demoKey={desmosDemoKey}
          attemptId={attemptId}
          initialState={initial.calculatorState}
          side={calcSide}
          onNeedsReload={
            reloadedForCalc
              ? null
              : () => {
                  try {
                    sessionStorage.setItem(reopenCalcKey, "1");
                  } catch {}
                  void autosave.flush().then(() => window.location.reload());
                }
          }
          onSideChange={(side) => {
            setCalcSide(side);
            try {
              localStorage.setItem("calc-side", side);
            } catch {}
          }}
        />
      )}
      <main ref={mainRef} id="main" className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-section-tint lg:overflow-hidden" style={{ fontSize: `${zoom}rem` }}>
        {view === "review" ? (
          <div className="mx-auto h-full max-w-3xl space-y-6 overflow-y-auto p-6">
            <h2 className="text-2xl font-bold">{t("review.title")}</h2>
            <p className="text-muted-foreground">{t("review.body")}</p>
            <div className="flex flex-wrap gap-6 text-sm">
              <span>{t("review.unansweredCount", { count: unanswered })}</span>
              <span>{t("review.markedCount", { count: marked })}</span>
            </div>
            <Legend />
            <QuestionGrid items={navItems} current={null} onGo={go} />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setView("question")}>
                {t("review.back")}
              </Button>
              <Button onClick={() => setConfirmSubmit(true)} disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" aria-hidden />}
                {immediate ? t("finish") : t("review.submit")}
              </Button>
            </div>
          </div>
        ) : (
          // Keyed by question so both panes start at the top for each question.
          <div
            key={item.position}
            className={cn("grid grid-cols-[minmax(0,1fr)] lg:h-full", item.passageHtml && "lg:grid-cols-[minmax(0,var(--split))_12px_minmax(0,1fr)]")}
            style={{ ["--split" as string]: `${split}%` }}
          >
            {item.passageHtml && (
              <section aria-label={t("passage")} className="border-b bg-surface px-5 py-4 sm:p-6 lg:overflow-y-auto lg:border-b-0">
                <div className="mb-3 flex flex-wrap items-center gap-1">
                  <Button variant={highlighterOn ? "secondary" : "ghost"} size="sm" onClick={() => setHighlighterOn((x) => !x)} aria-pressed={highlighterOn}>
                    <Highlighter aria-hidden /> <span className="max-sm:sr-only">{highlighterOn ? t("tools.highlighterOn") : t("tools.highlighter")}</span>
                  </Button>
                  {highlighterOn && (
                    <div role="radiogroup" aria-label={t("tools.highlightColor")} className="flex gap-1">
                      {HL_COLORS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          role="radio"
                          aria-checked={hlColor === col}
                          aria-label={t(`tools.colors.${col}`)}
                          onClick={() => setHlColor(col)}
                          className={cn("hl-swatch size-6 rounded-full border-2", `hl-${col}`, hlColor === col ? "border-foreground" : "border-transparent")}
                        />
                      ))}
                    </div>
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="ms-auto">
                        <NotebookPen aria-hidden /> <span className="max-sm:sr-only">{annotation?.note ? t("tools.editNote") : t("tools.addNote")}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80">
                      <label htmlFor={`note-${item.questionId}`} className="mb-1 block text-sm font-medium">
                        {t("tools.note")}
                      </label>
                      <Textarea
                        id={`note-${item.questionId}`}
                        defaultValue={annotation?.note ?? ""}
                        maxLength={2000}
                        rows={5}
                        onChange={(e) => saveAnnotation(item.questionId, { note: e.target.value || null })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{t("tools.noteHelp")}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                {highlighterOn && <p className="sr-only">{t("tools.highlighterHelp")}</p>}
                <HighlightablePassage
                  html={item.passageHtml}
                  className="passage"
                  highlights={annotation?.highlights ?? []}
                  enabled={highlighterOn}
                  color={hlColor}
                  onChange={(highlights) => saveAnnotation(item.questionId, { highlights })}
                />
              </section>
            )}
            {item.passageHtml && (
              <button
                type="button"
                aria-label={t("resizePanes")}
                onPointerDown={(e) => {
                  const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const move = (ev: PointerEvent) => setSplit(Math.min(70, Math.max(30, ((ev.clientX - box.left) / box.width) * 100)));
                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") setSplit((v) => Math.max(30, v - 5));
                  if (e.key === "ArrowRight") setSplit((v) => Math.min(70, v + 5));
                }}
                className="group relative hidden cursor-col-resize lg:block"
              >
                <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-foreground/80" />
                <span className="absolute top-1/2 left-1/2 grid h-10 w-[18px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md bg-foreground transition-transform group-hover:scale-110">
                  <span className="h-4 w-[2px] rounded bg-background/70" />
                </span>
              </button>
            )}
            <section aria-label={t("question")} className="px-5 py-5 sm:p-6 lg:overflow-y-auto">
              <div className="mx-auto w-full max-w-[680px] space-y-5 max-sm:space-y-4 sm:rounded-2xl sm:border sm:bg-surface sm:p-7 sm:shadow-[var(--glass-shadow)]">
                <QuestionHeader number={index + 1} item={item} onToggleFlag={toggleFlag} elimMode={elimMode} onToggleElim={() => setElimMode((x) => !x)} />

                <RichText html={item.stemHtml} className="q-stem" />

                {item.type === "MCQ" ? (
                  <ChoiceList
                    name={`q-${item.position}`}
                    choices={item.choices}
                    value={item.answer}
                    eliminated={item.eliminated}
                    disabled={!!item.feedback}
                    correctAnswers={item.feedback?.correctAnswers}
                    onSelect={selectChoice}
                    onToggleEliminate={toggleEliminate}
                    showEliminate={elimMode}
                  />
                ) : (
                  <SprInput value={item.answer ?? ""} onChange={(v) => update(item.position, { answer: v || null })} disabled={!!item.feedback} />
                )}

                {immediate && !item.feedback && (
                  <Button size="lg" className="w-full sm:w-auto" onClick={check} disabled={!item.answer || checking || (item.type === "SPR" && !!validateSprInput(item.answer ?? ""))}>
                    {checking && <Loader2 className="animate-spin" aria-hidden />}
                    {checking ? t("checking") : t("check")}
                  </Button>
                )}

                {immediate && !item.feedback && aiEnabled && <AiTutor key={`hint-${item.position}`} attemptId={attemptId} questionId={item.questionId} answered={false} wrongChoice={false} />}

                {item.feedback && (
                  <FeedbackPanel item={item} feedback={item.feedback} timeMs={checkedTime[item.position] ?? item.timeSpentMs} attemptId={attemptId} aiEnabled={aiEnabled} />
                )}
              </div>
            </section>
          </div>
        )}
      </main>
      </div>

      {/* Bottom bar: Back | navigator | Next on phones (with the safe area); save status on the left from tablets up. */}
      <footer className="glass shrink-0 border-t pb-[env(safe-area-inset-bottom)]">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4">
          <div className="flex min-w-0 items-center">
            <Button variant="outline" className="h-11 md:hidden" onClick={prev} disabled={view === "question" && index === 0} aria-label={c("back")}>
              <ChevronLeft aria-hidden />
            </Button>
            <span className="hidden md:inline-flex">
              <SaveIndicator status={autosave.status} />
            </span>
          </div>
          <div>
            {view === "question" && (
              <NavigatorPopover items={navItems} current={index} onGo={go} onReview={() => setView("review")} open={navOpen} onOpenChange={setNavOpen} />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="hidden h-11 md:inline-flex" onClick={prev} disabled={view === "question" && index === 0}>
              <ChevronLeft aria-hidden /> {c("back")}
            </Button>
            {view === "question" && (
              <Button className="h-11" onClick={next}>
                {c("next")} <ChevronRight aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </footer>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("submitConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("submitConfirm.body")} {unanswered > 0 && t("submitConfirm.unanswered", { count: unanswered })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("submitConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitNow("user")}>{t("submitConfirm.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("exitConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("exitConfirm.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("exitConfirm.stay")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await autosave.flush();
                router.push(initial.returnTo ?? "/practice");
              }}
            >
              {t("exitConfirm.leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lineReader && <LineReader />}
      {isMath && <ReferenceSheet open={refOpen} onOpenChange={setRefOpen} />}

      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {(
              [
                ["A–D / 1–4", "choose"],
                ["→ / N", "next"],
                ["← / P", "previous"],
                ["Enter", "check"],
                ["M", "mark"],
                ["E", "eliminator"],
                ["Shift + A–D", "eliminate"],
                ["H", "highlight"],
                ["L", "lineReader"],
                ["C", "calculator"],
                ["R", "reference"],
                ["F", "fullscreen"],
                ["?", "help"],
              ] as const
            ).map(([keys, label]) => (
              <div key={label} className="contents">
                <dt>
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">{keys}</kbd>
                </dt>
                <dd>{t(`shortcuts.${label}`)}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatTime(ms: number) {
  const sec = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * After "Check answer": a slim result strip springs in (the choice cards
 * already show the check or cross), then a neutral explanation card expands
 * with numbered steps, and the follow-up actions sit underneath.
 */
function FeedbackPanel({ item, feedback, timeMs, attemptId, aiEnabled }: { item: RunnerItem; feedback: Feedback; timeMs: number; attemptId: string; aiEnabled: boolean }) {
  const t = useTranslations("test.feedback");
  const tt = useTranslations("test");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [tutor, setTutor] = useState<"another" | "followUp" | null>(null);
  const answers = feedback.correctAnswers.join(", ");
  const wrongChoice = item.type === "MCQ" && !!item.answer && !feedback.isCorrect;
  return (
    <div className="space-y-3">
      <m.div
        role="status"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0.15 } : spring.bouncy}
        className="relative flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-surface-2 px-3.5 py-2 text-small"
      >
        {feedback.isCorrect && <MascotCheerPop />}
        <span className={cn("flex items-center gap-1.5 font-semibold", feedback.isCorrect ? "text-correct-ink" : "text-danger-ink")}>
          {feedback.isCorrect ? <DrawCheck className="size-4" /> : <DrawX className="size-4" />}
          {feedback.isCorrect ? t("correct") : t("incorrect")}
        </span>
        {!feedback.isCorrect && (
          <span className="text-foreground">
            <span aria-hidden className="me-3 text-muted-foreground">
              ·
            </span>
            {item.type === "SPR" ? t("acceptedAnswers", { answers }) : t("correctAnswer", { answer: answers })}
          </span>
        )}
        <span className="ms-auto font-mono text-xs text-muted-foreground tabular-nums" title={t("time", { time: formatTime(timeMs) })}>
          <span className="sr-only">{t("time", { time: formatTime(timeMs) })}</span>
          <span aria-hidden>{formatTime(timeMs)}</span>
        </span>
      </m.div>

      <section className="overflow-hidden rounded-2xl border bg-surface">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start font-semibold focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {t("explanation")}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} aria-hidden />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              key="body"
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={reduce ? { duration: 0.15 } : { ...spring.soft, delay: 0.12 }}
            >
              <div className="space-y-4 border-t px-4 py-4">
                {feedback.rationaleHtml && (
                  <div className="rounded-xl bg-surface-2 p-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("whyNot", { choice: item.answer ?? "" })}</p>
                    <RichText html={feedback.rationaleHtml} className="text-small" />
                  </div>
                )}
                {feedback.explanationHtml ? (
                  <RichText html={feedback.explanationHtml} className="explain-steps text-small" />
                ) : (
                  <p className="text-small text-muted-foreground">{tt("noExplanation")}</p>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {aiEnabled && (
          <>
            <Button variant={tutor === "another" ? "secondary" : "outline"} size="sm" onClick={() => setTutor("another")}>
              <Sparkles aria-hidden /> {t("explainDifferently")}
            </Button>
            <Button variant={tutor === "followUp" ? "secondary" : "outline"} size="sm" onClick={() => setTutor("followUp")}>
              <MessageCircle aria-hidden /> {t("askFollowUp")}
            </Button>
          </>
        )}
        <span className="ms-auto">
          <ReportDialog attemptId={attemptId} questionId={item.questionId} />
        </span>
      </div>

      {aiEnabled && tutor && (
        <AiTutor
          key={`${tutor}-${item.position}`}
          attemptId={attemptId}
          questionId={item.questionId}
          answered
          wrongChoice={wrongChoice}
          autoStart={tutor === "another" ? (wrongChoice ? "whyWrong" : "another") : "explain"}
          focusFollowUp={tutor === "followUp"}
        />
      )}
    </div>
  );
}

/** Save status. `compact` (phone top bar) is a labelled icon; the full one (bottom bar, tablets up) also announces changes. */
function SaveIndicator({ status, compact = false }: { status: SaveStatus; compact?: boolean }) {
  const t = useTranslations("test.save");
  const Icon = status === "offline" || status === "error" ? WifiOff : status === "saving" ? Loader2 : Wifi;
  if (compact) {
    return (
      <span role="img" aria-label={t(status)} title={t(status)} className="flex size-9 items-center justify-center text-muted-foreground">
        <Icon className={cn("size-4", status === "saving" && "animate-spin", (status === "offline" || status === "error") && "text-destructive")} aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      <Icon className={cn("size-4 shrink-0", status === "saving" && "animate-spin", (status === "offline" || status === "error") && "text-destructive")} aria-hidden />
      <span className="truncate">{t(status)}</span>
    </span>
  );
}
