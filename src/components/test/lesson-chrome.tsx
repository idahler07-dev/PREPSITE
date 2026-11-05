"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ChevronDown, Flame, Loader2, X } from "lucide-react";
import { RichText } from "@/components/content/rich-text";
import { cn } from "@/lib/utils";
import { DrawCheck, DrawX } from "./answer-effects";
import { ReportDialog } from "./report-dialog";

/** Lesson top bar (brief §7): close, a chunky progress bar and the combo counter. No hearts. */
export function LessonHeader({ done, total, combo, onClose, tools }: { done: number; total: number; combo: number; onClose: () => void; tools?: React.ReactNode }) {
  const t = useTranslations("test.lesson");
  const reduce = useReducedMotion();
  const pct = total ? (done / total) * 100 : 0;
  return (
    <header className="shrink-0 bg-background">
      <div className="mx-auto flex h-16 max-w-[880px] items-center gap-3 px-3 sm:gap-4 sm:px-6">
        <button type="button" onClick={onClose} aria-label={t("close")} className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground">
          <X className="size-6" strokeWidth={2.5} aria-hidden />
        </button>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={t("progress", { done, total })}>
          <m.div className="h-full rounded-full bg-correct" initial={false} animate={{ width: `${pct}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}>
            <span className="mx-2 mt-[3px] block h-1 rounded-full bg-white/35" />
          </m.div>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {combo >= 2 && (
            <m.span
              key={combo}
              className="flex shrink-0 items-center gap-1 font-display text-base font-extrabold text-accent-ink tabular-nums"
              initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              aria-label={t("combo", { count: combo })}
            >
              <Flame className="size-5 fill-current text-accent" aria-hidden />
              {combo}
            </m.span>
          )}
        </AnimatePresence>
        {tools && <div className="hidden items-center sm:flex">{tools}</div>}
      </div>
    </header>
  );
}

/**
 * The bottom check bar: "Pick an answer first." → Check → green "Nice one!
 * +10 XP" or red "Not quite. Answer: A" with "Why?" opening the steps.
 */
export function LessonCheckBar({
  state,
  answer,
  explanationHtml,
  rationaleHtml,
  checking,
  last,
  attemptId,
  questionId,
  onCheck,
  onContinue,
  canCheck,
}: {
  state: "empty" | "ready" | "right" | "wrong";
  answer: string;
  explanationHtml: string | null;
  rationaleHtml: string | null;
  checking: boolean;
  last: boolean;
  attemptId: string;
  questionId: string;
  onCheck: () => void;
  onContinue: () => void;
  canCheck: boolean;
}) {
  const t = useTranslations("test.lesson");
  const tt = useTranslations("test");
  const reduce = useReducedMotion();
  const [why, setWhy] = useState(false);
  const result = state === "right" || state === "wrong";
  const tone = state === "right" ? "bg-correct-soft" : state === "wrong" ? "bg-danger-soft" : "bg-background";
  const btn =
    state === "right"
      ? "bg-correct text-white shadow-[0_4px_0_var(--correct-edge)] active:shadow-[0_2px_0_var(--correct-edge)] dark:text-[#0b1020]"
      : state === "wrong"
        ? "bg-danger text-white shadow-[0_4px_0_var(--danger-edge)] active:shadow-[0_2px_0_var(--danger-edge)] dark:text-[#0b1020]"
        : "bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-edge)] active:shadow-[0_2px_0_var(--primary-edge)]";

  return (
    <m.footer layout="position" className={cn("shrink-0 border-t-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-200", tone, result ? "border-transparent" : "border-border")}>
      <AnimatePresence initial={false}>
        {result && why && (
          <m.div
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="mx-auto max-h-[45dvh] max-w-[880px] overflow-y-auto px-4 pt-4 sm:px-6">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="mb-2 font-display text-sm font-extrabold">{t("steps")}</p>
                {rationaleHtml && <RichText html={rationaleHtml} className="mb-3 rounded-xl bg-surface-2 p-3 text-small" />}
                {explanationHtml ? <RichText html={explanationHtml} className="explain-steps text-small" /> : <p className="text-small text-muted-foreground">{tt("noExplanation")}</p>}
                <div className="mt-3 flex justify-end">
                  <ReportDialog attemptId={attemptId} questionId={questionId} />
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <div className="mx-auto flex min-h-[88px] max-w-[880px] flex-wrap items-center gap-3 px-4 py-4 sm:flex-nowrap sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3" role="status" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {result ? (
              <m.div
                key={state}
                className="flex items-center gap-3"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26 }}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full bg-surface", state === "right" ? "text-correct-ink" : "text-danger-ink")}>
                  {state === "right" ? <DrawCheck className="size-6" /> : <DrawX className="size-6" />}
                </span>
                <span>
                  <span className={cn("block font-display text-lg font-extrabold", state === "right" ? "text-correct-ink" : "text-danger-ink")}>
                    {state === "right" ? t("correct") : t("wrong", { answer })}
                  </span>
                  <button type="button" onClick={() => setWhy((v) => !v)} aria-expanded={why} className={cn("inline-flex items-center gap-1 text-sm font-bold", state === "right" ? "text-correct-ink" : "text-danger-ink")}>
                    {why ? t("hideWhy") : t("why")}
                    <ChevronDown className={cn("size-4 transition-transform", why && "rotate-180")} aria-hidden />
                  </button>
                </span>
              </m.div>
            ) : (
              <m.p key="hint" className="text-sm font-semibold text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: state === "empty" ? 1 : 0 }} exit={{ opacity: 0 }}>
                {t("pick")}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={result ? onContinue : onCheck}
          disabled={!result && (!canCheck || checking)}
          className={cn(
            "inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-8 font-display text-base font-extrabold tracking-wide uppercase transition-[transform,box-shadow,opacity] duration-100 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:min-w-[160px]",
            btn,
          )}
        >
          {checking && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {result ? (last ? t("finish") : t("continue")) : t("check")}
        </button>
      </div>
    </m.footer>
  );
}
