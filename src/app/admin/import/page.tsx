import { getFormatter, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { TEMPLATE_COLUMNS } from "@/lib/import/spreadsheet";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpreadsheetImportForm } from "@/components/admin/spreadsheet-import-form";
import { PdfImportForm } from "@/components/admin/pdf-import-form";
import { aiAvailable } from "@/server/ai/client";

export default async function ImportPage() {
  const t = await getTranslations("admin.import");
  const format = await getFormatter();
  const [sources, batches] = await Promise.all([
    db.source.findMany({ where: { withdrawnAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { file: { select: { originalName: true } }, files: { select: { originalName: true } }, source: { select: { name: true } }, _count: { select: { questions: true } } },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs defaultValue="pdf">
        <TabsList>
          <TabsTrigger value="pdf">{t("pdfTab")}</TabsTrigger>
          <TabsTrigger value="spreadsheet">{t("spreadsheetTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="spreadsheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("template")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="/api/admin/imports/template?format=xlsx" download>
                    <Download aria-hidden /> {t("templateXlsx")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href="/api/admin/imports/template?format=csv" download>
                    <Download aria-hidden /> {t("templateCsv")}
                  </a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t("columnsHelp", { columns: TEMPLATE_COLUMNS.join(", ") })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <SpreadsheetImportForm sources={sources} defaultPrefix={siteConfig.questionCodes.defaultPrefix.MATH} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pdf">
          <Card>
            <CardContent className="pt-6">
              <PdfImportForm sources={sources} defaultPrefix={siteConfig.questionCodes.defaultPrefix} aiEnabled={aiAvailable()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("batches")}</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noBatches")}</p>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {batches.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <Link href={`/admin/import/${b.id}`} className="font-medium text-primary hover:underline">
                    {b.file?.originalName ?? (b.files.map((f) => f.originalName).join(", ") || b.id)}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {b.source.name} · {format.dateTime(b.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={b.status === "READY" ? "default" : b.status === "FAILED" ? "destructive" : "secondary"}>{t(`batchStatus.${b.status}`)}</Badge>
                  {b._count.questions > 0 && (
                    <Link href={`/admin/review?batch=${b.id}`} className="text-primary hover:underline">
                      {b._count.questions}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
