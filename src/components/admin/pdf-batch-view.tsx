import { getTranslations } from "next-intl/server";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportProgress } from "./import-progress";

interface PdfLog {
  created: number;
  answersFromKey: number;
  unusedKeyEntries: number;
  withoutAnswer: number;
  failedPages: { fileId: string; page: number; error: string | null }[];
  methods: { ai: number; text: number };
}

const BATCH_ERRORS = ["NOT_A_PDF", "PDF_ENCRYPTED", "PDF_INVALID", "TOO_MANY_PAGES", "NO_FILES", "UPLOAD_INCOMPLETE"] as const;

export async function PdfBatchView({ batchId }: { batchId: string }) {
  const t = await getTranslations("admin.import");
  const batch = await db.importBatch.findUniqueOrThrow({ where: { id: batchId }, include: { files: { select: { id: true, originalName: true } } } });
  const fileName = (id: string) => batch.files.find((f) => f.id === id)?.originalName ?? "";

  if (batch.status === "PENDING" || batch.status === "PROCESSING" || batch.status === "FINALIZING") {
    const pages = await db.importPage.groupBy({ by: ["status"], where: { batchId }, _count: true });
    const count = (s: string) => pages.find((p) => p.status === s)?._count ?? 0;
    return (
      <ImportProgress
        batchId={batchId}
        initial={{ status: batch.status, total: batch.totalItems, done: count("DONE") + count("FAILED"), failed: count("FAILED") }}
      />
    );
  }

  if (batch.status === "FAILED") {
    const [code, file] = (batch.error ?? "").split(":");
    const message = BATCH_ERRORS.includes(code as (typeof BATCH_ERRORS)[number])
      ? t(`result.batchErrors.${code as (typeof BATCH_ERRORS)[number]}`, { file: file ?? "" })
      : t("result.batchErrors.other", { message: batch.error ?? "" });
    return (
      <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-danger-muted p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        {message}
      </p>
    );
  }

  const log = (batch.log ?? {}) as Partial<PdfLog>;
  const failed = log.failedPages ?? [];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-success" aria-hidden /> {t("result.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {log.created ? (
            <>
              <p className="font-medium">{t("result.created", { count: log.created })}</p>
              <p>{t("result.answersFromKey", { count: log.answersFromKey ?? 0 })}</p>
              <p className={log.withoutAnswer ? "text-destructive" : undefined}>{t("result.withoutAnswer", { count: log.withoutAnswer ?? 0 })}</p>
              {!!log.unusedKeyEntries && <p className="text-muted-foreground">{t("result.unusedKeyEntries", { count: log.unusedKeyEntries })}</p>}
            </>
          ) : (
            <p>{t("result.noQuestions")}</p>
          )}
          {log.methods && <p className="text-muted-foreground">{t("result.methods", { ai: log.methods.ai, text: log.methods.text })}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {!!log.created && (
              <Button asChild>
                <Link href={`/admin/import/${batchId}/review`}>{t("result.review")}</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/admin/review?batch=${batchId}`}>{t("result.queue")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      {failed.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">{t("result.failedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {failed.map((f) => (
                <li key={`${f.fileId}-${f.page}`}>
                  <span className="font-medium">{t("result.failedPage", { file: fileName(f.fileId), page: f.page })}</span>
                  {": "}
                  <span className="text-muted-foreground">
                    {f.error === "NO_TEXT_LAYER" || f.error === "FILE_MISSING" ? t(`result.pageErrors.${f.error}`) : t("result.pageErrors.other", { message: f.error ?? "" })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
