import { getFormatter, getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { activityDays } from "@/server/stats/analytics";
import { topBarStats } from "@/server/stats/topbar";
import { notebookCounts } from "@/server/review/service";
import { db } from "@/lib/db";
import { daysUntil } from "@/lib/goals";
import { buildPath } from "@/lib/path";
import { dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Owl } from "@/components/mascot/owl";
import { ScoreEntry } from "@/components/learning/score-entry";
import { DailyQuestionButton } from "@/components/learning/review-actions";
import { PathView, Rail, type RailData, type UnitVM } from "@/components/path/path-view";

const DAILY_QUESTIONS = 20;

export async function generateMetadata() {
  const t = await getTranslations("path");
  return { title: t("title") };
}

/** Path (brief §6): the roadmap on the left, score/week/quests/weak spots on the right. */
export default async function PathPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const user = await requireUser("/sat");
  const t = await getTranslations("path");
  const tx = await getTranslations("taxonomy");
  const td = await getTranslations("dashboard");
  const tc = await getTranslations("coach");
  const format = await getFormatter();
  const { start } = await searchParams;

  const since = startOfDayInZone(new Date(), user.timeZone);
  const [s, notebook, week, top, mocks, official, todaysDrills] = await Promise.all([
    getDashboardStats(user.id, user.timeZone),
    notebookCounts(user.id),
    activityDays(user.id, user.timeZone, 1),
    topBarStats(user.id, user.timeZone),
    db.attempt.findMany({ where: { userId: user.id, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 12, select: { scores: true } }),
    db.officialScore.findMany({ where: { userId: user.id }, orderBy: { takenOn: "asc" }, take: 12, select: { total: true } }),
    db.attempt.findMany({ where: { userId: user.id, kind: "DRILL", status: "COMPLETED", completedAt: { gte: since } }, select: { correctCount: true, totalCount: true } }),
  ]);

  const todayUtc = new Date().toISOString().slice(0, 10);
  const days = user.testDate ? daysUntil(user.testDate) : null;
  const isNew = s.answered === 0 && top.score == null && start !== "1";

  // Past test date: ask how it went first.
  const pastCard = days != null && days < 0 && (
    <div className="mb-8 flex flex-col items-center gap-5 rounded-3xl border border-border bg-surface p-6 text-center shadow-sm sm:flex-row sm:text-start">
      <Owl pose="thinking" className="w-24" />
      <div className="flex-1">
        <h2 className="font-display text-xl font-extrabold">{t("past.title")}</h2>
        <p className="mt-1 text-muted-foreground">{t("past.body")}</p>
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <ScoreEntry today={todayUtc} trigger={<Button>{t("past.log")}</Button>} />
        <Link href="/settings" className="text-sm font-semibold text-primary hover:underline">
          {t("past.newDate")}
        </Link>
      </div>
    </div>
  );

  if (isNew) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col justify-center px-4 py-12">
        {pastCard}
        <div className="rounded-[32px] border border-border bg-surface p-8 text-center shadow-[0_24px_50px_-30px_rgb(15_23_42/0.3)] dark:shadow-none">
          <Owl pose="happy" className="mx-auto w-32" />
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">{t("newUser.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("newUser.body")}</p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/mocks">{t("newUser.test")}</Link>
            </Button>
            <ScoreEntry today={todayUtc} trigger={<Button size="lg" variant="outline">{t("newUser.have")}</Button>} />
            <Link href="/sat?start=1" className="mt-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
              {t("newUser.skip")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { units } = buildPath(s.bySkill, notebook.due);
  const unitVMs: UnitVM[] = units.map((u) => {
    let lesson = 0;
    return {
      index: u.index,
      domain: u.domain,
      title: tx(`domains.${u.domain as "ALGEBRA"}`),
      section: u.section,
      done: u.done,
      total: u.total,
      nodes: u.nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        state: n.state,
        key: n.key,
        mastery: n.mastery,
        title: n.kind === "lesson" ? tx(`skills.${n.key as "INFERENCES"}`) : "",
        lesson: n.kind === "lesson" ? ++lesson : undefined,
      })),
    };
  });

  const todayLocal = dayInZone(new Date(), user.timeZone);
  const answeredToday = week.find((d) => d.day === todayLocal)?.count ?? 0;
  const bestDrill = todaysDrills.some((a) => (a.totalCount ?? 0) >= 5 && (a.correctCount ?? 0) / (a.totalCount ?? 1) >= 0.9);
  const history = [
    ...official.map((o) => o.total),
    ...mocks.map((a) => (a.scores as ScoreEstimate | null)?.total?.score).filter((v): v is number => typeof v === "number"),
  ].slice(-8);

  const rail: RailData = {
    score: top.score,
    history,
    week: week.map((d) => {
      const name = format.dateTime(new Date(`${d.day}T12:00:00Z`), { weekday: "long", timeZone: "UTC" });
      const state = (d.count ?? 0) > 0 ? "done" : d.day === todayLocal ? "today" : d.count == null ? "future" : "missed";
      const key = state === "done" ? "weekDone" : state === "today" ? "weekToday" : state === "missed" ? "weekMissed" : "weekFuture";
      return { label: format.dateTime(new Date(`${d.day}T12:00:00Z`), { weekday: "narrow", timeZone: "UTC" }), state, description: td(key, { day: name }) };
    }),
    quests: [
      { label: t("rail.q1", { n: DAILY_QUESTIONS }), n: answeredToday, of: DAILY_QUESTIONS, tone: "primary" },
      { label: t("rail.q2"), n: bestDrill ? 1 : 0, of: 1, tone: "correct" },
      { label: t("rail.q3"), n: 0, of: notebook.due, tone: "review" },
    ],
    weak: s.weakSkills.slice(0, 3).map((w) => ({ key: w.key, label: tx(`skills.${w.key as "INFERENCES"}`), pct: Math.round((w.correct / w.total) * 100) })),
    units: unitVMs.map((u) => ({ index: u.index, title: u.title, done: u.done, total: u.total, section: u.section })),
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:py-8">
      <h1 className="sr-only">{t("title")}</h1>
      {pastCard}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <Rail data={rail} questSlot={<DailyQuestionButton label={tc("dailyQuestion")} />} scoreSlot={<ScoreEntry today={todayUtc} trigger={<Button size="sm" variant="outline">{t("rail.addScore")}</Button>} />} />
        </aside>
        <div className="min-w-0 lg:order-1">
          <PathView units={unitVMs} dueReviews={notebook.due} />
        </div>
      </div>
    </div>
  );
}
