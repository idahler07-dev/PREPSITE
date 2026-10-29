"use client";

import { useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeQuestionStatus, resolveReport, restoreQuestionVersion } from "@/server/actions/admin/questions";

export function VersionHistory({
  questionId,
  current,
  versions,
}: {
  questionId: string;
  current: number;
  versions: { version: number; createdAt: string; editor: string | null; changeNote: string | null }[];
}) {
  const t = useTranslations("admin.editor");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("versions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length <= 1 ? (
          <p className="text-sm text-muted-foreground">{t("noVersions")}</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.version} className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">
                    {t("version", { version: v.version })}
                    {v.changeNote && <span className="ms-2 font-normal text-muted-foreground">{v.changeNote}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("versionBy", { name: v.editor ?? "—", date: format.dateTime(new Date(v.createdAt), { dateStyle: "medium", timeStyle: "short" }) })}
                  </div>
                </div>
                {v.version !== current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const res = await restoreQuestionVersion(questionId, v.version);
                        if (res.ok) {
                          toast.success(t("updated"));
                          router.refresh();
                        } else toast.error(res.error === "VERSION_CONFLICT" ? t("versionConflict") : res.error);
                      })
                    }
                  >
                    {t("restoreVersion")}
                  </Button>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsPanel({ reports }: { reports: { id: string; reason: string; message: string | null; status: string; createdAt: string; by: string | null }[] }) {
  const t = useTranslations("admin.reports");
  const te = useTranslations("admin.editor");
  const tr = useTranslations("results.report.reasons");
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  if (reports.length === 0) return null;
  const act = (id: string, status: "RESOLVED" | "DISMISSED") =>
    start(async () => {
      const res = await resolveReport(id, status);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{te("reports")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          {reports.map((r) => (
            <li key={r.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{tr(r.reason as "OTHER")}</span>
                <span className="text-xs text-muted-foreground">{format.dateTime(new Date(r.createdAt), { dateStyle: "medium" })}</span>
              </div>
              {r.message && <p className="mt-1 whitespace-pre-wrap">{r.message}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{t("by", { name: r.by ?? t("anonymous") })}</p>
              {r.status === "OPEN" ? (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(r.id, "RESOLVED")}>
                    {t("resolve")}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(r.id, "DISMISSED")}>
                    {t("dismiss")}
                  </Button>
                </div>
              ) : (
                <p className="mt-1 text-xs">{r.status === "RESOLVED" ? t("resolved") : t("dismissed")}</p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function StatusActions({ id, status }: { id: string; status: string }) {
  const t = useTranslations("admin.editor");
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (s: "DRAFT" | "RETIRED") =>
    start(async () => {
      const res = await changeQuestionStatus(id, s);
      if (res.ok) {
        toast.success(t("statusChanged"));
        router.refresh();
      } else toast.error(res.error);
    });
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "RETIRED" && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => go("RETIRED")}>
          {t("retire")}
        </Button>
      )}
      {status === "RETIRED" && (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => go("DRAFT")}>
          {t("restoreDraft")}
        </Button>
      )}
    </div>
  );
}
