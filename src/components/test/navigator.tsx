"use client";

import { useTranslations } from "next-intl";
import { Bookmark, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface NavItem {
  answered: boolean;
  flagged: boolean;
}

export function QuestionGrid({ items, current, onGo }: { items: NavItem[]; current: number | null; onGo: (i: number) => void }) {
  const t = useTranslations("test");
  return (
    <ol className="grid grid-cols-6 gap-2 sm:grid-cols-10">
      {items.map((it, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => onGo(i)}
            aria-current={i === current ? "step" : undefined}
            aria-label={`${t("questionOf", { current: i + 1, total: items.length })}${it.answered ? `, ${t("navigator.answered")}` : `, ${t("navigator.unanswered")}`}${it.flagged ? `, ${t("navigator.forReview")}` : ""}`}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-[10px] border-2 font-mono text-sm font-semibold transition-colors",
              it.flagged ? "border-flagged bg-flagged text-on-fill" : it.answered ? "border-primary bg-primary text-primary-foreground" : "border-dashed border-input",
              i === current && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )}
          >
            {i + 1}
            {it.flagged && <Bookmark className="absolute -end-1.5 -top-1.5 size-4 fill-flagged text-warning-ink" aria-hidden />}
          </button>
        </li>
      ))}
    </ol>
  );
}

export function Legend() {
  const t = useTranslations("test.navigator");
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border-2 border-primary bg-primary" aria-hidden /> {t("answered")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm border-2 border-dashed border-foreground/40" aria-hidden /> {t("unanswered")}
      </span>
      <span className="flex items-center gap-1.5">
        <Bookmark className="size-3 fill-flagged text-warning-ink" aria-hidden /> {t("forReview")}
      </span>
    </div>
  );
}

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
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="font-semibold" title={t("navigator.open")}>
          {t("questionOf", { current: current + 1, total: items.length })}
          <ChevronUp aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-[min(92vw,34rem)] space-y-4">
        <h2 className="font-semibold">{t("navigator.title")}</h2>
        <Legend />
        <QuestionGrid
          items={items}
          current={current}
          onGo={(i) => {
            onGo(i);
            onOpenChange(false);
          }}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onReview();
            onOpenChange(false);
          }}
        >
          {t("navigator.goToReview")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
