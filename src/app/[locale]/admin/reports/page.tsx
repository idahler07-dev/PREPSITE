import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsPanel } from "@/components/admin/question-side-panels";

export default async function ReportsPage() {
  const t = await getTranslations("admin.reports");
  const reports = await db.questionReport.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { question: { select: { id: true, code: true, status: true } }, user: { select: { name: true, email: true } } },
  });
  const byQuestion = new Map<string, typeof reports>();
  for (const r of reports) byQuestion.set(r.questionId, [...(byQuestion.get(r.questionId) ?? []), r]);
  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} />
      {reports.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      {[...byQuestion.values()].map((list) => {
        const q = list[0]!.question;
        return (
          <section key={q.id} className="space-y-2">
            <h2 className="font-mono font-semibold">
              <Link href={`/admin/questions/${q.id}`} className="text-primary hover:underline">
                {q.code}
              </Link>
            </h2>
            <ReportsPanel
              reports={list.map((r) => ({
                id: r.id,
                reason: r.reason,
                message: r.message,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                by: r.user?.name ?? r.user?.email ?? null,
              }))}
            />
          </section>
        );
      })}
    </div>
  );
}
