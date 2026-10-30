import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewSourceForm, WithdrawButton } from "@/components/admin/source-forms";
import { requireOwner } from "@/server/auth/session";

export default async function SourcesPage() {
  await requireOwner();
  const t = await getTranslations("admin.sources");
  const format = await getFormatter();
  const sources = await db.source.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rightsConfirmedBy: { select: { name: true, email: true } },
      files: { orderBy: { uploadedAt: "desc" }, select: { id: true, originalName: true, kind: true, uploadedAt: true, _count: { select: { questions: true } } } },
      _count: { select: { questions: true } },
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSourceForm />
        </CardContent>
      </Card>
      {sources.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-4">
          {sources.map((s) => (
            <li key={s.id}>
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{s.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t("owner")}: {s.owner}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("confirmedBy", {
                          name: s.rightsConfirmedBy.name ?? s.rightsConfirmedBy.email ?? "—",
                          date: format.dateTime(s.rightsConfirmedAt, { dateStyle: "medium", timeStyle: "short" }),
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/manage/questions?source=${s.id}`} className="text-sm text-primary hover:underline">
                        {t("questions", { count: s._count.questions })}
                      </Link>
                      {s.withdrawnAt ? (
                        <Badge variant="destructive">{t("withdrawn", { date: format.dateTime(s.withdrawnAt, { dateStyle: "medium" }) })}</Badge>
                      ) : (
                        <WithdrawButton sourceId={s.id} name={s.name} />
                      )}
                    </div>
                  </div>
                  {s.notes && <p className="text-sm whitespace-pre-wrap">{s.notes}</p>}
                  <div>
                    <h3 className="mb-1 text-sm font-medium">{t("files")}</h3>
                    {s.files.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t("noFiles")}</p>
                    ) : (
                      <ul className="divide-y rounded-md border text-sm">
                        {s.files.map((f) => (
                          <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 p-2">
                            <span className="font-mono">{f.originalName}</span>
                            <span className="flex items-center gap-3 text-muted-foreground">
                              {t("questions", { count: f._count.questions })}
                              {!s.withdrawnAt && f._count.questions > 0 && <WithdrawButton sourceId={s.id} fileId={f.id} name={f.originalName} />}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
