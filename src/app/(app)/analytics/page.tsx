import { getFormatter, getTranslations } from "next-intl/server";
import { Play } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { getDashboardStats } from "@/server/stats/dashboard";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";
import type { ScoreEstimate } from "@/lib/mock/scoring";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/motion/interactive-card";
import { SpringBar } from "@/components/motion/progress";
import { TrendChart } from "@/components/learning/trend-chart";
import { DrillSkillMap } from "@/components/learning/practice-skill";

export async function generateMetadata() {
  const t = await getTranslations("analytics");
  return { title: t("title") };
}

/** Real SAT timing: RW 32 min / 27 questions, Math 35 min / 22 questions. */
const TARGET_SECONDS = { RW: 71, MATH: 95 } as const;

export default async function AnalyticsPage() {
  const user = await requireUser("/analytics");
  const t = await getTranslations("analytics");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const [s, mocks, pacing] = await Promise.all([
    getDashboardStats(user.id, user.timeZone),
    db.attempt.findMany({ where: { userId: user.id, kind: "MOCK", status: "COMPLETED" }, orderBy: { completedAt: "asc" }, take: 12, select: { completedAt: true, scores: true } }),
    db.$queryRaw<{ section: "RW" | "MATH"; avg_ms: number | null; n: bigint }[]>`
      SELECT q."section" AS section, avg(r."timeSpentMs")::float AS avg_ms, count(*) AS n
      FROM "Response" r
      JOIN "Question" q ON q."id" = r."questionId"
      JOIN "AttemptModule" m ON m."id" = r."moduleId"
      JOIN "Attempt" a ON a."id" = m."attemptId"
      WHERE a."userId" = ${user.id} AND r."answer" IS NOT NULL AND r."timeSpentMs" > 0
      GROUP BY q."section"`,
  ]);

  const header = (
    <PageHeader
      title={t("title")}
      description={t("description")}
      actions={
        <Button asChild>
          <Link href="/practice">
            <Play aria-hidden /> {t("practice")}
          </Link>
        </Button>
      }
    />
  );

  if (s.graded === 0)
    return (
      <Container>
        {header}
        <EmptyState
          pose="think"
          title={t("title")}
          body={t("empty")}
          action={
            <Button asChild>
              <Link href="/practice">{t("emptyCta")}</Link>
            </Button>
          }
        />
      </Container>
    );

  const rows = new Map(s.bySkill.map((r) => [r.key, r]));
  const tiles = DOMAINS.flatMap((d) =>
    d.skills.map((k) => {
      const r = rows.get(k);
      const m = r && r.total > 0 ? r.correct / r.total : null;
      return { key: k, label: tx(`skills.${k as "INFERENCES"}`), mastery: m, detail: m == null ? undefined : `${Math.round(m * 100)}%` };
    }),
  );
  const trend = mocks.flatMap((m) => {
    const total = (m.scores as ScoreEstimate | null)?.total;
    return total && m.completedAt ? [{ label: format.dateTime(m.completedAt, { month: "short", day: "numeric" }), value: total.score }] : [];
  });
  const card = "rounded-[20px] p-5 lg:p-8";

  return (
    <Container>
      {header}
      <div className="grid gap-6 lg:grid-cols-3">
        <SpotlightCard className={`${card} lg:col-span-2`}>
          <h2 className="font-semibold">{t("skills")}</h2>
          <p className="mb-5 text-small text-muted-foreground">{t("skillsHint")}</p>
          <DrillSkillMap tiles={tiles} />
        </SpotlightCard>
        <div className="grid gap-6">
          <SpotlightCard className={card}>
            <h2 className="font-semibold">{t("trend")}</h2>
            <p className="mb-4 text-small text-muted-foreground">{t("trendHint")}</p>
            {trend.length >= 2 ? <TrendChart points={trend} label={t("trend")} /> : <p className="text-small text-muted-foreground">{t("trendEmpty")}</p>}
          </SpotlightCard>
          <SpotlightCard className={card}>
            <h2 className="font-semibold">{t("pacing")}</h2>
            <p className="mb-4 text-small text-muted-foreground">{t("pacingHint")}</p>
            <ul className="space-y-4">
              {(["RW", "MATH"] as const).map((sec) => {
                const row = pacing.find((p) => p.section === sec);
                const secs = row?.avg_ms ? Math.round(row.avg_ms / 1000) : null;
                return (
                  <li key={sec} className="space-y-1.5">
                    <div className="flex justify-between gap-2 text-small">
                      <span className="font-medium">{tx(`sections.${sec}`)}</span>
                      <span className="font-mono tabular-nums">{secs == null ? "—" : t("perQuestion", { seconds: secs })}</span>
                    </div>
                    <SpringBar value={secs == null ? 0 : Math.min(100, (secs / (TARGET_SECONDS[sec] * 1.5)) * 100)} label={tx(`sections.${sec}`)} tone={secs != null && secs > TARGET_SECONDS[sec] ? "accent" : "primary"} />
                    <p className="text-label text-muted-foreground">{t("target", { seconds: TARGET_SECONDS[sec] })}</p>
                  </li>
                );
              })}
            </ul>
          </SpotlightCard>
        </div>
        <SpotlightCard className={`${card} lg:col-span-3`}>
          <h2 className="mb-5 font-semibold">{t("byDomain")}</h2>
          <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {s.byDomain
              .sort((a, b) => a.section.localeCompare(b.section) || b.total - a.total)
              .map((d) => {
                const pct = Math.round((d.correct / d.total) * 100);
                return (
                  <li key={d.key} className="space-y-1.5">
                    <div className="flex justify-between gap-2 text-small">
                      <span className="font-medium">{tx(`domains.${d.key as "ALGEBRA"}`)}</span>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {pct}% · {t("answered", { count: d.total })}
                      </span>
                    </div>
                    <SpringBar value={pct} label={`${tx(`domains.${d.key as "ALGEBRA"}`)} ${pct}%`} />
                  </li>
                );
              })}
          </ul>
        </SpotlightCard>
      </div>
    </Container>
  );
}
