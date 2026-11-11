import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Check, Clock, Play } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { activityDays } from "@/server/stats/analytics";
import { topBarStats } from "@/server/stats/topbar";
import { notebookCounts } from "@/server/review/service";
import { currentPlan } from "@/server/coach/service";
import { db } from "@/lib/db";
import { daysUntil } from "@/lib/goals";
import { forecastScore } from "@/lib/stats/forecast";
import { dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import type { PlanTask, WeeklyPlan } from "@/lib/coach/plan";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ScoreEntry } from "@/components/learning/score-entry";
import { ScoreChart, type ScorePoint } from "@/components/dashboard/score-chart";
import { GoalRing } from "@/components/dashboard/goal-ring";
import { Willo } from "@/components/mascot/willo";
import { BooksArt, CalendarArt, Cloud, FlagArt, FlameArt, GrowthArt, NotebookArt, Spark, TargetArt, Waves } from "@/components/illustration/spots";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("dash");
  return { title: t("title") };
}

const DAY = 86_400_000;
const card = "relative overflow-hidden rounded-[28px] border border-white/80 shadow-[var(--shadow-card)] dark:border-white/5";
const h2 = "font-display text-[21px] leading-tight font-extrabold tracking-[-0.02em]";
const TASK_HREF: Record<PlanTask["kind"], (t: PlanTask) => string> = {
  drill: (t) => (t.skill ? `/practice?skill=${t.skill}` : "/practice"),
  review: () => "/review",
  mock: () => "/mocks",
  vocab: () => "/vocab",
  rest: () => "/plan",
};

/** A tinted stat card with one illustration blending into its corner (masterplan §5, §9). */
function Stat({ href, tint, label, value, sub, art, artClass }: { href: string; tint: string; label: string; value: ReactNode; sub: ReactNode; art: ReactNode; artClass: string }) {
  return (
    <Link
      href={href}
      className={cn(card, "group block h-[150px] w-[240px] shrink-0 snap-start transition-transform duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-auto")}
      style={{ background: `linear-gradient(135deg, var(${tint}) 0%, var(--surface) 78%)` }}
    >
      <Cloud className="absolute end-0 bottom-0 h-14 w-[70%] opacity-70" color={`var(${tint})`} />
      <div className={cn("pointer-events-none absolute transition-transform duration-500 ease-out group-hover:-translate-x-0.5 group-hover:-translate-y-0.5", artClass)}>{art}</div>
      <div className="relative max-w-[66%] p-6">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1.5 font-display text-[34px] leading-none font-extrabold tracking-[-0.035em] whitespace-nowrap tabular-nums">{value}</p>
        <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{sub}</p>
      </div>
    </Link>
  );
}

