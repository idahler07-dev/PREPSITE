"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "motion/react";
import { RotateCcw } from "lucide-react";
import { DrawCheck, DrawX, RadialFill } from "./answer-effects";
import { RichText } from "@/components/content/rich-text";
import { cn } from "@/lib/utils";

/**
 * Answer choices as full-width cards with an A–D badge. Each choice has its
 * own cross-out button beside it (Shift + letter does the same). After a check,
 * the picked card shows a check or a cross and the correct one turns green.
 */
export function ChoiceList({
  name,
  choices,
  value,
  eliminated,
  disabled,
  correctAnswers,
  onSelect,
  onToggleEliminate,
}: {
  name: string;
  choices: { key: string; html: string }[];
  value: string | null;
  eliminated: string[];
  disabled?: boolean;
  /** Shown after checking/submitting. */
  correctAnswers?: string[];
  onSelect: (key: string) => void;
  onToggleEliminate: (key: string) => void;
}) {
  const t = useTranslations("test");
  // Where the pointer went down on each choice, so the selection fill grows from there.
  const [origin, setOrigin] = useState<Record<string, { x: number; y: number }>>({});
  return (
    <div role="radiogroup" aria-label={t("question")} className="space-y-2.5">
      {choices.map((c) => {
        const selected = value === c.key;
        const struck = eliminated.includes(c.key);
        const isCorrect = !!correctAnswers?.includes(c.key);
        const wrongPick = !!correctAnswers && selected && !isCorrect;
        const checked = !!correctAnswers;
        return (
          <div key={c.key} className="flex items-stretch gap-2">
            <label
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setOrigin((o) => ({ ...o, [c.key]: { x: e.clientX - r.left, y: e.clientY - r.top } }));
              }}
              className={cn(
                "relative isolate flex min-h-14 flex-1 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border bg-surface px-3.5 py-3 transition-[border-color,background-color,box-shadow] duration-150",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                !checked && !selected && "border-border hover:border-primary/50 hover:bg-primary-soft/40 hover:shadow-sm",
                !checked && selected && "border-primary shadow-[0_0_0_1px_var(--primary)]",
                checked && isCorrect && "border-correct shadow-[0_0_0_1px_var(--correct)]",
                wrongPick && "border-danger shadow-[0_0_0_1px_var(--danger)]",
                checked && !isCorrect && !wrongPick && "border-border opacity-70",
                struck && !selected && !checked && "opacity-55",
                disabled && "cursor-default",
              )}
            >
              <AnimatePresence>{selected && !checked && <RadialFill origin={origin[c.key] ?? null} />}</AnimatePresence>
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
                  "relative flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                  !checked && (selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 bg-background text-foreground"),
                  checked && isCorrect && "border-correct bg-correct text-on-fill",
                  wrongPick && "border-danger bg-danger text-on-fill",
                  checked && !isCorrect && !wrongPick && "border-foreground/20 text-muted-foreground",
                  struck && "line-through",
                )}
              >
                {c.key}
              </span>
              <RichText html={c.html} className={cn("q-text relative flex-1", struck && "text-muted-foreground line-through decoration-2")} />
              {checked && isCorrect && (
                <span className="relative shrink-0" role="img" aria-label={t("correct")}>
                  <DrawCheck />
                </span>
              )}
              {wrongPick && (
                <span className="relative shrink-0" role="img" aria-label={t("incorrect")}>
                  <DrawX />
                </span>
              )}
            </label>
            {!disabled && (
              <button
                type="button"
                onClick={() => onToggleEliminate(c.key)}
                aria-pressed={struck}
                aria-label={struck ? t("undoCrossOut", { choice: c.key }) : t("crossOut", { choice: c.key })}
                title={struck ? t("undoCrossOut", { choice: c.key }) : t("crossOut", { choice: c.key })}
                className={cn(
                  "flex w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                  struck ? "border-primary/40 bg-primary-soft text-primary" : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-2 hover:text-foreground",
                )}
              >
                {struck ? <RotateCcw className="size-4" aria-hidden /> : <span className="line-through decoration-2">{c.key}</span>}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
