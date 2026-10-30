"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { DrawCheck, RadialFill, shake } from "./answer-effects";
import { RichText } from "@/components/content/rich-text";
import { cn } from "@/lib/utils";

export function ChoiceList({
  name,
  choices,
  value,
  eliminated,
  eliminatorOn,
  disabled,
  correctAnswers,
  onSelect,
  onToggleEliminate,
}: {
  name: string;
  choices: { key: string; html: string }[];
  value: string | null;
  eliminated: string[];
  eliminatorOn: boolean;
  disabled?: boolean;
  /** Shown after checking/submitting. */
  correctAnswers?: string[];
  onSelect: (key: string) => void;
  onToggleEliminate: (key: string) => void;
}) {
  const t = useTranslations("test");
  const reduce = useReducedMotion();
  // Where the pointer went down on each choice, so the selection fill grows from there.
  const [origin, setOrigin] = useState<Record<string, { x: number; y: number }>>({});
  return (
    <div role="radiogroup" aria-label={t("question")} className="space-y-3">
      {choices.map((c) => {
        const selected = value === c.key;
        const struck = eliminated.includes(c.key);
        const isCorrect = correctAnswers?.includes(c.key);
        const wrongPick = correctAnswers && selected && !isCorrect;
        return (
          <div key={c.key} className="flex items-stretch gap-2">
            <m.label
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin((o) => ({ ...o, [c.key]: { x: e.clientX - r.left, y: e.clientY - r.top } }));
              }}
              animate={wrongPick && !reduce ? shake.animate : { x: 0 }}
              transition={shake.transition}
              className={cn(
                "relative isolate flex flex-1 cursor-pointer items-start gap-3 overflow-hidden rounded-[12px] border-2 p-3 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                selected ? "border-primary" : "border-border hover:border-primary/60",
                struck && !selected && "opacity-60",
                isCorrect && "border-correct bg-correct-soft",
                wrongPick && "border-danger bg-danger-soft",
                disabled && "cursor-default",
              )}
            >
              <AnimatePresence>{selected && !isCorrect && !wrongPick && <RadialFill origin={origin[c.key] ?? null} />}</AnimatePresence>
              <input
                type="radio"
                name={name}
                value={c.key}
                checked={selected}
                disabled={disabled}
                onChange={() => onSelect(c.key)}
                className="sr-only"
                aria-label={t("choice", { choice: c.key })}
              />
              <span
                aria-hidden
                className={cn(
                  "relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/40",
                  struck && "line-through",
                )}
              >
                {c.key}
              </span>
              <RichText html={c.html} className={cn("relative flex-1 pt-1", struck && "line-through decoration-2")} />
              {isCorrect && (
                <span className="relative mt-1" role="img" aria-label={t("correct")}>
                  <DrawCheck />
                </span>
              )}
              {wrongPick && <X className="relative mt-1 size-5 shrink-0 text-danger-ink" aria-label={t("incorrect")} />}
            </m.label>
            {eliminatorOn && !disabled && (
              <button
                type="button"
                onClick={() => onToggleEliminate(c.key)}
                aria-pressed={struck}
                aria-label={struck ? t("undoCrossOut", { choice: c.key }) : t("crossOut", { choice: c.key })}
                className="w-12 shrink-0 rounded-lg border text-sm font-semibold hover:bg-surface-2"
              >
                <span className={cn(!struck && "line-through")}>{struck ? "↺" : c.key}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