/** Dashboard (masterplan §9): what to do today, where you are, are you improving, what is weak. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("dash");
  const tc = await getTranslations("coach");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const { start } = await searchParams;
  const tz = user.timeZone;
  const now = new Date();
  const today = dayInZone(now, tz);
  const dayStart = startOfDayInZone(now, tz);

  const [s, top, notebook, planRow, mocks, official, activity, doneToday] = await Promise.all([
    getDashboardStats(user.id, tz),
    topBarStats(user.id, tz),
    notebookCounts(user.id),
    currentPlan(user.id),
    db.attempt.findMany({ where: { userId: user.id, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 20, select: { scores: true, completedAt: true } }),
    db.officialScore.findMany({ where: { userId: user.id }, orderBy: { takenOn: "asc" }, take: 20, select: { total: true, takenOn: true } }),
    activityDays(user.id, tz, 7),
    db.attempt.groupBy({ by: ["kind"], where: { userId: user.id, status: "COMPLETED", completedAt: { gte: dayStart } }, _count: true }),
  ]);

  const plan = planRow.plan as unknown as WeeklyPlan;
  const todayUtc = now.toISOString().slice(0, 10);
  const isNew = s.answered === 0 && top.score == null && start !== "1";
  const days = user.testDate ? daysUntil(user.testDate) : null;

  // Scores over time: official scores and practice tests, oldest first.
  const history = [
    ...official.map((o) => ({ at: o.takenOn, score: o.total })),
    ...mocks.flatMap((a) => {
      const v = (a.scores as ScoreEstimate | null)?.total?.score;
      return typeof v === "number" && a.completedAt ? [{ at: a.completedAt, score: v }] : [];
    }),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  const latest = history.at(-1)?.score ?? null;
  const prev = history.at(-2)?.score ?? null;
  const points: ScorePoint[] = history.slice(-8).map((h) => ({ label: format.dateTime(h.at, { month: "short", day: "numeric" }), score: h.score }));
  const fc = user.testDate && history.length >= 4 ? forecastScore(history.map((h) => ({ day: h.at.getTime() / DAY, score: h.score })), user.testDate.getTime() / DAY) : null;

  // Today's plan. A task counts as done when a matching session was finished today.
  const done = Object.fromEntries(doneToday.map((d) => [d.kind, d._count])) as Record<string, number>;
  let drillsLeft = (done.DRILL ?? 0) + (done.DAILY ?? 0);
  const tasks = (plan.days.find((d) => d.date === today)?.tasks ?? [])
    .filter((k) => k.kind !== "rest")
    .map((k) => {
      const isDone = k.kind === "drill" ? drillsLeft-- > 0 : k.kind === "review" ? (done.REVIEW ?? 0) > 0 || notebook.due === 0 : k.kind === "mock" ? (done.MOCK ?? 0) > 0 : false;
      const title = k.kind === "drill" ? (k.skill ? tx(`skills.${k.skill as "INFERENCES"}`) : tc("tasks.drill", { count: k.count ?? 10, skill: "" })) : k.kind === "review" ? tc("tasks.review", { count: k.count ?? notebook.due }) : tc(`tasks.${k.kind}`);
      const meta = k.kind === "drill" ? t("taskDrill", { count: k.count ?? 10, min: k.minutes }) : t("minutes", { n: k.minutes });
      return { ...k, isDone, title, meta, href: TASK_HREF[k.kind](k) };
    });
  const doneCount = tasks.filter((k) => k.isDone).length;
  const next = tasks.find((k) => !k.isDone);
  const minutesLeft = tasks.filter((k) => !k.isDone).reduce((n, k) => n + k.minutes, 0);

  // Calendar: this month, with studied and planned days.
  const [yy, mm] = today.split("-").map(Number) as [number, number];
  const monthDays = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay();
  const studied = new Set(activity.filter((d) => (d.count ?? 0) > 0).map((d) => d.day));
  const planned = new Set(plan.days.filter((d) => d.date > today && d.tasks.some((k) => k.kind !== "rest")).map((d) => d.date));
  const testDay = user.testDate ? user.testDate.toISOString().slice(0, 10) : null;
  const iso = (d: number) => `${yy}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekdays = Array.from({ length: 7 }, (_, i) => format.dateTime(new Date(Date.UTC(2023, 0, 1 + i)), { weekday: "short", timeZone: "UTC" }));

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
  const first = user.name?.split(" ")[0];
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const weak = s.weakSkills.slice(0, 3);

  const greeting = (
    <header className="relative flex min-h-[200px] items-end justify-between gap-6 pt-2">
      <Waves className="pointer-events-none absolute -end-8 bottom-0 hidden h-36 w-[58%] opacity-80 md:block" a="var(--tint-aqua)" b="var(--tint-peach)" />
      <div className="relative pb-6">
        <h1 className="font-display text-[40px] leading-[1.04] font-extrabold tracking-[-0.04em] sm:text-[54px]">
          {t(`hello.${part}`)}
          {first && (
            <>
              <br />
              <span className="bg-(image:--grad-energy) bg-clip-text text-transparent">{t("helloName", { name: first })}</span>
            </>
          )}
        </h1>
        <p className="mt-3 text-[17px] text-muted-foreground">{days != null && days >= 0 ? t("context.days", { n: days }) : top.streak > 1 ? t("context.streak", { n: top.streak }) : t("context.plain")}</p>
        <svg width="92" height="8" viewBox="0 0 92 8" className="mt-1" aria-hidden>
          <path d="M2 5 C26 0 60 0 90 4" stroke="var(--energy)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div className="relative hidden shrink-0 pe-6 md:block">
        <svg viewBox="0 0 60 60" className="absolute -start-10 top-6 w-8" aria-hidden>
          <Spark cx={30} cy={30} s={16} fill="#FFB36B" />
        </svg>
        <svg viewBox="0 0 60 60" className="absolute -end-2 top-10 w-10" aria-hidden>
          <Spark cx={30} cy={30} s={18} />
        </svg>
        <Willo pose={isNew ? "stand" : doneCount > 0 && doneCount === tasks.length ? "cheer" : "wink"} className="w-[200px]" shadow={false} />
      </div>
    </header>
  );

  if (isNew) {
    return (
      <div className="mx-auto w-full max-w-[1240px] space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
        {greeting}
        <section className={cn(card, "bg-surface p-7 sm:p-10")} aria-labelledby="new-title">
          <div className="pointer-events-none absolute -end-6 -bottom-6 w-56 opacity-95 max-sm:hidden">
            <TargetArt />
          </div>
          <div className="relative max-w-[34rem]">
            <h2 id="new-title" className="font-display text-3xl font-extrabold tracking-tight">
              {t("newTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("newBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/mocks">{t("newTest")}</Link>
              </Button>
              <ScoreEntry today={todayUtc} trigger={<Button size="lg" variant="secondary">{t("newHave")}</Button>} />
            </div>
            <Link href="/dashboard?start=1" className="mt-4 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground">
              {t("newSkip")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
      {greeting}

      {/* Four stats, each with its illustration */}
      <div className="swipe-row -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        <Stat
          href="/settings"
          tint="--tint-peach"
          label={t("target")}
          value={user.targetScore ?? "—"}
          sub={user.targetScore ? (latest != null ? (latest >= user.targetScore ? t("reached") : t.rich("toGo", { n: user.targetScore - latest, b: (c) => <b className="text-energy-ink">{c}</b> })) : t("estimatedHint")) : t("targetNone")}
          art={<TargetArt />}
          artClass="-end-3 -bottom-4 w-[150px]"
        />
        <Stat
          href="/analytics"
          tint="--tint-mint"
          label={t("estimated")}
          value={latest ?? "—"}
          sub={
            latest == null ? (
              t("estimatedHint")
            ) : prev != null && latest !== prev ? (
              <>
                <b className={latest > prev ? "text-correct-ink" : undefined}>{t("change", { n: Math.abs(latest - prev), dir: latest > prev ? "up" : "down" })}</b> {t("sinceLast")}
              </>
            ) : (
              t("sinceLast")
            )
          }
          art={<GrowthArt />}
          artClass="-end-4 -bottom-5 w-[136px]"
        />
        <Stat href="/plan" tint="--tint-sky" label={t("daysLabel")} value={days != null && days >= 0 ? t("daysValue", { n: days }) : "—"} sub={user.testDate ? t("testOn", { date: format.dateTime(user.testDate, { month: "long", day: "numeric", timeZone: "UTC" }) }) : t("setDate")} art={<CalendarArt />} artClass="-end-1 -bottom-6 w-[112px]" />
        <Stat href="/history" tint="--tint-peach" label={t("streakLabel")} value={t("daysValue", { n: top.streak })} sub={top.streak > 0 ? t("streakOn") : t("streakStart")} art={<FlameArt />} artClass="end-1 -bottom-5 w-[100px]" />
      </div>

      {/* Today's plan and the calendar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={cn(card, "bg-linear-to-br from-surface to-[color-mix(in_oklab,var(--tint-peach),var(--surface)_70%)] p-6 sm:p-7")} aria-labelledby="today-title">
          <Waves className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full opacity-70" />
          <div className="relative flex items-center justify-between gap-3">
            <h2 id="today-title" className={cn(h2, "flex items-center gap-3")}>
              <span className="grid size-10 place-items-center rounded-full bg-(image:--grad-energy) text-white shadow-[var(--glow-energy)]">
                <Play className="size-4 fill-current" aria-hidden />
              </span>
              {t("todayPlan")}
            </h2>
            <Link href="/plan" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
              {t("viewPlan")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="relative mt-6 flex items-center gap-5 pb-4">
              <Willo pose="sleep" className="w-32" shadow={false} />
              <div>
                <p className="font-display text-xl font-extrabold">{t("restTitle")}</p>
                <p className="mt-1 text-muted-foreground">{t("restBody")}</p>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link href="/practice">{t("restCta")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative mt-5 grid gap-6 md:grid-cols-[210px_minmax(0,1fr)]">
              <div className="relative flex flex-col items-center max-md:hidden">
                <GoalRing value={doneCount} goal={tasks.length} label={t("ringLabel", { done: doneCount, total: tasks.length })} caption={t("ringCaption")} tone="energy" />
                <span className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-surface/90 px-4 text-[13px] font-semibold shadow-[var(--elev-sm)]">
                  <Clock className="size-4 text-muted-foreground" aria-hidden />
                  {minutesLeft > 0 ? t("minLeft", { n: minutesLeft }) : t("allDone")}
                </span>
                <div className="pointer-events-none absolute -start-12 -bottom-12 w-28">
                  <BooksArt />
                </div>
              </div>
              <ol className="relative space-y-1.5">
                {tasks.map((k, i) => {
                  const active = k === next;
                  return (
                    <li key={i} className="relative">
                      {i < tasks.length - 1 && <span aria-hidden className={cn("absolute start-[30px] top-[52px] h-[calc(100%-36px)] w-0.5 rounded-full", k.isDone ? "bg-correct" : "bg-border")} />}
                      <Link
                        href={k.href}
                        className={cn(
                          "group flex min-h-[70px] items-center gap-4 rounded-[22px] px-4 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          active ? "bg-(image:--grad-nav)" : "hover:bg-surface/70",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-[30px] shrink-0 place-items-center rounded-full",
                            k.isDone ? "bg-correct-ink text-white" : active ? "bg-(image:--grad-energy) text-white shadow-[var(--glow-energy)]" : "border-2 border-input/50 bg-surface",
                          )}
                        >
                          {k.isDone ? <Check className="size-4" strokeWidth={3.2} aria-hidden /> : active ? <Play className="size-3 fill-current" aria-hidden /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[17px] font-bold", k.isDone && "text-muted-foreground line-through decoration-border")}>{k.title}</span>
                          <span className="block text-[13px] text-muted-foreground">
                            {k.meta}
                            {k.isDone ? ` · ${t("done")}` : active ? ` · ${t("upNext")}` : ""}
                          </span>
                        </span>
                        {active && (
                          <span className="grid size-[46px] shrink-0 place-items-center rounded-full bg-(image:--grad-energy) text-white shadow-[var(--glow-energy)] transition-transform group-hover:scale-105">
                            <Play className="size-[18px] fill-current" aria-hidden />
                            <span className="sr-only">{t("start")}</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>

        <section className={cn(card, "bg-surface p-6")} aria-labelledby="cal-title">
          <Cloud className="pointer-events-none absolute inset-x-0 bottom-0 h-14 w-full opacity-60" color="var(--tint-aqua)" />
          <div className="pointer-events-none absolute end-3 -bottom-1 w-[72px]">
            <FlagArt />
          </div>
          <h2 id="cal-title" className={h2}>
            {format.dateTime(now, { month: "long", year: "numeric", timeZone: tz })}
          </h2>
          <p className="mt-1.5 flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-brand-b" />
              {t("studied")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="size-2 rounded-full bg-energy-2" />
              {t("planned")}
            </span>
          </p>
          <div className="relative mt-4 grid grid-cols-7 gap-y-1 pb-10 text-center" role="img" aria-label={t("calAlt", { studied: [...studied].filter((d) => d.startsWith(today.slice(0, 7))).length })}>
            {weekdays.map((d) => (
              <span key={d} className="pb-1 text-xs font-semibold text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: firstDow }, (_, i) => (
              <span key={`e${i}`} />
            ))}
            {Array.from({ length: monthDays }, (_, i) => {
              const d = i + 1;
              const key = iso(d);
              const isToday = key === today;
              const dot = studied.has(key) ? "bg-brand-b" : planned.has(key) ? "bg-energy-2" : null;
              return (
                <span key={d} className="relative mx-auto grid h-9 w-9 place-items-center">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-[15px] tabular-nums",
                      isToday ? "bg-(image:--grad-cta) font-bold text-primary-foreground shadow-[var(--glow-energy)]" : key === testDay ? "font-bold text-energy-ink ring-2 ring-energy" : key < today ? "text-muted-foreground" : "font-medium",
                    )}
                  >
                    {d}
                  </span>
                  {dot && !isToday && <i className={cn("absolute bottom-0 size-[5px] rounded-full", dot)} />}
                </span>
              );
            })}
          </div>
        </section>
      </div>

      {/* Score journey, focus areas, mistake notebook */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className={cn(card, "bg-surface p-6 sm:p-7 lg:col-span-2 xl:col-span-1")} aria-labelledby="journey-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="journey-title" className={h2}>
              {t("journey")}
            </h2>
            {user.targetScore && latest != null && latest < user.targetScore && <p className="text-[13px] text-muted-foreground">{t.rich("journeyTarget", { target: user.targetScore, n: user.targetScore - latest, b: (c) => <b className="text-energy-ink">{c}</b> })}</p>}
          </div>
          {points.length >= 4 ? (
            <div className="mt-4">
              <ScoreChart
                points={points}
                target={user.targetScore ?? undefined}
                forecast={fc && user.testDate ? { label: format.dateTime(user.testDate, { month: "short", day: "numeric", timeZone: "UTC" }), ...fc } : null}
                labels={{ estimate: t("forecast"), table: t("showTable"), date: t("colDate"), score: t("colScore") }}
              />
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-start gap-3 rounded-[20px] bg-surface-2 p-5">
              <p className="font-display text-lg font-bold">{t("progressFew")}</p>
              <p className="text-sm text-muted-foreground">{t("progressFewBody", { n: history.length })}</p>
              <ScoreEntry today={todayUtc} trigger={<Button size="sm" variant="secondary">{t("newHave")}</Button>} />
            </div>
          )}
        </section>

        <section className={cn(card, "bg-linear-to-br from-[color-mix(in_oklab,var(--tint-peach),var(--surface)_55%)] to-surface p-6 sm:p-7")} aria-labelledby="focus-title">
          <h2 id="focus-title" className={h2}>
            {t("focusAreas")}
          </h2>
          {weak.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("focusNone")}</p>
          ) : (
            <ul className="mt-5 space-y-5">
              {weak.map((w) => {
                const pct = Math.round((w.correct / w.total) * 100);
                return (
                  <li key={w.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-bold">{tx(`skills.${w.key as "INFERENCES"}`)}</span>
                      <span className="text-[13px] font-bold text-energy-ink tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-(image:--grad-energy)" style={{ width: `${pct}%` }} />
                      </div>
                      <Button asChild size="xs" variant="secondary" className="h-8 px-3.5">
                        <Link href={`/practice?skill=${w.key}`}>{t("topicsDrill")}</Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-5 text-[13px] text-muted-foreground">{t("focusNote")}</p>
        </section>

        <section className={cn(card, "bg-linear-to-br from-tint-peach to-surface p-6 sm:p-7")} aria-labelledby="nb-title">
          <Cloud className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full opacity-60" color="var(--energy-soft)" />
          <div className="pointer-events-none absolute -end-7 -bottom-6 w-[170px]">
            <NotebookArt />
          </div>
          <h2 id="nb-title" className={cn(h2, "relative")}>
            {t("notebook")}
          </h2>
          <div className="relative max-w-[58%]">
            <p className="mt-5 font-display text-[54px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{notebook.due}</p>
            <p className="mt-1 text-[15px] font-semibold text-muted-foreground">{t("dueToday")}</p>
            <p className="mt-2 text-[13px] text-muted-foreground">{t("savedTotal", { n: notebook.total })}</p>
            {notebook.due > 0 ? (
              <Button asChild className="mt-5">
                <Link href="/review">
                  {t("reviewNow")}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" className="mt-5">
                <Link href="/review">{t("openNotebook")}</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
