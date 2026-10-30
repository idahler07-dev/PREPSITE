"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/content/rich-text";
import { DrawCheck, DrawX, RadialFill } from "@/components/test/answer-effects";
import { checkLandingAnswer } from "@/server/actions/landing";
import { spring, useLiteMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { FeaturedQuestion } from "@/server/landing";

type Result = { correct: boolean; correctKey: string; explanationHtml: string | null };

/**
 * A real question floating over the hero's mesh gradient: answer it and get
 * feedback (checked on the server). Light parallax (0.3× scroll) on large screens.
 */
export function LiveQuestion({ question, ctaHref }: { question: FeaturedQuestion; ctaHref: string }) {
  const t = useTranslations("home.question");
  const reduce = useReducedMotion();
  const lite = useLiteMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => v * -0.3);
  const [picked, setPicked] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function pick(key: string, e?: React.MouseEvent<HTMLButtonElement>) {
    if (result) return;
    const r = refs.current[key]?.getBoundingClientRect();
    setOrigin(e && r && e.clientX ? { x: e.clientX - r.left, y: e.clientY - r.top } : null);
    setPicked(key);
  }

  function check() {
    if (!picked) return;
    start(async () => {
      const res = await checkLandingAnswer({ questionId: question.id, key: picked });
      if (res.ok) setResult({ correct: res.correct, correctKey: res.correctKey, explanationHtml: res.explanationHtml });
    });
  }

  function reset() {
    setPicked(null);
    setResult(null);
  }

  return (
    <m.div style={lite ? undefined : { y }} className="relative">
      <m.section
        aria-label={t("label")}
        className="rounded-2xl border bg-surface p-5 shadow-lg sm:p-6"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduce ? { duration: 0.2 } : { ...spring.soft, delay: 0.45 }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{t("label")}</span>
          <span className="text-xs text-muted-foreground">{t("pick")}</span>
        </div>
        <RichText html={question.stemHtml} className="mb-4 text-[0.98rem]" />
        <div role="radiogroup" aria-label={t("label")} className="space-y-2">
          {question.choices.map((c) => {
            const selected = picked === c.key;
            const isCorrect = result && c.key === result.correctKey;
            const isWrong = result && selected && !result.correct;
            return (
              <m.button
                key={c.key}
                ref={(el) => {
                  refs.current[c.key] = el;
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={t("choice", { key: c.key })}
                disabled={!!result}
                onClick={(e) => pick(c.key, e)}
                className={cn(
                  "relative isolate flex w-full items-center gap-3 overflow-hidden rounded-[var(--radius-input)] border px-3 py-2.5 text-start text-sm transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-default",
                  isCorrect ? "border-correct bg-correct-soft" : isWrong ? "border-danger bg-danger-soft" : selected ? "border-primary" : "border-border hover:border-primary/40",
                )}
              >
                <AnimatePresence>{selected && !result && <RadialFill origin={origin} />}</AnimatePresence>
                <span
                  className={cn(
                    "relative flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    selected && !result ? "border-primary bg-primary text-primary-foreground" : "bg-surface",
                  )}
                >
                  {c.key}
                </span>
                <RichText html={c.html} className="relative flex-1" />
                {isCorrect && <DrawCheck />}
                {isWrong && <DrawX />}
              </m.button>
            );
          })}
        </div>

        <m.div layout transition={spring.soft} className="mt-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {!result ? (
              <m.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button className="w-full" onClick={check} disabled={!picked || pending}>
                  {pending && <Loader2 className="animate-spin" aria-hidden />}
                  {t("check")}
                </Button>
              </m.div>
            ) : (
              <m.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft} className="space-y-3">
                <p role="status" className={cn("font-semibold", result.correct ? "text-correct-ink" : "text-danger-ink")}>
                  {result.correct ? t("correct") : t("incorrect", { key: result.correctKey })}
                </p>
                {result.explanationHtml && (
                  <div className="max-h-28 overflow-y-auto rounded-[var(--radius-input)] bg-surface-2 p-3 text-sm">
                    <p className="mb-1 font-semibold">{t("explanation")}</p>
                    <RichText html={result.explanationHtml} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={ctaHref}>
                      {t("more")} <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={reset} aria-label={t("again")}>
                    <RotateCcw aria-hidden />
                  </Button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </m.section>
    </m.div>
  );
}
