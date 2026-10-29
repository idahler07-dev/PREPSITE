import { getFormatter, getTranslations } from "next-intl/server";
import { Flame, Target, Timer, CheckCircle2, CalendarDays, Play } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { Link } from "@/i18n/navigation";
import { daysUntil } from "@/lib/goals";
import { formatDuration } from "@/lib/format";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("dashboard");
  const tx = await getTranslations("taxonomy");
  const th = await getTranslations("history");
  const c = await getTranslations("common");
  const format = await getFormatter();
  const s = await getDashboardStats(user.id, user.timeZone);
  const accuracy = s.graded ? Math.round((s.correct / s.graded) * 100) : null;
  const days = user.testDate ? daysUntil(user.testDate) : null;

  const tiles = [
    { icon: CheckCircle2, label: t("stats.answered"), value: format.number(s.answered) },
    { icon: Target, label: t("stats.accuracy"), value: accuracy === null ? "—" : `${accuracy}%` },
    { icon: Flame, label: t("stats.streak"), value: t("stats.streakDays", { count: s.streak }) },
    {
      icon: Timer,
      label: t("stats.avgTime"),
      value: s.avgMs ? formatDuration(s.avgMs, (min, sec) => (min ? c("durationMinSec", { min, sec }) : c("secondsShort", { count: sec }))) : "—",
    },
  ];

  return (
    <Container className="space-y-6">
      <PageHeader
        title={user.name ? t("welcome", { name: user.name.split(" ")[0]! }) : t("welcomeNoName")}
        actions={
          <>
            {s.openAttemptId && (
              <Button asChild variant="outline">
                <Link href={`/test/${s.openAttemptId}`}>{t("continueAttempt")}</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/practice">
                <Play aria-hidden /> {t("startDrill")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" aria-hidden /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold tabular-nums">{value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("byDomain")}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.byDomain.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : (
              <ul className="space-y-3">
                {s.byDomain
                  .sort((a, b) => a.section.localeCompare(b.section) || b.total - a.total)
                  .map((d) => {
                    const pct = Math.round((d.correct / d.total) * 100);
                    return (
                      <li key={d.key} className="space-y-1">
                        <div className="flex justify-between gap-2 text-sm">
                          <span>
                            <span className="me-2 text-xs text-muted-foreground">{tx(`sectionsShort.${d.section}`)}</span>
                            {tx(`domains.${d.key as "ALGEBRA"}`)}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {pct}% · {d.correct}/{d.total}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct}%`}>
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("goal.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {user.targetScore || user.testDate ? (
                <>
                  {user.targetScore && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">{t("goal.target")}</span>
                      <strong className="tabular-nums">{user.targetScore}</strong>
                    </p>
                  )}
                  {user.testDate && (
                    <p className="flex justify-between gap-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="size-4" aria-hidden /> {t("goal.testDate")}
                      </span>
                      <span className="text-end">
                        <strong>{format.dateTime(user.testDate, { dateStyle: "medium", timeZone: "UTC" })}</strong>
                        <br />
                        <span className="text-muted-foreground">{days !== null && days >= 0 ? t("goal.daysLeft", { count: days }) : t("goal.testPassed")}</span>
                      </span>
                    </p>
                  )}
                  <Link href="/settings" className="text-primary hover:underline">
                    {t("goal.edit")}
                  </Link>
                </>
              ) : (
                <Link href="/onboarding" className="text-primary hover:underline">
                  {t("goal.setGoal")}
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("estimate.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="text-muted-foreground">{t("estimate.notYet")}</p>
              <p className="text-xs text-muted-foreground">{t("estimate.label")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("bySkill")}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.weakSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {s.weakSkills.map((sk) => (
                  <li key={sk.key} className="flex items-center justify-between gap-3">
                    <span>{tx(`skills.${sk.key as "INFERENCES"}`)}</span>
                    <Link href={`/practice?skill=${sk.key}`} className="shrink-0 tabular-nums text-primary hover:underline">
                      {Math.round((sk.correct / sk.total) * 100)}%
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t("recent")}</CardTitle>
            <Link href="/history" className="text-sm text-primary hover:underline">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {s.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            ) : (
              <ul className="divide-y text-sm">
                {s.recent.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/attempts/${a.id}`} className="hover:underline">
                      {th(`kinds.${a.kind}`)} · {a.completedAt && format.dateTime(a.completedAt, { dateStyle: "medium" })}
                    </Link>
                    <span className="tabular-nums">
                      {a.correctCount ?? 0}/{a.totalCount ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
