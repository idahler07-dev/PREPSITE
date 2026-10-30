import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { mockMissing } from "@/server/mock/service";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewMockForm } from "@/components/admin/mock-forms";
import { requireOwner } from "@/server/auth/session";

export default async function AdminMocksPage() {
  await requireOwner();
  const t = await getTranslations("admin.mocks");
  const tx = await getTranslations("taxonomy");
  const format = await getFormatter();
  const [mocks, published] = await Promise.all([
    db.mockTest.findMany({
      where: { kind: "CURATED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, sections: true, createdAt: true, assemblyLog: true, _count: { select: { attempts: true } } },
    }),
    db.question.groupBy({ by: ["section"], where: { status: "PUBLISHED" }, _count: true }),
  ]);
  const count = (s: "RW" | "MATH") => published.find((p) => p.section === s)?._count ?? 0;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("new")}</CardTitle>
          <CardDescription>{t("newHelp", { rw: count("RW"), math: count("MATH") })}</CardDescription>
        </CardHeader>
        <CardContent>
          <NewMockForm />
        </CardContent>
      </Card>
      {mocks.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {mocks.map((m) => {
            const missing = mockMissing(m.assemblyLog);
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 p-4">
                <Link href={`/manage/mocks/${m.id}`} className="font-medium underline">
                  {m.title}
                </Link>
                <Badge variant={m.status === "PUBLISHED" ? "default" : "secondary"}>{t(`status.${m.status}`)}</Badge>
                {missing > 0 && <Badge variant="destructive">{t("missing", { count: missing })}</Badge>}
                <span className="ms-auto text-sm text-muted-foreground">
                  {m.sections.map((s) => tx(`sections.${s}`)).join(" + ")} · {t("attempts", { count: m._count.attempts })} ·{" "}
                  {format.dateTime(m.createdAt, { dateStyle: "medium" })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
