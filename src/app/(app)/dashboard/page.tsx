import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Check,
  Clock,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
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
import {
  ScoreChart,
  type ScorePoint,
} from "@/components/dashboard/score-chart";
import { LiveWillo } from "@/components/mascot/live-willo";
import { PracticeCards } from "@/components/dashboard/practice-cards";
import { StreakFlames } from "@/components/dashboard/streak-flames";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("dash");
  return { title: t("title") };
}

const DAY = 86_400_000;
const card =
  "relative overflow-hidden rounded-2xl border bg-surface shadow-[var(--elev-sm)]";
const eyebrow =
  "text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase";
const h2 =
  "font-display text-[19px] leading-tight font-extrabold tracking-[-0.02em]";
const TASK_HREF: Record<PlanTask["kind"], (t: PlanTask) => string> = {
  drill: (t) => (t.skill ? `/practice?skill=${t.skill}` : "/practice"),
  review: () => "/review",
  mock: () => "/mocks",
  vocab: () => "/vocab",
  rest: () => "/plan",
};

/** One of the three key numbers: a coloured icon tile, a label, the value and a hint. */
function Kpi({
  href,
  icon,
  tone,
  label,
  value,
  extra,
  edit,
}: {
  href: string;
  icon: ReactNode;
  tone: string;
  label: string;
  value: ReactNode;
  extra?: ReactNode;
  edit?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        card,
        "flex items-center gap-4 p-4 transition-colors hover:border-foreground/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <span
        className="grid size-14 shrink-0 place-items-center rounded-2xl"
        style={{ background: `var(${tone})` }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={eyebrow}>{label}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[22px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">
            {value}
          </span>
          {extra}
        </span>
      </span>
      {edit && (
        <Pencil aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      )}
    </Link>
  );
}

/** Dashboard (masterplan §9): what to do today, where you are, are you improving, what is weak. */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
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

  const [s, top, notebook, planRow, mocks, official, activity, doneToday] =
    await Promise.all([
      getDashboardStats(user.id, tz),
      topBarStats(user.id, tz),
      notebookCounts(user.id),
      currentPlan(user.id),
      db.attempt.findMany({
        where: { userId: user.id, kind: "MOCK", status: "COMPLETED" },
        orderBy: { completedAt: "asc" },
        take: 20,
        select: { scores: true, completedAt: true },
      }),
      db.officialScore.findMany({
        where: { userId: user.id },
        orderBy: { takenOn: "asc" },
        take: 20,
        select: { total: true, takenOn: true },
      }),
      activityDays(user.id, tz, 7),
      db.attempt.groupBy({
        by: ["kind"],
        where: {
          userId: user.id,
          status: "COMPLETED",
          completedAt: { gte: dayStart },
        },
        _count: true,
      }),
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
      return typeof v === "number" && a.completedAt
        ? [{ at: a.completedAt, score: v }]
        : [];
    }),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  const latest = history.at(-1)?.score ?? null;
  const prev = history.at(-2)?.score ?? null;
  const points: ScorePoint[] = history.slice(-8).map((h) => ({
    label: format.dateTime(h.at, { month: "short", day: "numeric" }),
    score: h.score,
  }));
  const fc =
    user.testDate && history.length >= 4
      ? forecastScore(
          history.map((h) => ({ day: h.at.getTime() / DAY, score: h.score })),
          user.testDate.getTime() / DAY,
        )
      : null;

  // Today's plan. A task counts as done when a matching session was finished today.
  const done = Object.fromEntries(
    doneToday.map((d) => [d.kind, d._count]),
  ) as Record<string, number>;
  let drillsLeft = (done.DRILL ?? 0) + (done.DAILY ?? 0);
  const tasks = (plan.days.find((d) => d.date === today)?.tasks ?? [])
    .filter((k) => k.kind !== "rest")
    .map((k) => {
      const isDone =
        k.kind === "drill"
          ? drillsLeft-- > 0
          : k.kind === "review"
            ? (done.REVIEW ?? 0) > 0 || notebook.due === 0
            : k.kind === "mock"
              ? (done.MOCK ?? 0) > 0
              : false;
      const title =
        k.kind === "drill"
          ? k.skill
            ? tx(`skills.${k.skill as "INFERENCES"}`)
            : tc("tasks.drill", { count: k.count ?? 10, skill: "" })
          : k.kind === "review"
            ? tc("tasks.review", { count: k.count ?? notebook.due })
            : tc(`tasks.${k.kind}`);
      const meta =
        k.kind === "drill"
          ? t("taskDrill", { count: k.count ?? 10, min: k.minutes })
          : t("minutes", { n: k.minutes });
      return { ...k, isDone, title, meta, href: TASK_HREF[k.kind](k) };
    });
  const doneCount = tasks.filter((k) => k.isDone).length;
  const next = tasks.find((k) => !k.isDone);
  const minutesLeft = tasks
    .filter((k) => !k.isDone)
    .reduce((n, k) => n + k.minutes, 0);

  // Calendar: this month, with studied and planned days.
  const [yy, mm] = today.split("-").map(Number) as [number, number];
  const monthDays = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(yy, mm - 1, 1)).getUTCDay();
  const studied = new Set(
    activity.filter((d) => (d.count ?? 0) > 0).map((d) => d.day),
  );
  const planned = new Set(
    plan.days
      .filter((d) => d.date > today && d.tasks.some((k) => k.kind !== "rest"))
      .map((d) => d.date),
  );
  const testDay = user.testDate
    ? user.testDate.toISOString().slice(0, 10)
    : null;
  const iso = (d: number) =>
    `${yy}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format.dateTime(new Date(Date.UTC(2023, 0, 1 + i)), {
      weekday: "short",
      timeZone: "UTC",
    }),
  );

  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: tz,
    }).format(now),
  );
  const first = user.name?.split(" ")[0];
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const weak = s.weakSkills.slice(0, 3);

  // Last seven days, oldest first: a flame is lit when you answered something that day.
  const flameDays = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(`${today}T00:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - (6 - i));
    const key = dt.toISOString().slice(0, 10);
    const day = format.dateTime(dt, { weekday: "narrow", timeZone: "UTC" });
    return {
      key,
      label: day,
      lit: studied.has(key),
      litLabel: t("weekdayLit", { day }),
      dimLabel: t("weekdayDim", { day }),
    };
  });

  const greeting = (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="font-display text-[30px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[34px]">
          {t(`hello.${part}`)}{" "}
          {first && <span>{t("helloName", { name: first })}</span>}
        </h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          {top.streak > 0
            ? t("streakLine", { n: top.streak })
            : days != null && days >= 0
              ? t("context.days", { n: days })
              : t("streakLine", { n: 0 })}
        </p>
      </div>
      <StreakFlames days={flameDays} />
    </header>
  );

  if (isNew) {
    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-8 px-4 pb-10 sm:px-6 lg:px-8">
        {greeting}
        <section
          className={cn(card, "flex flex-wrap items-center gap-8 p-7 sm:p-10")}
          aria-labelledby="new-title"
        >
          <LiveWillo
            src="/mascot/deer-stand-sm.webp"
            className="w-[150px] shrink-0 max-sm:hidden"
          />
          <div className="max-w-[34rem]">
            <h2
              id="new-title"
              className="font-display text-3xl font-extrabold tracking-tight"
            >
              {t("newTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("newBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/mocks">{t("newTest")}</Link>
              </Button>
              <ScoreEntry
                today={todayUtc}
                trigger={
                  <Button size="lg" variant="secondary">
                    {t("newHave")}
                  </Button>
                }
              />
            </div>
            <Link
              href="/dashboard?start=1"
              className="mt-4 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              {t("newSkip")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const weakTop = weak[0];
  const weakPct = weakTop
    ? Math.round((weakTop.correct / weakTop.total) * 100)
    : 0;
  const TAG: Record<PlanTask["kind"], { label: string; tone: string }> = {
    drill: { label: t("tagDrill"), tone: "bg-[var(--tint-aqua)] text-primary" },
    review: {
      label: t("tagReview"),
      tone: "bg-[var(--tint-sky)] text-primary",
    },
    mock: {
      label: t("tagMock"),
      tone: "bg-[var(--tint-peach)] text-energy-ink",
    },
    vocab: {
      label: t("tagVocab"),
      tone: "bg-[var(--tint-mint)] text-correct-ink",
    },
    rest: { label: t("tagReview"), tone: "bg-surface-2 text-muted-foreground" },
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 px-4 pb-10 sm:px-6 lg:px-8">
      {greeting}

      {/* Three key numbers */}
      <div className="grid gap-4 md:grid-cols-3">
        <Kpi
          href="/plan"
          tone="--tint-peach"
          icon={<CalendarDays aria-hidden className="size-6 text-energy-ink" />}
          label={t("daysLabel")}
          value={days != null && days >= 0 ? days : "—"}
          extra={
            user.testDate ? (
              <span className="rounded-md bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                {format.dateTime(user.testDate, {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {t("setDate")}
              </span>
            )
          }
          edit
        />
        <Kpi
          href="/settings"
          tone="--tint-sky"
          icon={<Target aria-hidden className="size-6 text-primary" />}
          label={t("target")}
          value={user.targetScore ?? "—"}
          extra={
            !user.targetScore ? (
              <span className="text-xs font-semibold text-muted-foreground">
                {t("targetNone")}
              </span>
            ) : null
          }
          edit
        />
        <Kpi
          href="/analytics"
          tone="--tint-mint"
          icon={<TrendingUp aria-hidden className="size-6 text-correct-ink" />}
          label={t("estimated")}
          value={latest ?? "—"}
          extra={
            latest != null && prev != null && latest !== prev ? (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold",
                  latest > prev
                    ? "bg-[var(--tint-mint)] text-correct-ink"
                    : "bg-surface-2 text-muted-foreground",
                )}
              >
                {t("change", {
                  n: Math.abs(latest - prev),
                  dir: latest > prev ? "up" : "down",
                })}
              </span>
            ) : latest == null ? (
              <span className="text-xs font-semibold text-muted-foreground">
                {t("estimatedHint")}
              </span>
            ) : null
          }
        />
      </div>

      {/* Willo's focus: one specific, true sentence from the student's own data */}
      <section
        className={cn(
          card,
          "flex items-start gap-5 bg-linear-to-r from-[color-mix(in_oklab,var(--tint-peach),var(--surface)_55%)] to-surface p-6",
        )}
        aria-labelledby="focus-note"
      >
        <div className="relative size-16 shrink-0">
          <LiveWillo
            src="/mascot/formats/avatar-wink.png"
            className="absolute start-0 bottom-0 w-16"
          />
        </div>
        <div>
          <p
            className={cn(eyebrow, "flex items-center gap-1.5 text-energy-ink")}
          >
            <Sparkles aria-hidden className="size-3.5" />
            {t("focusTitle")}
          </p>
          <h2
            id="focus-note"
            className="mt-1.5 font-display text-lg font-extrabold tracking-[-0.015em]"
          >
            {weakTop
              ? t("focusWeak", {
                  skill: tx(`skills.${weakTop.key as "INFERENCES"}`),
                  pct: weakPct,
                })
              : t("focusNew")}
          </h2>
          <p className="mt-1.5 max-w-[640px] text-[14.5px] leading-relaxed text-muted-foreground">
            {weakTop ? t("focusWeakBody") : t("focusNewBody")}
          </p>
        </div>
      </section>

      {/* Goals (today's plan) and the estimate */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section aria-labelledby="today-title">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 id="today-title" className={h2}>
                {t("goalsTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("goalsSub")}
              </p>
            </div>
            <Link
              href="/plan"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {t("viewPlan")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div className={cn(card, "mt-3.5 flex items-center gap-5 p-6")}>
              <LiveWillo
                src="/mascot/deer-sleep-sm.webp"
                className="w-28 shrink-0"
              />
              <div>
                <p className="font-display text-xl font-extrabold">
                  {t("restTitle")}
                </p>
                <p className="mt-1 text-muted-foreground">{t("restBody")}</p>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link href="/practice">{t("restCta")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ol className={cn(card, "mt-3.5 divide-y")}>
              {tasks.map((k, i) => {
                const active = k === next;
                const tag = TAG[k.kind];
                return (
                  <li key={i}>
                    <Link
                      href={k.href}
                      className="group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] uppercase",
                            tag.tone,
                          )}
                        >
                          {tag.label}
                        </span>
                        <span
                          className={cn(
                            "mt-2 block text-[15.5px] font-bold",
                            k.isDone &&
                              "text-muted-foreground line-through decoration-border",
                          )}
                        >
                          {k.title}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <Clock aria-hidden className="size-3.5" />
                          {k.meta}
                          {k.isDone
                            ? ` · ${t("done")}`
                            : active
                              ? ` · ${t("upNext")}`
                              : ""}
                        </span>
                      </span>
                      {k.isDone ? (
                        <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-correct-ink text-white">
                          <Check
                            className="size-4"
                            strokeWidth={3}
                            aria-hidden
                          />
                          <span className="sr-only">{t("done")}</span>
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[13.5px] font-bold transition-transform group-hover:scale-[1.03]",
                            active
                              ? "bg-foreground text-background"
                              : "border bg-surface",
                          )}
                        >
                          {t("start")}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-3 text-[13px] text-muted-foreground">
            {minutesLeft > 0
              ? t("minLeft", { n: minutesLeft })
              : tasks.length
                ? t("allDone")
                : ""}
            {tasks.length
              ? ` · ${t("ringLabel", { done: doneCount, total: tasks.length })} ${t("ringCaption")}`
              : ""}
          </p>
        </section>

        <section className={cn(card, "p-6")} aria-labelledby="est-title">
          <p id="est-title" className={eyebrow}>
            {t("predictedTitle")}
          </p>
          <p className="mt-1.5 font-mono text-[40px] leading-none font-semibold tracking-[-0.04em] tabular-nums">
            {latest ?? "—"}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {latest != null ? t("predictedSub") : t("estimatedHint")}
          </p>
          {user.targetScore && latest != null && (
            <p className="mt-3 text-sm">
              {latest >= user.targetScore
                ? t("reached")
                : t.rich("toGo", {
                    n: user.targetScore - latest,
                    b: (c) => <b className="text-energy-ink">{c}</b>,
                  })}
            </p>
          )}
          <p className="mt-5 text-[13px] font-semibold">{t("focusNext")}</p>
          {weak.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("focusNone")}
            </p>
          ) : (
            <ul className="mt-1.5 divide-y">
              {weak.map((w) => {
                const pct = Math.round((w.correct / w.total) * 100);
                return (
                  <li key={w.key}>
                    <Link
                      href={`/practice?skill=${w.key}`}
                      className="flex h-10 items-center justify-between gap-3 text-[13.5px] hover:text-primary"
                    >
                      <span className="truncate">
                        {tx(`skills.${w.key as "INFERENCES"}`)}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[13px] font-semibold tabular-nums",
                          pct < 60 && "text-energy-ink",
                        )}
                      >
                        {pct}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">{t("focusNote")}</p>
        </section>
      </div>

      <PracticeCards due={notebook.due} />

      {/* Score journey and the study calendar */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className={cn(card, "p-6")} aria-labelledby="journey-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="journey-title" className={h2}>
              {t("journey")}
            </h2>
            {user.targetScore &&
              latest != null &&
              latest < user.targetScore && (
                <p className="text-[13px] text-muted-foreground">
                  {t.rich("journeyTarget", {
                    target: user.targetScore,
                    n: user.targetScore - latest,
                    b: (c) => <b className="text-energy-ink">{c}</b>,
                  })}
                </p>
              )}
          </div>
          {points.length >= 4 ? (
            <div className="mt-4">
              <ScoreChart
                points={points}
                target={user.targetScore ?? undefined}
                forecast={
                  fc && user.testDate
                    ? {
                        label: format.dateTime(user.testDate, {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }),
                        ...fc,
                      }
                    : null
                }
                labels={{
                  estimate: t("forecast"),
                  table: t("showTable"),
                  date: t("colDate"),
                  score: t("colScore"),
                }}
              />
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-start gap-3 rounded-xl bg-surface-2 p-5">
              <p className="font-display text-lg font-bold">
                {t("progressFew")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("progressFewBody", { n: history.length })}
              </p>
              <ScoreEntry
                today={todayUtc}
                trigger={
                  <Button size="sm" variant="secondary">
                    {t("newHave")}
                  </Button>
                }
              />
            </div>
          )}
        </section>

        <section className={cn(card, "p-6")} aria-labelledby="cal-title">
          <h2 id="cal-title" className={h2}>
            {format.dateTime(now, {
              month: "long",
              year: "numeric",
              timeZone: tz,
            })}
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
          <div
            className="mt-4 grid grid-cols-7 gap-y-1 text-center"
            role="img"
            aria-label={t("calAlt", {
              studied: [...studied].filter((d) =>
                d.startsWith(today.slice(0, 7)),
              ).length,
            })}
          >
            {weekdays.map((d) => (
              <span
                key={d}
                className="pb-1 text-xs font-semibold text-muted-foreground"
              >
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
              const dot = studied.has(key)
                ? "bg-brand-b"
                : planned.has(key)
                  ? "bg-energy-2"
                  : null;
              return (
                <span
                  key={d}
                  className="relative mx-auto grid h-9 w-9 place-items-center"
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-[15px] tabular-nums",
                      isToday
                        ? "bg-foreground font-bold text-background"
                        : key === testDay
                          ? "font-bold text-energy-ink ring-2 ring-energy"
                          : key < today
                            ? "text-muted-foreground"
                            : "font-medium",
                    )}
                  >
                    {d}
                  </span>
                  {dot && !isToday && (
                    <i
                      className={cn(
                        "absolute bottom-0 size-[5px] rounded-full",
                        dot,
                      )}
                    />
                  )}
                </span>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
