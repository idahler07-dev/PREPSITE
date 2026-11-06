"use client";

import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { Check, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DemoFrame, Skel, useCursorDemo } from "./engine";

type Q = { q: string; choices: string[]; answer: number; steps: string[] };
type Phase = "idle" | "checking" | "correct";
const LETTERS = ["A", "B", "C", "D"] as const;

/** Practice: pick, check, read the explanation, next question. */
export function PracticeDemo() {
  const t = useTranslations("home3.demos.practice");
  const qs = t.raw("qs") as Q[];
  const [qi, setQi] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [explain, setExplain] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setQi(0);
    setHover(null);
    setSel(null);
    setPhase("idle");
    setExplain(false);
    setLoading(false);
  };
  const demo = useCursorDemo({
    reset,
    final: () => {
      reset();
      setSel(qs[0]!.answer);
      setPhase("correct");
      setExplain(true);
    },
    async script({ move, click, wait }) {
      await move("c0");
      setHover(0);
      await wait(380);
      await move("c1");
      setHover(1);
      await wait(260);
      await click();
      setSel(1);
      setHover(null);
      await wait(450);
      await move("check");
      await click();
      setPhase("checking");
      await wait(850);
      setPhase("correct");
      await wait(900);
      await move("explain");
      await click();
      setExplain(true);
      await wait(2800);
      await move("next");
      await click();
      setLoading(true);
      setExplain(false);
      await wait(950);
      setQi(1);
      setSel(null);
      setPhase("idle");
      setLoading(false);
      await wait(1100);
      await move("c2");
      setHover(2);
      await wait(250);
      await click();
      setSel(2);
      setHover(null);
      await wait(400);
      await move("check");
      await click();
      setPhase("checking");
      await wait(800);
      setPhase("correct");
      await wait(1400);
    },
  });

  const q = qs[qi]!;
  return (
    <DemoFrame demo={demo} label={t("label")} path={t("path")} bodyClassName="p-5 sm:p-6 min-h-[430px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">{t("crumb")}</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">{t("diff")}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
          <span className="tabular-nums">{t("count", { n: 3 + qi })}</span>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
            <m.span className="block h-full rounded-full bg-primary" animate={{ width: `${((3 + qi) / 12) * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <m.div key="skel" className="mt-6 space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Skel className="h-4 w-11/12" />
            <Skel className="h-4 w-2/3" />
            <div className="space-y-2.5 pt-3">
              {LETTERS.map((l) => (
                <Skel key={l} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </m.div>
        ) : (
          <m.div key={qi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <p className="mt-6 text-[15px] leading-relaxed font-medium sm:text-base">{q.q}</p>
            <div className="mt-4 space-y-2.5">
              {q.choices.map((c, i) => {
                const chosen = sel === i;
                const right = phase === "correct" && chosen;
                return (
                  <div
                    key={c}
                    data-demo={`c${i}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                      right ? "border-correct bg-correct-soft" : chosen ? "border-primary bg-primary-soft" : hover === i ? "border-primary/40 bg-surface-2" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors duration-200",
                        right ? "border-correct bg-correct text-on-fill" : chosen ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                      )}
                    >
                      {right ? <Check className="size-3.5" strokeWidth={3} /> : LETTERS[i]}
                    </span>
                    {c}
                  </div>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-5 flex min-h-10 items-center justify-between gap-3">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "correct" && !loading ? (
            <m.div key="ok" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm font-semibold text-correct-ink">
              <span className="grid size-6 place-items-center rounded-full bg-correct-soft">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              {t("correct")}
              <span className="font-medium text-muted-foreground">{t("time", { s: qi ? 31 : 42 })}</span>
            </m.div>
          ) : (
            <span key="none" />
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2">
          {phase === "correct" && !loading ? (
            <>
              <span data-demo="explain" className={cn("rounded-full border px-3.5 py-2 text-xs font-semibold", explain ? "border-primary/40 bg-primary-soft text-primary" : "border-border")}>
                {t("explain")}
              </span>
              <span data-demo="next" className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
                {t("next")}
                <ChevronRight className="size-3.5" />
              </span>
            </>
          ) : (
            <span
              data-demo="check"
              className={cn(
                "inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                sel === null || loading ? "bg-surface-2 text-muted-foreground" : "bg-primary text-primary-foreground",
              )}
            >
              {phase === "checking" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {phase === "checking" ? t("checking") : t("check")}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {explain && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <ol className="mt-4 space-y-2 rounded-2xl bg-surface-2 p-4">
              {q.steps.map((s, i) => (
                <m.li key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.25 }} className="flex gap-2.5 text-sm">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface text-[11px] font-bold text-primary tabular-nums">{i + 1}</span>
                  {s}
                </m.li>
              ))}
              <m.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + q.steps.length * 0.25 }} className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                {t("similar")}
              </m.li>
            </ol>
          </m.div>
        )}
      </AnimatePresence>
    </DemoFrame>
  );
}
