import { getTranslations } from "next-intl/server";
import { Flame } from "lucide-react";
import type { TopBarStats } from "@/server/stats/topbar";
import { cn } from "@/lib/utils";

/** Top bar (v3 plan §5): the study streak. The score and XP live on the dashboard. */
export async function TopStats({ stats }: { stats: TopBarStats }) {
  const t = await getTranslations("shell");
  return (
    <span
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 font-display text-sm font-extrabold tabular-nums", stats.streak > 0 ? "text-accent-ink" : "text-muted-foreground")}
      title={t("streak", { count: stats.streak })}
    >
      <Flame className={cn("size-4", stats.streak > 0 && "fill-current text-accent")} aria-hidden />
      <span aria-hidden>{stats.streak}</span>
      <span className="sr-only">{t("streak", { count: stats.streak })}</span>
    </span>
  );
}
