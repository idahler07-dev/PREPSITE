"use client";

import { useTranslations } from "next-intl";
import { Bookmark, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/use-media-query";

export interface NavItem {
  answered: boolean;
  flagged: boolean;
}

/** Every question as a tile: answered (soft cobalt), unanswered (dashed), flagged (amber bookmark), current (solid cobalt). */
export function QuestionGrid({ items, current, onGo }: { items: NavItem[]; current: number | null; onGo: (i: number) => void }) {
  const t = useTranslations("test");
  return (
    <ol className="grid grid-cols-5 gap-2 min-[400px]:grid-cols-6 sm:grid-cols-8 lg:grid-cols-10">
      {items.map((it, i) => {
        const isCurrent = i === current;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => onGo(i)}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${t("questionOf", { current: i + 1, total: items.length })}${it.answered ? `, ${t("navigator.answered")}` : `, ${t("navigator.unanswered")}`}${it.flagged ? `, ${t("navigator.forReview")}` : ""}`}
              className={cn(
                "relative flex aspect-square w-full min-w-10 items-center justify-center rounded-xl border font-mono text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none",
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : it.answered
                    ? "border-primary/30 bg-primary-soft text-primary hover:border-primary/60"
                    : "border-dashed border-foreground/25 text-muted-foreground hover:border-foreground/50 hover:text-foreground",
                it.flagged && !isCurrent && "border-flagged",
              )}
            >
              {i + 1}
              {it.flagged && <Bookmark className="absolute -end-1 -top-1.5 size-4 fill-flagged text-warning-ink" aria-hidden />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function Legend() {
  const t = useTranslations("test.navigator");
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[4px] bg-primary" aria-hidden /> {t("current")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[4px] border border-primary/30 bg-primary-soft" aria-hidden /> {t("answered")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-[4px] border border-dashed border-foreground/40" aria-hidden /> {t("unanswered")}
      </span>
      <span className="flex items-center gap-1.5">
        <Bookmark className="size-3 fill-flagged text-warning-ink" aria-hidden /> {t("forReview")}
      </span>
    </div>
  );
}

function Body({ items, current, onGo, onReview, close }: { items: NavItem[]; current: number; onGo: (i: number) => void; onReview: () => void; close: () => void }) {
  const t = useTranslations("test");
  return (
    <div className="space-y-4">
      <Legend />
      <QuestionGrid
        items={items}
        current={current}
        onGo={(i) => {
          onGo(i);
          close();
        }}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          onReview();
          close();
        }}
      >
        {t("navigator.goToReview")}
      </Button>
    </div>
  );
}

/** "Question 3 of 10" button: a popover above it on large screens, a bottom sheet on phones. */
export function NavigatorPopover({
  items,
  current,
  onGo,
  onReview,
  open,
  onOpenChange,
}: {
  items: NavItem[];
  current: number;
  onGo: (i: number) => void;
  onReview: () => void;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations("test");
  const desktop = useMediaQuery("(min-width: 1024px)");
  const label = t("questionOf", { current: current + 1, total: items.length });
  const close = () => onOpenChange(false);
  const trigger = (
    <Button
      variant="secondary"
      className="h-11 rounded-full px-4 font-semibold tabular-nums"
      title={t("navigator.open")}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={desktop ? undefined : () => onOpenChange(true)}
    >
      {label}
      <ChevronUp className={cn("transition-transform duration-200", open && "rotate-180")} aria-hidden />
    </Button>
  );
  if (!desktop) {
    return (
      <>
        {trigger}
        <MobileSheet open={open} onOpenChange={onOpenChange} title={t("navigator.title")}>
          <Body items={items} current={current} onGo={onGo} onReview={onReview} close={close} />
        </MobileSheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" className="w-[34rem] space-y-4 rounded-2xl p-5">
        <h2 className="font-semibold">{t("navigator.title")}</h2>
        <Body items={items} current={current} onGo={onGo} onReview={onReview} close={close} />
      </PopoverContent>
    </Popover>
  );
}
