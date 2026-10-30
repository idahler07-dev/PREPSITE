import { getFormatter, getTranslations } from "next-intl/server";
import { CalendarDays, Flame, Play, Target } from "lucide-react";
import siteConfig from "@site";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { Link } from "@/i18n/navigation";
import { daysUntil } from "@/lib/goals";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";
import { dayInZone } from "@/lib/stats/streak";
import type { WeeklyPlan } from "@/lib/coach/plan";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { currentPlan } from "@/server/coach/service";
import { notebookCounts } from "@/server/review/service";
import { vocabCounts } from "@/server/vocab/service";
import { Container } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot/mascot";
import { Odometer } from "@/components/motion/odometer";
import { SpotlightCard } from "@/components/motion/interactive-card";
import { TaskList } from "@/components/learning/plan-view";
import { DailyQuestionButton } from "@/components/learning/review-actions";
import { DrillSkillMap, PracticeSkillButton } from "@/components/learning/practice-skill";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

/** A bento card: 14px radius, 20/32px padding, cursor spotlight on desktop. */
function Tile({ title, action, className, children }: { title?: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <SpotlightCard className={`rounded-[20px] p-5 lg:p-8 ${className ?? ""}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </SpotlightCard>
  );
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("dashboard");
  const tx = await getTranslations("taxonomy");
  const th = await getTranslations("history");
  const tc = await getTranslations("coach");
  const format = await getFormatter();
  const s = await getDashboardStats(user.id, user.timeZone);
  const days = user.testDate ? daysUntil(user.testDate) : null;
  const today = dayInZone(new Date(), siteConfig.defaultTimeZone);
  const [planRow, notebook, vocab, lastMock] = await Promise.all([
    currentPlan(user.id),
    notebookCounts(user.id),
    vocabCounts(user.id),
    db.attempt.findFirst({ where: { userId: user.id, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { scores: true } }),
  ]);
  const todayTasks = ((planRow.plan as unknown as WeeklyPlan).days.find((d) => d.date === today)?.tasks ?? []).slice(0, 3);
  const estimate = (lastMock?.scores as ScoreEstimate | null)?.total ?? null;
  const skillRows = new Map(s.bySkill.map((r) => [r.key, r]));
  const tiles = DOMAINS.flatMap((d) =>
    d.skills.map((k) => {
      const r = skillRows.get(k);
      const m = r && r.total > 0 ? r.correct / r.total : null;
      return { key: k, label: tx(`skills.${k as "INFERENCES"}`), mastery: m, detail: m == null ? undefined : `${Math.round(m * 100)}%` };
    }),
  );
  const first = user.name?.split(" ")[0];

  return (
    <Container>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Greeting */}
        <Tile className="lg:col-span-2">
          <div className="flex items-center gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              <h1 className="text-h2 font-semibold lg:text-h1">{first ? t("greeting", { name: first }) : t("greetingNoName")}</h1>
              <p className="max-w-[50ch] text-muted-foreground">{t("greetingSub")}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                {s.openAttemptId && (
                  <Button asChild variant="secondary" className="h-auto min-h-10 max-w-full whitespace-normal">
                    <a href={`/test/${s.openAttemptId}`}>{t("continueAttempt")}</a>
                  </Button>
                )}
                <Button asChild>
                  <Link href="/practice">
                    <Play aria-hidden /> {t("startDrill")}
                  </Link>
                </Button>
              </div>
            </div>
            <Mascot pose={s.streak === 0 && s.answered > 0 ? "sleepy" : "wave"} className="hidden w-32 shrink-0 sm:block lg:w-40" />
          </div>
        </Tile>

        {/* Estimated score */}
        <Tile title={t("estimate.title")}>
          {estimate ? (
            <div>
              <p className="text-[3.5rem] leading-none font-bold">
                <Odometer value={estimate.score} className="font-mono" />
              </p>
              <p className="mt-2 font-mono text-small text-muted-foreground">{t("range", { low: estimate.low, high: estimate.high })}</p>
              <p className="mt-3 text-label text-muted-foreground">{t("estimate.label")}</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Mascot pose="think" className="w-20 shrink-0" />
              <div className="space-y-3">
                <p className="text-small text-muted-foreground">{t("estimateEmpty")}</p>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/mocks">{t("takeTest")}</Link>
                </Button>
                <p className="text-label text-muted-foreground">{t("estimate.label")}</p>
              </div>
            </div>
          )}
        </Tile>

        {/* Today's tasks */}
        <Tile
          className="lg:col-span-2"
          title={tc("today")}
          action={
            <Link href="/plan" className="text-small font-medium text-primary hover:underline">
              {tc("seeWeek")}
            </Link>
          }
        >
          <TaskList tasks={todayTasks} />
        </Tile>

        {/* Streak + days to test */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-1">
          <Tile>
            <p className="flex items-center gap-2 text-small font-medium text-muted-foreground">
              <Flame className="size-4 text-accent-ink" aria-hidden /> {t("streakTitle")}
            </p>
            <p className="mt-2 text-[2.5rem] leading-none font-bold">
              <Odometer value={s.streak} className="font-mono" />
            </p>
            {s.streak === 0 && <p className="mt-2 text-label text-muted-foreground">{t("streakReminder")}</p>}
          </Tile>
          <Tile>
            <p className="flex items-center gap-2 text-small font-medium text-muted-foreground">
              <CalendarDays className="size-4 text-primary" aria-hidden /> {t("daysToTest")}
            </p>
            {days !== null && days >= 0 ? (
              <p className="mt-2 text-[2.5rem] leading-none font-bold">
                <Odometer value={days} className="font-mono" />
              </p>
            ) : (
              <Link href="/settings" className="mt-3 inline-flex min-h-11 items-center text-small font-medium text-primary hover:underline">
                {t("noTestDate")}
              </Link>
            )}
          </Tile>
        </div>

        {/* Weakest skills */}
        <Tile title={t("weakest")}>
          {s.weakSkills.length === 0 ? (
            <p className="text-small text-muted-foreground">{t("weakestEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {s.weakSkills.slice(0, 3).map((sk) => (
                <li key={sk.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-small font-medium">{tx(`skills.${sk.key as "INFERENCES"}`)}</p>
                    <p className="font-mono text-label text-muted-foreground">{t("mastery", { pct: Math.round((sk.correct / sk.total) * 100) })}</p>
                  </div>
                  <PracticeSkillButton skill={sk.key} />
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* Skill map */}
        <Tile className="lg:col-span-2" title={t("skillMap")} action={<span className="hidden text-label text-muted-foreground sm:inline">{t("skillMapHint")}</span>}>
          <DrillSkillMap tiles={tiles} />
        </Tile>

        {/* Recent tests */}
        <Tile
          className="lg:col-span-2"
          title={t("recent")}
          action={
            <Link href="/history" className="text-small font-medium text-primary hover:underline">
              {t("viewAll")}
            </Link>
          }
        >
          {s.recent.length === 0 ? (
            <div className="flex items-center gap-4">
              <Mascot pose="point" className="w-20 shrink-0" />
              <div className="space-y-3">
                <p className="text-small text-muted-foreground">{t("recentEmpty")}</p>
                <Button asChild size="sm">
                  <Link href="/practice">{t("firstDrill")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {s.recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/attempts/${a.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:text-primary">
                    <span className="text-small">
                      <span className="font-medium">{th(`kinds.${a.kind}`)}</span>
                      <span className="text-muted-foreground"> · {a.completedAt && format.dateTime(a.completedAt, { dateStyle: "medium" })}</span>
                    </span>
                    <span className="font-mono text-small font-semibold tabular-nums">
                      {a.correctCount ?? 0}/{a.totalCount ?? 0}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* Quick practice */}
        <Tile title={t("quick")}>
          <div className="space-y-2">
            <DailyQuestionButton label={tc("dailyQuestion")} />
            <Link href="/review" className="flex min-h-11 items-center gap-2 text-small font-medium text-primary hover:underline">
              <Target className="size-4" aria-hidden /> {tc("reviewDue", { count: notebook.due })}
            </Link>
            <Link href="/vocab" className="flex min-h-11 items-center text-small font-medium text-primary hover:underline">
              {tc("vocabDue", { count: vocab.due + Math.min(vocab.unseen, 10) })}
            </Link>
          </div>
        </Tile>
      </div>
    </Container>
  );
}
