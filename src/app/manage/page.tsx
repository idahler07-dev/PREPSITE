import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOwner } from "@/server/auth/session";

export default async function AdminOverview() {
  await requireOwner();
  const t = await getTranslations("admin.overview");
  const tx = await getTranslations("taxonomy");
  const [published, inReview, drafts, openReports, students, attempts, samples, byDomain, disputed] = await Promise.all([
    db.question.count({ where: { status: "PUBLISHED" } }),
    db.question.count({ where: { status: "IN_REVIEW" } }),
    db.question.count({ where: { status: "DRAFT" } }),
    db.questionReport.count({ where: { status: "OPEN" } }),
    db.user.count(),
    db.attempt.count({ where: { status: "COMPLETED" } }),
    db.question.count({ where: { isSample: true } }),
    db.question.groupBy({ by: ["domain"], where: { status: "PUBLISHED" }, _count: true }),
    db.question.count({ where: { flags: { has: "AI_KEY_DISPUTE" }, status: { not: "RETIRED" } } }),
  ]);
  const domainCount = new Map(byDomain.map((d) => [d.domain, d._count]));
  const stats = [
    { label: t("published"), value: published },
    { label: t("inReview"), value: inReview },
    { label: t("drafts"), value: drafts },
    { label: t("openReports"), value: openReports },
    { label: t("students"), value: students },
    { label: t("attempts"), value: attempts },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      {samples > 0 && (
        <p role="status" className="rounded-md border border-warning/50 bg-warning-muted p-3 text-sm">
          <strong>{t("samples")}: {samples}.</strong> {t("samplesWarning")}
        </p>
      )}
      {disputed > 0 && (
        <p role="status" className="rounded-md border border-warning/50 bg-warning-muted p-3 text-sm">
          <strong>{t("disputed", { count: disputed })}</strong>{" "}
          <Link href="/manage/questions?flag=AI_KEY_DISPUTE" className="underline">
            {t("disputedLink")}
          </Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold tabular-nums">{s.value}</CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("bySection")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          {(["RW", "MATH"] as const).map((section) => (
            <div key={section}>
              <h3 className="mb-2 font-semibold">{tx(`sections.${section}`)}</h3>
              <ul className="space-y-1 text-sm">
                {DOMAINS.filter((d) => d.section === section).map((d) => (
                  <li key={d.key} className="flex justify-between gap-2">
                    <span>{tx(`domains.${d.key}`)}</span>
                    <span className="tabular-nums text-muted-foreground">{domainCount.get(d.key) ?? 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
