import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUpRight, ClipboardList, NotebookPen, PenLine, Play } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { topBarStats } from "@/server/stats/topbar";
import { notebookCounts } from "@/server/review/service";
import { currentPlan } from "@/server/coach/service";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";
import { forecastScore } from "@/lib/stats/forecast";
import { addDays, dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import { mondayOf, type WeeklyPlan } from "@/lib/coach/plan";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ScoreEntry } from "@/components/learning/score-entry";
import { ScoreChart, type ScorePoint } from "@/components/dashboard/score-chart";
import { GoalRing } from "@/components/dashboard/goal-ring";
import { StudyPlanScene } from "@/components/illustration/scenes";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("dash");
  return { title: t("title") };
}

const DAY = 86_400_000;
const card = "rounded-[var(--radius-panel)] border border-border bg-surface p-5 shadow-[var(--elev-sm)] sm:p-6";
const cardTitle = "font-display text-[15px] font-bold tracking-tight";

/** Dashboard (v3 plan §7.1): eight sections, real data only. */
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("dash");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const { start } = await searchParams;
  const tz = user.timeZone;
  const today = dayInZone(new Date(), tz);
  const monday = mondayOf(today);
  const weekSince = startOfDayInZone(new Date(`${monday}T12:00:00Z`), tz);

  const [s, top, notebook, planRow, mocks, official, weekTime, sectionPace] = await Promise.all([
    getDashboardStats(user.id, tz),
    topBarStats(user.id, tz),
    notebookCounts(user.id),
    currentPlan(user.id),
    db.attempt.findMany({ where: { userId: user.id, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 20, select: { scores: true, completedAt: true } }),
    db.officialScore.findMany({ where: { userId: user.id }, orderBy: { takenOn: "asc" }, take: 20, select: { total: true, takenOn: true } }),
    db.$queryRaw<{ ms: number | null }[]>`
      SELECT sum(r."timeSpentMs")::float AS ms FROM "Response" r
      JOIN "AttemptModule" m ON m."id" = r."moduleId" JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${user.id} AND r."answeredAt" >= ${weekSince}`,
    db.$queryRaw<{ section: "RW" | "MATH"; avg_ms: number | null }[]>`
      SELECT q."section"::text AS section, avg(r."timeSpentMs") FILTER (WHERE r."timeSpentMs" > 0)::float AS avg_ms FROM "Response" r
      JOIN "Question" q ON q."id" = r."questionId" JOIN "AttemptModule" m ON m."id" = r."moduleId" JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${user.id} AND r."answer" IS NOT NULL GROUP BY 1`,
  ]);

  const plan = planRow.plan as unknown as WeeklyPlan;
  const todayUtc = new Date().toISOString().slice(0, 10);
  const isNew = s.answered === 0 && top.score == null && start !== "1";

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
  const fc =
    user.testDate && history.length >= 4
      ? forecastScore(
          history.map((h) => ({ day: h.at.getTime() / DAY, score: h.score })),
          user.testDate.getTime() / DAY,
        )
      : null;

  // This week: minutes studied against the plan's minutes.
  const weekMin = Math.round((weekTime[0]?.ms ?? 0) / 60000);
  const goalMin = plan.days.filter((d) => d.date >= monday && d.date <= addDays(monday, 6)).reduce((n, d) => n + d.tasks.reduce((m, k) => m + k.minutes, 0), 0) || plan.minutesPerDay * 5;
  const hm = (min: number) => (min >= 60 ? t("hm", { h: Math.floor(min / 60), m: min % 60 }) : t("minutes", { n: min }));

  // Recommended next: due reviews, today's plan, or the weakest skill.
  const todayTask = plan.days.find((d) => d.date === today)?.tasks.find((k) => k.kind !== "rest");
  const weak = s.weakSkills[0]?.key ?? plan.focusSkills[0];
  const rec =
    notebook.due >= 5
      ? { why: t("nextWhy.review"), title: t("nextReview"), meta: t("nextReviewMeta", { count: notebook.due }), href: "/review", Icon: NotebookPen }
      : todayTask?.kind === "mock"
        ? { why: t("nextWhy.mock"), title: t("nextMock"), meta: t("nextMockMeta"), href: "/mocks", Icon: ClipboardList }
        : todayTask?.kind === "drill" && todayTask.skill
          ? { why: t("nextWhy.plan"), title: tx(`skills.${todayTask.skill as "INFERENCES"}`), meta: t("nextDrillMeta", { count: todayTask.count ?? 10, min: todayTask.minutes }), href: `/practice?skill=${todayTask.skill}`, Icon: PenLine }
          : weak
            ? { why: s.weakSkills.length ? t("nextWhy.weak") : t("nextWhy.start"), title: tx(`skills.${weak as "INFERENCES"}`), meta: t("nextDrillMeta", { count: 10, min: 12 }), href: `/practice?skill=${weak}`, Icon: PenLine }
            : { why: t("nextWhy.start"), title: t("nextMock"), meta: t("nextMockMeta"), href: "/mocks", Icon: ClipboardList };

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date()));
  const first = user.name?.split(" ")[0];
  const greeting = first ? t(`greeting.${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}`, { name: first }) : t("greeting.plain");

  const sections = (["MATH", "RW"] as const).map((sec) => {
    const rows = s.byDomain.filter((d) => d.section === sec);
    const total = rows.reduce((n, r) => n + r.total, 0);
    const correct = rows.reduce((n, r) => n + r.correct, 0);
    const ms = sectionPace.find((p) => p.section === sec)?.avg_ms ?? null;
    return { sec, total, pct: total ? Math.round((correct / total) * 100) : null, secs: ms ? Math.round(ms / 1000) : null };
  });
  const domains = DOMAINS.map((d) => {
    const r = s.byDomain.find((b) => b.key === d.key);
    return { key: d.key, section: d.section, skill: d.skills[0], total: r?.total ?? 0, pct: r && r.total ? Math.round((r.correct / r.total) * 100) : null };
  });

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{format.dateTime(new Date(), { weekday: "long", month: "long", day: "numeric", timeZone: tz })}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">{greeting}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="lg">
          <Link href={s.openAttemptId ? `/attempts/${s.openAttemptId}` : rec.href}>
            <Play className="size-4 fill-current" aria-hidden />
            {s.openAttemptId ? t("resumeCta") : t("startSession")}
          </Link>
        </Button>
      </div>
    </div>
  );

  if (isNew) {
    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 lg:py-10">
        {header}
        <section className={cn(card, "grid items-center gap-6 overflow-hidden p-0 sm:p-0 md:grid-cols-[1.1fr_1fr]")} aria-labelledby="new-title">
          <div className="p-6 sm:p-10">
            <h2 id="new-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              {t("newTitle")}
            </h2>
            <p className="mt-3 max-w-[46ch] text-muted-foreground">{t("newBody")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/mocks">{t("newTest")}</Link>
              </Button>
              <ScoreEntry today={todayUtc} trigger={<Button size="lg" variant="outline">{t("newHave")}</Button>} />
            </div>
            <Link href="/dashboard?start=1" className="mt-4 inline-block text-sm font-semibold text-muted-foreground hover:text-foreground">
              {t("newSkip")}
            </Link>
          </div>
          <div className="bg-surface-2 p-6 sm:p-10">
            <StudyPlanScene className="mx-auto w-full max-w-[420px]" />
          </div>
        </section>
        <RecommendedCard rec={rec} t={t} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-5 px-4 py-6 sm:px-6 lg:space-y-6 lg:py-10">
      {header}

      {s.openAttemptId && (
        <Link href={`/attempts/${s.openAttemptId}`} className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft/70">
          {t("resume")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      {/* 1–4: score strip and the recommendation */}
      <div className="grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.35fr)]">
        <div className={cn(card, "order-2 lg:order-1")}>
          <p className="text-sm font-medium text-muted-foreground">{t("estimated")}</p>
          {latest != null ? (
            <>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.03em] tabular-nums">{latest}</p>
              {prev != null && (
                <span className={cn("mt-2 inline-flex rounded-md px-1.5 py-0.5 text-xs font-bold", latest >= prev ? "bg-correct-soft text-correct-ink" : "bg-wrong-soft text-wrong-ink")}>
                  {t("delta", { n: Math.abs(latest - prev), sign: latest >= prev ? "+" : "−" })}
                </span>
              )}
              {points.length >= 2 && <Spark values={points.map((p) => p.score)} />}
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-2xl font-extrabold text-muted-foreground">{t("estimatedNone")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("estimatedHint")}</p>
            </>
          )}
        </div>
        <div className={cn(card, "order-3 lg:order-2")}>
          <p className="text-sm font-medium text-muted-foreground">{t("target")}</p>
          {user.targetScore ? (
            <>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.03em] tabular-nums">{user.targetScore}</p>
              {latest != null && (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{latest >= user.targetScore ? t("reached") : t("gap", { n: user.targetScore - latest })}</p>
              )}
              {latest != null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round(((latest - 400) / (user.targetScore - 400)) * 100))}%` }} />
                </div>
              )}
            </>
          ) : (
            <Link href="/settings" className="mt-3 inline-flex items-center gap-1 font-semibold text-primary">
              {t("targetNone")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        <div className={cn(card, "order-4 lg:order-3")}>
          <p className="text-sm font-medium text-muted-foreground">{t("week")}</p>
          <p className="mt-2 font-display text-4xl font-extrabold tracking-[-0.03em] tabular-nums">{hm(weekMin)}</p>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">{t("weekOf", { goal: hm(goalMin) })}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((weekMin / goalMin) * 100))}%` }} />
          </div>
        </div>
        <div className="order-1 lg:order-4">
          <RecommendedCard rec={rec} t={t} />
        </div>
      </div>

      {/* 5–6: score progress and the weekly goal */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={card} aria-labelledby="progress-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="progress-title" className={cardTitle}>
              {t("progress")}
            </h2>
            {fc && <span className="text-xs font-medium text-muted-foreground">{t("progressEstimate")}</span>}
          </div>
          {points.length >= 4 ? (
            <div className="mt-4">
              <ScoreChart
                points={points}
                forecast={fc && user.testDate ? { label: format.dateTime(user.testDate, { month: "short", day: "numeric", timeZone: "UTC" }), ...fc } : null}
                labels={{ estimate: t("forecast"), table: t("showTable"), date: t("colDate"), score: t("colScore") }}
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-surface-2 p-5">
              <p className="font-display text-lg font-bold">{t("progressFew")}</p>
              <p className="text-sm text-muted-foreground">{t("progressFewBody", { n: history.length })}</p>
              <ScoreEntry today={todayUtc} trigger={<Button size="sm" variant="outline">{t("newHave")}</Button>} />
            </div>
          )}
        </section>
        <section className={cn(card, "flex flex-col")} aria-labelledby="goal-title">
          <h2 id="goal-title" className={cardTitle}>
            {t("goal")}
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
            <GoalRing value={weekMin} goal={goalMin} label={hm(weekMin)} />
            <p className="text-center text-sm text-muted-foreground">{weekMin >= goalMin ? t("goalDone") : t("goalBody", { done: weekMin, goal: goalMin })}</p>
          </div>
          <Link href="/plan" className="inline-flex items-center gap-1 self-center text-sm font-semibold text-primary">
            {t("goalPlan")}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </div>

      {/* 7: Math vs R&W, topic performance */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className={card} aria-labelledby="sections-title">
          <h2 id="sections-title" className={cardTitle}>
            {t("sections")}
          </h2>
          <div className="mt-4 space-y-4">
            {sections.map((sec) => (
              <div key={sec.sec} className="rounded-2xl bg-surface-2 p-4">
                <p className="text-sm font-semibold">{tx(`sections.${sec.sec}`)}</p>
                {sec.pct == null ? (
                  <p className="mt-1 text-sm text-muted-foreground">{t("noData")}</p>
                ) : (
                  <dl className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("accuracy")}</dt>
                      <dd className="font-display text-2xl font-extrabold tabular-nums">{sec.pct}%</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("pace")}</dt>
                      <dd className="mt-1.5 text-sm font-semibold tabular-nums">{sec.secs != null ? t("perQ", { s: sec.secs }) : "—"}</dd>
                    </div>
                  </dl>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className={card} aria-labelledby="topics-title">
          <h2 id="topics-title" className={cardTitle}>
            {t("topics")}
          </h2>
          <ul className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {domains.map((d) => (
              <li key={d.key}>
                <Link href={`/practice?skill=${d.skill}`} className="group -mx-2 block rounded-xl px-2 py-2 transition-colors hover:bg-surface-2">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{tx(`domains.${d.key as "ALGEBRA"}`)}</span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{d.pct != null ? `${d.pct}%` : "—"}</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-2 group-hover:bg-background">
                    <span className={cn("block h-full rounded-full", d.pct == null ? "" : d.pct < 60 ? "bg-warning-fill" : "bg-primary")} style={{ width: `${d.pct ?? 0}%` }} />
                  </span>
                  <span className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{tx(`sections.${d.section}`)}</span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      {t("topicsDrill")}
                      <ArrowUpRight className="size-3" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 8: recent activity */}
      <section className={card} aria-labelledby="activity-title">
        <h2 id="activity-title" className={cardTitle}>
          {t("activity")}
        </h2>
        {s.recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("activityNone")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {s.recent.map((a) => {
              const pct = a.totalCount ? Math.round(((a.correctCount ?? 0) / a.totalCount) * 100) : null;
              return (
                <li key={a.id}>
                  <Link href={`/attempts/${a.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      {a.kind === "MOCK" ? <ClipboardList className="size-4" aria-hidden /> : <PenLine className="size-4" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{t(`kinds.${a.kind}`)}</span>
                      <span className="block text-xs text-muted-foreground">{a.completedAt ? format.relativeTime(a.completedAt) : ""}</span>
                    </span>
                    {a.totalCount ? <span className="text-sm text-muted-foreground tabular-nums">{t("score", { correct: a.correctCount ?? 0, total: a.totalCount })}</span> : null}
                    {pct != null && <span className={cn("w-12 text-end text-sm font-bold tabular-nums", pct >= 70 ? "text-correct-ink" : "text-foreground")}>{pct}%</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

type Rec = { why: string; title: string; meta: string; href: string; Icon: typeof PenLine };

function RecommendedCard({ rec, t }: { rec: Rec; t: Awaited<ReturnType<typeof getTranslations<"dash">>> }) {
  const Icon = rec.Icon;
  return (
    <section aria-labelledby="rec-title" className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] p-6 text-white shadow-[var(--elev-md)]" style={{ background: "var(--grad-hero)" }}>
      <svg aria-hidden viewBox="0 0 200 200" className="pointer-events-none absolute -end-10 -top-12 w-52 opacity-[0.14]">
        <circle cx="100" cy="100" r="70" fill="none" stroke="white" strokeWidth="18" />
        <circle cx="100" cy="100" r="34" fill="white" />
      </svg>
      <p id="rec-title" className="relative text-sm font-semibold text-white/80">
        {t("next")}
      </p>
      <div className="relative mt-3 flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl leading-tight font-extrabold tracking-tight">{rec.title}</p>
          <p className="mt-1 text-sm text-white/80">{rec.meta}</p>
        </div>
      </div>
      <p className="relative mt-4 text-sm text-white/85">{rec.why}</p>
      <div className="relative mt-auto pt-5">
        <Link
          href={rec.href}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-sm font-bold text-navy transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {t("start")}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

/** A tiny trend line under the estimated score. */
function Spark({ values }: { values: number[] }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pts = values.map((v, i) => `${Math.round((i / (values.length - 1)) * 120)},${hi === lo ? 14 : Math.round(26 - ((v - lo) / (hi - lo)) * 24)}`).join(" ");
  return (
    <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full" aria-hidden preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
