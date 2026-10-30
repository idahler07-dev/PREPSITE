import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { mockMissing } from "@/server/mock/service";
import type { Shortfall } from "@/lib/mock/assemble";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MockStatusActions } from "@/components/admin/mock-forms";

const ORDER = { standard: 0, harder: 1, easier: 2 } as Record<string, number>;

export default async function AdminMockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("admin.mocks");
  const tx = await getTranslations("taxonomy");
  const te = await getTranslations("enums");
  const mock = await db.mockTest.findUnique({ where: { id }, include: { modules: true, _count: { select: { attempts: true } } } });
  if (!mock || mock.kind !== "CURATED") notFound();

  const ids = mock.modules.flatMap((m) => m.questionIds);
  const questions = new Map(
    (await db.question.findMany({ where: { id: { in: ids } }, select: { id: true, code: true, domain: true, difficulty: true, status: true } })).map((q) => [q.id, q]),
  );
  const log = (mock.assemblyLog as { shortfalls?: Shortfall[] } | null)?.shortfalls ?? [];
  const missing = mockMissing(mock.assemblyLog);
  const modules = [...mock.modules].sort((a, b) => (a.section === b.section ? a.moduleNumber - b.moduleNumber || ORDER[a.variant]! - ORDER[b.variant]! : a.section === "RW" ? -1 : 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title={mock.title}
        description={`${mock.sections.map((s) => tx(`sections.${s}`)).join(" + ")} · ${t(`status.${mock.status}`)} · ${t("attempts", { count: mock._count.attempts })}`}
        actions={<MockStatusActions id={mock.id} status={mock.status} canPublish={missing === 0} canDelete={mock.status === "DRAFT" && mock._count.attempts === 0} />}
      />
      {missing > 0 ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base">{t("missing", { count: missing })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{t("missingHelp")}</p>
          </CardContent>
        </Card>
      ) : null}
      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("shortfalls")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {log.map((s, i) => (
                <li key={i}>
                  {t("shortfallLine", {
                    module: `${tx(`sections.${s.section}`)} · ${t(`variant.${s.variant}`)}`,
                    domain: tx(`domains.${s.domain as "ALGEBRA"}`),
                    difficulty: te(`difficulty.${s.difficulty}`),
                    wanted: s.wanted,
                    substituted: s.substituted,
                    missing: s.missing,
                  })}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {modules.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {tx(`sections.${m.section}`)} · {t("moduleN", { n: m.moduleNumber })} · {t(`variant.${m.variant as "standard"}`)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t("questionCount", { count: m.questionIds.length })}</p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1 text-sm">
                {m.questionIds.map((qid, i) => {
                  const q = questions.get(qid);
                  return (
                    <li key={qid} className="flex gap-2">
                      <span className="w-6 text-end tabular-nums text-muted-foreground">{i + 1}</span>
                      {q ? (
                        <>
                          <Link href={`/admin/questions/${q.id}`} className="font-mono underline">
                            {q.code}
                          </Link>
                          <span className="truncate text-muted-foreground">
                            {tx(`domains.${q.domain as "ALGEBRA"}`)} · {te(`difficulty.${q.difficulty}`)}
                          </span>
                          {q.status !== "PUBLISHED" && <Badge variant="outline">{te(`status.${q.status}`)}</Badge>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
