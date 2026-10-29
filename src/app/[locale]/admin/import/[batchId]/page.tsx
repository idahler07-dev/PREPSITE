import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlagList } from "@/components/admin/flag-badges";
import { ImportConfirm } from "@/components/admin/import-confirm";

interface LoggedRow {
  rowNumber: number;
  errors: string[];
  warnings: string[];
  flags: string[];
  code?: string;
  section?: string;
  skill?: string;
  difficulty?: string;
  type?: string;
  stemExcerpt?: string;
  nearDuplicateOf?: string[];
}

const ROW_ERRORS = ["MISSING_STEM", "INVALID_SECTION", "MISSING_SECTION", "INVALID_DOMAIN", "INVALID_SKILL", "MISSING_TAXONOMY", "INVALID_DIFFICULTY", "INVALID_TYPE", "INVALID_IMAGE_URL", "IMAGE_FETCH_FAILED"] as const;
const ROW_WARNINGS = ["CODE_REASSIGNED", "CODE_INVALID", "CODE_GENERATED", "DIFFICULTY_DEFAULTED", "TYPE_INFERRED"] as const;

export default async function ImportBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const t = await getTranslations("admin.import");
  const tx = await getTranslations("taxonomy");
  const te = await getTranslations("enums");
  const batch = await db.importBatch.findUnique({
    where: { id: batchId },
    include: { file: { select: { originalName: true } }, source: { select: { name: true } } },
  });
  if (!batch) notFound();
  const rows = ((batch.log as unknown as LoggedRow[] | null) ?? []).slice().sort((a, b) => a.rowNumber - b.rowNumber);
  const errorRows = rows.filter((r) => r.errors.length > 0 && !r.code);
  const flagged = rows.filter((r) => r.code && r.flags.length > 0);
  const ok = rows.filter((r) => r.code && r.flags.length === 0);
  const importable = rows.length - errorRows.length;

  const errLabel = (e: string) => ((ROW_ERRORS as readonly string[]).includes(e) ? t(`rowErrors.${e as (typeof ROW_ERRORS)[number]}`) : e);
  const warnLabel = (w: string) => ((ROW_WARNINGS as readonly string[]).includes(w) ? t(`rowWarnings.${w as (typeof ROW_WARNINGS)[number]}`) : w);

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.status === "PENDING" ? t("previewTitle") : (batch.file?.originalName ?? t("title"))}
        description={`${batch.source.name} · ${batch.file?.originalName ?? ""}`}
        actions={
          batch.status === "PENDING" ? (
            <ImportConfirm batchId={batch.id} count={importable} />
          ) : (
            <Button asChild variant="outline">
              <Link href={`/admin/review?batch=${batch.id}`}>{t("goToReview")}</Link>
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={batch.status === "READY" ? "default" : batch.status === "FAILED" ? "destructive" : "secondary"}>{t(`batchStatus.${batch.status}`)}</Badge>
        <span className="text-sm text-muted-foreground">{t("summary", { total: rows.length, ok: ok.length, warnings: flagged.length, errors: errorRows.length })}</span>
      </div>
      {batch.error && <p className="rounded-md border border-destructive/40 bg-danger-muted p-3 text-sm">{batch.error}</p>}
      {errorRows.length > 0 && batch.status === "PENDING" && <p className="text-sm text-muted-foreground">{t("errorRowsSkipped")}</p>}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t("row")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.code")}</TableHead>
              <TableHead className="min-w-64">{t("columns.question")}</TableHead>
              <TableHead>{t("columns.difficulty")}</TableHead>
              <TableHead className="min-w-56">{t("columns.details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isError = !r.code;
              const Icon = isError ? XCircle : r.flags.length ? AlertTriangle : CheckCircle2;
              return (
                <TableRow key={r.rowNumber}>
                  <TableCell className="tabular-nums">{r.rowNumber}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Icon className={`size-4 ${isError ? "text-destructive" : r.flags.length ? "text-warning" : "text-success"}`} aria-hidden />
                      {isError ? t("rowError") : r.flags.length ? t("rowFlagged") : t("rowOk")}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{r.code ?? ""}</TableCell>
                  <TableCell>
                    {r.skill && <div className="text-sm">{tx(`skills.${r.skill as "INFERENCES"}`)}</div>}
                    <div className="line-clamp-2 text-xs text-muted-foreground">{r.stemExcerpt}</div>
                  </TableCell>
                  <TableCell className="text-sm">{r.difficulty ? te(`difficulty.${r.difficulty as "EASY"}`) : ""}</TableCell>
                  <TableCell className="space-y-1 text-xs">
                    {r.errors.map((e) => (
                      <div key={e} className="text-destructive">
                        {errLabel(e)}
                      </div>
                    ))}
                    {r.flags.length > 0 && <FlagList flags={r.flags} />}
                    {r.nearDuplicateOf && r.nearDuplicateOf.length > 0 && <div className="text-muted-foreground">≈ {r.nearDuplicateOf.join(", ")}</div>}
                    {r.warnings.map((w) => (
                      <div key={w} className="text-muted-foreground">
                        {warnLabel(w)}
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
