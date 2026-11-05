import { getTranslations } from "next-intl/server";
import { CalendarDays, Flame, Gauge, Zap } from "lucide-react";
import { daysUntil } from "@/lib/goals";
import type { TopBarStats } from "@/server/stats/topbar";
import { cn } from "@/lib/utils";

/** Top bar stats (brief §5): days to the SAT, streak, XP and estimated score. Compact on phones. */
export async function TopStats({ stats, testDate }: { stats: TopBarStats; testDate: Date | null }) {
  const t = await getTranslations("shell");
  const days = testDate ? daysUntil(testDate) : null;
  const pill = "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 font-display text-sm font-extrabold tabular-nums";
  return (
    <ul className="flex items-center gap-0.5 sm:gap-1">
      {days != null && days >= 0 && (
        <li className={cn(pill, "text-muted-foreground")} title={t("daysLeft", { days })}>
          <CalendarDays className="size-4" aria-hidden />
          <span aria-hidden>{days}</span>
          <span className="sr-only">{t("daysLeft", { days })}</span>
        </li>
      )}
      <li className={cn(pill, stats.streak > 0 ? "text-accent-ink" : "text-muted-foreground")} title={t("streak", { count: stats.streak })}>
        <Flame className={cn("size-4", stats.streak > 0 && "fill-current text-accent")} aria-hidden />
        <span aria-hidden>{stats.streak}</span>
        <span className="sr-only">{t("streak", { count: stats.streak })}</span>
      </li>
      <li className={cn(pill, "text-primary")} title={t("xp", { count: stats.xp })}>
        <Zap className="size-4 fill-current" aria-hidden />
        <span aria-hidden>{stats.xp}</span>
        <span className="sr-only">{t("xp", { count: stats.xp })}</span>
      </li>
      {stats.score != null && (
        <li className={cn(pill, "hidden text-foreground sm:inline-flex")} title={t("score", { score: stats.score })}>
          <Gauge className="size-4 text-muted-foreground" aria-hidden />
          <span aria-hidden>{stats.score}</span>
          <span className="sr-only">{t("score", { score: stats.score })}</span>
        </li>
      )}
    </ul>
  );
}
