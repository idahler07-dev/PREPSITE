import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { daysUntil } from "@/lib/goals";

/** Test-day countdown for students who set a test date. */
export async function CountdownChip({ testDate }: { testDate: Date | null }) {
  if (!testDate) return null;
  const days = daysUntil(testDate);
  if (days < 0) return null;
  const t = await getTranslations("shell");
  const date = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(testDate);
  return (
    <span
      className="inline-flex h-9 items-center gap-2 rounded-full bg-accent-soft px-3 text-sm font-semibold text-foreground"
      title={t("countdownLabel", { date })}
      aria-label={`${t("countdown", { days })}. ${t("countdownLabel", { date })}`}
    >
      <CalendarDays className="size-4 text-accent-ink" aria-hidden />
      <span className="hidden tabular-nums sm:inline" data-numeric>
        {t("countdown", { days })}
      </span>
      <span className="tabular-nums sm:hidden" data-numeric>
        {t("countdownShort", { days })}
      </span>
    </span>
  );
}
