import { getFormatter, getTranslations } from "next-intl/server";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { currentPlan } from "@/server/coach/service";
import { db } from "@/lib/db";
import { addDays, dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import { mondayOf, type WeeklyPlan } from "@/lib/coach/plan";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusTimer } from "@/components/focus/focus-timer";
import { Deer } from "@/components/mascot/deer";

export async function generateMetadata() {
  const t = await getTranslations("focus");
  return { title: t("title") };
}

/** Focus sessions (Detail pattern): the current session, and its history. */
export default async function FocusPage() {
  const user = await requireUser("/focus");
  const t = await getTranslations("focus");
  const tc = await getTranslations("coach");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const tz = user.timeZone;
  const today = dayInZone(new Date(), tz);
  const dayStart = startOfDayInZone(new Date(), tz);
  const weekStart = startOfDayInZone(new Date(`${mondayOf(today)}T12:00:00Z`), tz);

  const [planRow, week, recent] = await Promise.all([
    currentPlan(user.id),
    db.focusSession.findMany({ where: { userId: user.id, startedAt: { gte: weekStart } }, select: { startedAt: true, focusedSeconds: true } }),
    db.focusSession.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, take: 20 }),
  ]);

  // Today's plan tasks become one-tap labels for the session.
  const plan = planRow.plan as unknown as WeeklyPlan;
  const tasks = (plan.days.find((d) => d.date === today)?.tasks ?? [])
    .filter((k) => k.kind !== "rest")
    .map((k) => (k.kind === "drill" ? tc("tasks.drill", { count: k.count ?? 10, skill: k.skill ? tx(`skills.${k.skill as "INFERENCES"}`) : "" }) : k.kind === "review" ? tc("tasks.review", { count: k.count ?? 0 }) : tc(`tasks.${k.kind}`)));

  const todays = week.filter((w) => w.startedAt >= dayStart);
  const min = (secs: number) => Math.round(secs / 60);
  const todayMin = min(todays.reduce((n, w) => n + w.focusedSeconds, 0));
  const weekMin = min(week.reduce((n, w) => n + w.focusedSeconds, 0));
  const dayLabel = (d: Date) => {
    const k = dayInZone(d, tz);
    return k === today ? t("today") : k === addDays(today, -1) ? t("yesterday") : format.dateTime(d, { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  };

  return (
    <Container className="max-w-[1080px]">
      <PageHeader
        title={t("title")}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-base">
            <span>{t("todayMeta", { count: todays.length, minutes: todayMin })}</span>
            <span aria-hidden className="text-border">
              {"|"}
            </span>
            <span>{t("weekMeta", { minutes: weekMin })}</span>
          </span>
        }
      />
      <Tabs defaultValue="timer">
        <TabsList>
          <TabsTrigger value="timer">{t("tabs.timer")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="pt-8">
          <FocusTimer tasks={tasks} />
        </TabsContent>
        <TabsContent value="history" className="pt-6">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-surface px-6 py-12 text-center">
              <Deer pose="sleep" className="w-32" />
              <p className="font-semibold">{t("emptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t("emptyBody")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-[var(--radius-panel)] border border-border bg-surface">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  {r.completed ? <CheckCircle2 className="size-5 shrink-0 text-correct-ink" aria-label={t("completed")} /> : <CircleDashed className="size-5 shrink-0 text-muted-foreground" aria-label={t("stopped")} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.label ?? t("untitled")}</span>
                    <span className="block text-xs text-muted-foreground">
                      {dayLabel(r.startedAt)}
                      {" · "}
                      {format.dateTime(r.startedAt, { hour: "numeric", minute: "2-digit", timeZone: tz })}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{t("minutes", { n: min(r.focusedSeconds) })}</span>
                  <span className="hidden w-20 text-end text-xs text-muted-foreground sm:block">{t("of", { n: r.plannedMinutes })}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </Container>
  );
}
