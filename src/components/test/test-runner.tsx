"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bookmark, Calculator, ChevronLeft, ChevronRight, Highlighter, Keyboard, Loader2, LogOut, Maximize, Minimize, Minus, NotebookPen, Plus, ScanLine, Sigma, Strikethrough, Wifi, WifiOff, CheckCircle2, XCircle } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { AiTutor } from "@/components/tutor/ai-tutor";

type Annotations = Record<string, { highlights: Highlight[]; note: string | null }>;
const HL_COLORS: HighlightColor[] = ["yellow", "blue", "pink"];

const ZOOM_STEPS = [0.9, 1, 1.15, 1.3, 1.5];

type Feedback = NonNullable<RunnerItem["feedback"]>;

export function TestRunner({
  initial,
  annotations: initialAnnotations = {},
  desmosKey = null,
  aiEnabled = false,
}: {
  initial: RunnerState;
  annotations?: Annotations;
  desmosKey?: string | null;
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
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showTip, setShowTip] = useState(false);
  const [annotations, setAnnotations] = useState<Annotations>(initialAnnotations);
  const [highlighterOn, setHighlighterOn] = useState(false);
  const [hlColor, setHlColor] = useState<HighlightColor>("yellow");
  const [lineReader, setLineReader] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
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
      setShowTip(window.matchMedia("(max-width: 767px)").matches && !localStorage.getItem("mobile-tip-dismissed"));
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
  useEffect(() => {
    lastTick.current = performance.now();
    timeAcc.current = 0;
    const pos = items[index]?.position;
    const commit = () => {
      if (pos === undefined || timeAcc.current < 500) return;
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
      setItems((prev) => prev.map((it) => (it.position === item.position ? { ...it, feedback } : it)));
    } catch {
      toast.error(c("networkError"));
    } finally {
      setChecking(false);
    }
  }

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
          if (eliminatorOn && e.shiftKey) toggleEliminate(key);
          else selectChoice(key);
        }
      } else if (k === "arrowright" || k === "n") {
        e.preventDefault();
        next();
      } else if (k === "arrowleft" || k === "p") {
        e.preventDefault();
        prev();
      } else if (k === "m") {
        e.preventDefault();
        toggleFlag();
      } else if (k === "e") {
        e.preventDefault();
        setEliminatorOn((x) => !x);
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
  const immediate = initial.feedbackMode === "IMMEDIATE";
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

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
        <h1 className="truncate font-semibold">{title}</h1>
        <div className="mx-auto">
          {initial.module.deadline && (
            <CountdownTimer
              deadline={initial.module.deadline}
              serverNow={initial.serverNow}
              warningSec={testStructure.warningSec}
              onExpire={() => void submitNow("time")}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          {isMath && (
            <>
              <Button variant={calcOpen ? "secondary" : "ghost"} size="icon" onClick={() => setCalcOpen((x) => !x)} aria-pressed={calcOpen} aria-label={t("tools.calculator")} title={t("tools.calculator")}>
                <Calculator aria-hidden />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setRefOpen(true)} aria-label={t("tools.reference")} title={t("tools.reference")}>
                <Sigma aria-hidden />
              </Button>
            </>
          )}
          <Button variant={lineReader ? "secondary" : "ghost"} size="icon" className="hidden sm:inline-flex" onClick={() => setLineReader((x) => !x)} aria-pressed={lineReader} aria-label={t("tools.lineReader")} title={t("tools.lineReader")}>
            <ScanLine aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={toggleFullscreen} aria-pressed={fullscreen} aria-label={fullscreen ? t("tools.exitFullscreen") : t("tools.fullscreen")} title={fullscreen ? t("tools.exitFullscreen") : t("tools.fullscreen")}>
            {fullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(-1)} aria-label={t("zoomOut")} disabled={zoom <= ZOOM_STEPS[0]!}>
            <Minus aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(1)} aria-label={t("zoomIn")} disabled={zoom >= ZOOM_STEPS.at(-1)!}>
            <Plus aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setShortcutsOpen(true)} aria-label={t("shortcuts.title")}>
            <Keyboard aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)}>
            <LogOut aria-hidden /> <span className="hidden sm:inline">{t("exit")}</span>
          </Button>
        </div>
      </header>

      {showTip && (
        <div className="flex items-start gap-2 border-b bg-primary-soft px-4 py-2 text-sm text-foreground">
          <p className="flex-1">{t("mobileTip")}</p>
          <button
            type="button"
            className="underline"
            onClick={() => {
              setShowTip(false);
              try {
                localStorage.setItem("mobile-tip-dismissed", "1");
              } catch {}
            }}
          >
            {t("dismiss")}
          </button>
        </div>
      )}

      {/* Main */}
      {/* One scroll area on phones; side-by-side panes that scroll separately on large screens. */}
      <main ref={mainRef} id="main" className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden" style={{ fontSize: `${zoom}rem` }}>
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
          <div key={item.position} className={cn("grid lg:h-full", item.passageHtml ? "lg:grid-cols-2 lg:divide-x" : "")}>
            {item.passageHtml && (
              <section aria-label={t("passage")} className="border-b p-4 sm:p-6 lg:overflow-y-auto lg:border-b-0">
                <div className="mb-3 flex flex-wrap items-center gap-1">
                  <Button variant={highlighterOn ? "secondary" : "ghost"} size="sm" onClick={() => setHighlighterOn((x) => !x)} aria-pressed={highlighterOn}>
                    <Highlighter aria-hidden /> {highlighterOn ? t("tools.highlighterOn") : t("tools.highlighter")}
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
                        <NotebookPen aria-hidden /> {annotation?.note ? t("tools.editNote") : t("tools.addNote")}
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
            <section aria-label={t("question")} className="p-4 sm:p-6 lg:overflow-y-auto">
              <div className={cn("mx-auto space-y-5", item.passageHtml ? "max-w-2xl" : "max-w-3xl")}>
                <div className="flex flex-wrap items-center gap-2 border-b pb-3">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded bg-foreground px-2 text-sm font-bold text-background">{index + 1}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t("questionId", { code: item.code.toLowerCase() })}</span>
                  <Button variant={item.flagged ? "secondary" : "ghost"} size="sm" onClick={toggleFlag} aria-pressed={item.flagged}>
                    <Bookmark className={cn(item.flagged && "fill-flag text-flag")} aria-hidden />
                    {item.flagged ? t("marked") : t("markForReview")}
                  </Button>
                  {item.type === "MCQ" && !item.feedback && (
                    <Button
                      variant={eliminatorOn ? "secondary" : "ghost"}
                      size="sm"
                      className="ms-auto"
                      onClick={() => setEliminatorOn((x) => !x)}
                      aria-pressed={eliminatorOn}
                      title={t("eliminator")}
                    >
                      <Strikethrough aria-hidden />
                      <span className="sr-only sm:not-sr-only">{eliminatorOn ? t("eliminatorOn") : t("eliminator")}</span>
                    </Button>
                  )}
                </div>

                <RichText html={item.stemHtml} />

                {item.type === "MCQ" ? (
                  <ChoiceList
                    name={`q-${item.position}`}
                    choices={item.choices}
                    value={item.answer}
                    eliminated={item.eliminated}
                    eliminatorOn={eliminatorOn}
                    disabled={!!item.feedback}
                    correctAnswers={item.feedback?.correctAnswers}
                    onSelect={selectChoice}
                    onToggleEliminate={toggleEliminate}
                  />
                ) : (
                  <SprInput value={item.answer ?? ""} onChange={(v) => update(item.position, { answer: v || null })} disabled={!!item.feedback} />
                )}

                {immediate && !item.feedback && (
                  <Button onClick={check} disabled={!item.answer || checking || (item.type === "SPR" && !!validateSprInput(item.answer ?? ""))}>
                    {checking && <Loader2 className="animate-spin" aria-hidden />}
                    {checking ? t("checking") : t("check")}
                  </Button>
                )}

                {immediate && !item.feedback && aiEnabled && <AiTutor key={`hint-${item.position}`} attemptId={attemptId} questionId={item.questionId} answered={false} wrongChoice={false} />}

                {item.feedback && <FeedbackPanel item={item} feedback={item.feedback} attemptId={attemptId} aiEnabled={aiEnabled} />}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Bottom bar */}
      <footer className="flex h-16 shrink-0 items-center gap-2 border-t px-3 sm:px-4">
        <SaveIndicator status={autosave.status} />
        <div className="mx-auto">
          {view === "question" && (
            <NavigatorPopover items={navItems} current={index} onGo={go} onReview={() => setView("review")} open={navOpen} onOpenChange={setNavOpen} />
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={prev} disabled={view === "question" && index === 0}>
            <ChevronLeft aria-hidden /> <span className="hidden sm:inline">{c("back")}</span>
          </Button>
          {view === "question" && (
            <Button onClick={next}>
              <span className="hidden sm:inline">{c("next")}</span> <ChevronRight aria-hidden />
            </Button>
          )}
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
                router.push("/practice");
              }}
            >
              {t("exitConfirm.leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lineReader && <LineReader />}
      {calcOpen && <CalculatorPanel desmosKey={desmosKey} attemptId={attemptId} onClose={() => setCalcOpen(false)} />}
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
                ["M", "mark"],
                ["E", "eliminate"],
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

function FeedbackPanel({ item, feedback, attemptId, aiEnabled }: { item: RunnerItem; feedback: Feedback; attemptId: string; aiEnabled: boolean }) {
  const t = useTranslations("test");
  return (
    <div
      role="status"
      className={cn("space-y-3 rounded-lg border-2 p-4", feedback.isCorrect ? "border-success bg-success-muted" : "border-destructive bg-danger-muted")}
    >
      <p className="flex items-center gap-2 font-semibold">
        {feedback.isCorrect ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <XCircle className="size-5 text-destructive" aria-hidden />}
        {feedback.isCorrect ? t("correct") : t("incorrect")}
      </p>
      {!feedback.isCorrect && (
        <p className="text-sm">
          {item.type === "SPR"
            ? t("acceptedAnswers", { answers: feedback.correctAnswers.join(", ") })
            : t("correctAnswerIs", { answer: feedback.correctAnswers.join(", ") })}
        </p>
      )}
      {feedback.rationaleHtml && <RichText html={feedback.rationaleHtml} className="text-sm" />}
      <div className="border-t border-foreground/10 pt-3">
        <h3 className="mb-1 text-sm font-semibold">{t("explanation")}</h3>
        {feedback.explanationHtml ? <RichText html={feedback.explanationHtml} className="text-sm" /> : <p className="text-sm text-muted-foreground">{t("noExplanation")}</p>}
      </div>
      {aiEnabled && (
        <AiTutor
          key={`explain-${item.position}`}
          attemptId={attemptId}
          questionId={item.questionId}
          answered
          wrongChoice={item.type === "MCQ" && !!item.answer && !feedback.isCorrect}
        />
      )}
      <ReportDialog attemptId={attemptId} questionId={item.questionId} />
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const t = useTranslations("test.save");
  const Icon = status === "offline" || status === "error" ? WifiOff : status === "saving" ? Loader2 : Wifi;
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
      <Icon className={cn("size-4 shrink-0", status === "saving" && "animate-spin", (status === "offline" || status === "error") && "text-destructive")} aria-hidden />
      <span className="hidden truncate md:inline">{t(status)}</span>
    </span>
  );
}
