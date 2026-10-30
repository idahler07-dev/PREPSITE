import { getFormatter, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { aiLimits } from "@/config/ai-limits";
import { aiAvailable } from "@/server/ai/client";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiDraftForm, RefreshWhileRunning } from "@/components/admin/ai-draft-form";
import { FlagList } from "@/components/admin/flag-badges";

type DraftLog = { created?: { id: string; code: string; flags: string[] }[]; skipped?: { reason: string }[] };

export default async function AiDraftsPage() {
  const t = await getTranslations("admin.aiDrafts");
  const tx = await getTranslations("taxonomy");
  const te = await getTranslations("enums");
  const format = await getFormatter();
  const enabled = aiAvailable();
  const batches = await db.aiDraftBatch.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { createdBy: { select: { name: true, email: true } } } });
  const running = batches.some((b) => b.status === "QUEUED" || b.status === "RUNNING");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <RefreshWhileRunning running={running} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("new")}</CardTitle>
          <CardDescription>{t("rules")}</CardDescription>
        </CardHeader>
        <CardContent>
          {enabled ? <AiDraftForm maxCount={aiLimits.draftBatchMax} defaultPrefix={siteConfig.questionCodes.defaultPrefix} /> : <p className="text-sm text-muted-foreground">{t("disabled")}</p>}
        </CardContent>
      </Card>

      {batches.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="space-y-3">
          {batches.map((b) => {
            const log = (b.log as DraftLog | null) ?? {};
            return (
              <li key={b.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {tx(`skills.${b.skill as "INFERENCES"}`)} · {te(`difficulty.${b.difficulty}`)} · {t("countShort", { count: b.count })}
                  </span>
                  <Badge variant={b.status === "FAILED" ? "destructive" : b.status === "DONE" ? "default" : "secondary"}>{t(`status.${b.status}`)}</Badge>
                  <span className="ms-auto text-sm text-muted-foreground">
                    {b.createdBy.name ?? b.createdBy.email} · {format.dateTime(b.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
                {b.error && <p className="mt-2 text-sm text-destructive">{b.error}</p>}
                {!!log.created?.length && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {log.created.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/questions/${c.id}`} className="font-mono underline">
                          {c.code}
                        </Link>
                        <FlagList flags={c.flags} />
                      </li>
                    ))}
                  </ul>
                )}
                {!!log.skipped?.length && <p className="mt-2 text-sm text-muted-foreground">{t("skipped", { count: log.skipped.length })}</p>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-sm">
        <Link href="/admin/review?origin=AI_DRAFTED" className="underline">
          {t("openQueue")}
        </Link>
      </p>
    </div>
  );
}
