"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
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
  return (
    <div role="radiogroup" aria-label={t("question")} className="space-y-3">
      {choices.map((c) => {
        const selected = value === c.key;
        const struck = eliminated.includes(c.key);
        const isCorrect = correctAnswers?.includes(c.key);
        const wrongPick = correctAnswers && selected && !isCorrect;
        return (
          <div key={c.key} className="flex items-stretch gap-2">
            <label
              className={cn(
                "flex flex-1 cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                selected ? "border-primary bg-primary-soft" : "border-border hover:border-primary/60",
                struck && !selected && "opacity-60",
                isCorrect && "border-success bg-success-muted",
                wrongPick && "border-destructive bg-danger-muted",
                disabled && "cursor-default",
              )}
            >
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
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/40",
                  struck && "line-through",
                )}
              >
                {c.key}
              </span>
              <RichText html={c.html} className={cn("flex-1 pt-1", struck && "line-through decoration-2")} />
              {isCorrect && <Check className="mt-1 size-5 shrink-0 text-success" aria-label={t("correct")} />}
              {wrongPick && <X className="mt-1 size-5 shrink-0 text-destructive" aria-label={t("incorrect")} />}
            </label>
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
