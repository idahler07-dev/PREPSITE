"use client";

import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";
import type { RunnerItem } from "@/server/attempts/service";
import { cn } from "@/lib/utils";

const ELIM_LABEL = "ABC";

const DOT = {
  EASY: "bg-correct",
  MEDIUM: "bg-flagged",
  HARD: "bg-danger",
} as const;

/**
 * Above each question: its number, a "Section · Skill" chip, a difficulty chip
 * with a colored dot (practice only) and Mark for review. No question IDs.
 */
export function QuestionHeader({
  number,
  item,
  onToggleFlag,
  elimMode,
  onToggleElim,
}: {
  number: number;
  item: RunnerItem;
  onToggleFlag: () => void;
  /** Bluebook's ABC cross-out tool (MCQ only). */
  elimMode?: boolean;
  onToggleElim?: () => void;
}) {
  const t = useTranslations("test");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums.difficulty");
  const section = tx(`sections.${item.section}`);
  return (
    <div className="flex items-center gap-2.5 border-b pb-3">
      <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-foreground px-2 text-sm font-bold text-background tabular-nums">
        {number}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-2 self-center">
        <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">
          <span className="max-sm:hidden">{section} · </span>
          {item.meta ? tx(`skills.${item.meta.skill as "INFERENCES"}`) : section}
        </span>
        {item.meta && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-2 rounded-full", DOT[item.meta.difficulty])} aria-hidden />
            <span className="max-sm:sr-only" aria-hidden>
              {te(item.meta.difficulty)}
            </span>
            <span className="sr-only">{t("difficultyChip", { level: te(item.meta.difficulty) })}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleFlag}
        aria-pressed={item.flagged}
        className={cn(
          "inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-sm sm:px-3 font-medium transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
          item.flagged
            ? "bg-review-soft text-review"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        )}
      >
        <Bookmark
          className={cn(
            "size-4",
            item.flagged && "fill-current text-review",
          )}
          aria-hidden
        />
        <span className="sr-only sm:not-sr-only">
          {item.flagged ? t("marked") : t("markForReview")}
        </span>
      </button>
      {onToggleElim && item.type === "MCQ" && (
        <button
          type="button"
          onClick={onToggleElim}
          aria-pressed={elimMode}
          aria-label={t("eliminator")}
          title={t("eliminator")}
          className={cn(
            "inline-flex h-7 shrink-0 items-center rounded-md border-2 px-1.5 text-[11px] font-extrabold line-through decoration-2 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
            elimMode ? "border-primary bg-primary text-primary-foreground" : "border-foreground/70 text-foreground hover:bg-surface-2",
          )}
        >
          {ELIM_LABEL}
        </button>
      )}
    </div>
  );
}
