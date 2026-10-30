import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/server/auth/session";
import { analyticsOverview } from "@/server/analytics/overview";
import { calibrationReport } from "@/server/analytics/calibration";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function Bars({ data, label }: { data: { key: string; value: number; title: string }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ol className="flex h-32 items-end gap-1" aria-label={label}>
      {data.map((d) => (
        <li key={d.key} className="flex h-full flex-1 flex-col justify-end" title={d.title}>
          <span className="sr-only">{d.title}</span>
          <div className="rounded-t bg-primary" style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
        </li>
      ))}
    </ol>
  );
}

export default async function AnalyticsPage() {
  await requireRole(["ADMIN"], "/admin/analytics");
  const t = await getTranslations("admin.analytics");
  const tx = await getTranslations("taxonomy");
  const te = await getTranslations("enums");
  const format = await getFormatter();
  const [o, calibration] = await Promise.all([analyticsOverview(), calibrationReport()]);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const issues = calibration.filter((q) => q.calibration.status !== "insufficient" && (q.calibration.status !== "ok" || q.calibration.suspectChoice));
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10));
  const byDay = new Map(o.perDay.map((d) => [d.day, d]));

  const tiles = [
    { label: t("students"), value: format.number(o.students), note: t("newThisWeek", { count: o.newThisWeek }) },
    { label: t("active"), value: `${o.active.day} / ${o.active.week} / ${o.active.month}`, note: t("activeNote") },
    { label: t("premium"), value: format.number(o.premium), note: o.students ? t("conversion", { pct: pct(o.premium / o.students) }) : "" },
    { label: t("mocks"), value: format.number(o.mocksCompleted), note: o.averageEstimate ? t("avgEstimate", { score: o.averageEstimate }) : "" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("answeredPerDay")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Bars
              label={t("answeredPerDay")}
              data={days.map((d) => {
                const v = byDay.get(d);
                return { key: d, value: v?.answered ?? 0, title: `${d}: ${v?.answered ?? 0} (${v && v.answered ? pct(v.correct / v.answered) : "—"})` };
              })}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("signups")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Bars label={t("signups")} data={o.signupsPerWeek.map((w) => ({ key: w.week, value: w.n, title: `${w.week}: ${w.n}` }))} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("weakSkills")}</CardTitle>
        </CardHeader>
        <CardContent>
          {o.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              {o.skills.slice(0, 12).map((s) => (
                <li key={s.skill} className="flex justify-between gap-2">
                  <span>{tx(`skills.${s.skill as "INFERENCES"}`)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {pct(s.accuracy)} · {s.answered}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("calibration")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("calibrationHelp")}</p>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("calibrationNone", { checked: calibration.length })}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("label")}</TableHead>
                  <TableHead>{t("accuracy")}</TableHead>
                  <TableHead>{t("finding")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((q) => {
                  const c = q.calibration as Exclude<typeof q.calibration, { status: "insufficient" }>;
                  return (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Link href={`/admin/questions/${q.id}`} className="font-mono underline">
                          {q.code}
                        </Link>
                      </TableCell>
                      <TableCell>{te(`difficulty.${q.difficulty}`)}</TableCell>
                      <TableCell className="tabular-nums">
                        {pct(c.accuracy)} ({c.answers})
                      </TableCell>
                      <TableCell>
                        {c.status !== "ok" && t(`status.${c.status}`, { suggested: te(`difficulty.${c.suggested}`) })}
                        {c.suspectChoice && <span className="block">{t("suspect", { choice: c.suspectChoice })}</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
