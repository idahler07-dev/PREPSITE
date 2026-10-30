"use client";

import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";
import type { RunnerItem } from "@/server/attempts/service";
import { cn } from "@/lib/utils";

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
}: {
  number: number;
  item: RunnerItem;
  onToggleFlag: () => void;
}) {
  const t = useTranslations("test");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums.difficulty");
  const section = tx(`sections.${item.section}`);
  return (
    <div className="flex items-start gap-2 border-b pb-3">
      <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-foreground px-2 text-sm font-bold text-background tabular-nums">
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pt-0.5">
        <span className="block h-7 max-w-full truncate rounded-full bg-surface-2 leading-7 px-3 text-xs font-medium text-muted-foreground">
          {item.meta
            ? `${section} · ${tx(`skills.${item.meta.skill as "INFERENCES"}`)}`
            : section}
        </span>
        {item.meta && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium">
            <span
              className={cn("size-2 rounded-full", DOT[item.meta.difficulty])}
              aria-hidden
            />
            <span aria-hidden>{te(item.meta.difficulty)}</span>
            <span className="sr-only">
              {t("difficultyChip", { level: te(item.meta.difficulty) })}
            </span>
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
            ? "bg-flagged/20 text-warning-ink"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        )}
      >
        <Bookmark
          className={cn(
            "size-4",
            item.flagged && "fill-flagged text-warning-ink",
          )}
          aria-hidden
        />
        <span className="sr-only sm:not-sr-only">
          {item.flagged ? t("marked") : t("markForReview")}
        </span>
      </button>
    </div>
  );
}
