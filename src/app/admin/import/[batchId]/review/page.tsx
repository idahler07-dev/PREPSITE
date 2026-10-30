import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { QuestionFormValues } from "@/lib/questions/schema";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionEditor } from "@/components/admin/question-editor";
import { PageViewer } from "@/components/admin/page-viewer";
import { ImportReviewNav } from "@/components/admin/import-review-nav";
import { codeExample } from "@/server/questions/code-example";
import { nearDuplicatesOf } from "@/server/questions/service";

type Show = "all" | "flagged" | "drafts";

/** Side-by-side review of an imported PDF: original page on the left, editable question on the right. */
export default async function ImportReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  const { batchId } = await params;
  const sp = await searchParams;
  const show: Show = sp.show === "flagged" || sp.show === "drafts" ? sp.show : "all";
  const t = await getTranslations("admin.importReview");

  const batch = await db.importBatch.findUnique({ where: { id: batchId }, include: { files: { orderBy: { uploadedAt: "asc" } } } });
  if (!batch || batch.kind !== "PDF") notFound();

  const where: Prisma.QuestionWhereInput = { importBatchId: batchId };
  if (show === "flagged") where.flags = { isEmpty: false };
  if (show === "drafts") where.status = { in: ["DRAFT", "IN_REVIEW"] };
  const fileOrder = new Map(batch.files.map((f, i) => [f.id, i]));
  const list = (await db.question.findMany({ where, select: { id: true, code: true, sourceFileId: true, sourcePage: true, sourceRef: true, flags: true } })).sort(
    (a, b) =>
      (fileOrder.get(a.sourceFileId ?? "") ?? 0) - (fileOrder.get(b.sourceFileId ?? "") ?? 0) ||
      (a.sourcePage ?? 0) - (b.sourcePage ?? 0) ||
      Number(a.sourceRef ?? 0) - Number(b.sourceRef ?? 0),
  );
  const currentId = list.find((q) => q.id === sp.q)?.id ?? list[0]?.id ?? null;

  const header = (
    <PageHeader
      title={t("title")}
      actions={
        <Link href={`/admin/import/${batchId}`} className="text-sm text-primary hover:underline">
          {t("backToImport")}
        </Link>
      }
    />
  );
  const nav = (
    <ImportReviewNav
      batchId={batchId}
      show={show}
      currentId={currentId}
      items={list.map((q) => ({ id: q.id, label: `${q.code}${q.flags.length ? " ⚑" : ""}` }))}
    />
  );
  if (!currentId) {
    return (
      <div className="space-y-4">
        {header}
        {nav}
        <p className="rounded-md border p-8 text-center text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const q = await db.question.findUniqueOrThrow({ where: { id: currentId } });
  const [pages, sources, dupes] = await Promise.all([
    db.importPage.findMany({ where: { fileId: q.sourceFileId ?? "" }, orderBy: { pageNumber: "asc" }, select: { id: true, pageNumber: true, imageKey: true } }),
    db.source.findMany({ where: { OR: [{ withdrawnAt: null }, { id: q.sourceId ?? "" }] }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    nearDuplicatesOf(q.fingerprint, q.section, [q.id]),
  ]);
  const file = batch.files.find((f) => f.id === q.sourceFileId);
  const values: QuestionFormValues = {
    code: q.code,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    type: q.type,
    passage: q.passage,
    stem: q.stem,
    choices: (q.choices as QuestionFormValues["choices"]) ?? [],
    correctAnswers: q.correctAnswers,
    explanation: q.explanation,
    wrongChoiceRationales: (q.wrongChoiceRationales as QuestionFormValues["wrongChoiceRationales"]) ?? null,
    tags: q.tags,
    sourceId: q.sourceId,
  };

  return (
    <div className="space-y-4">
      {header}
      {nav}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PageViewer
            key={q.id}
            fileName={file?.originalName ?? ""}
            initialPage={q.sourcePage ?? 1}
            pages={pages.map((p) => ({ id: p.id, pageNumber: p.pageNumber, hasImage: !!p.imageKey }))}
          />
        </div>
        <QuestionEditor
          key={`${q.id}-${q.version}`}
          stacked
          initial={{ id: q.id, version: q.version, status: q.status, flags: q.flags, values, nearDuplicates: dupes }}
          sources={sources}
          defaultPrefix={siteConfig.questionCodes.defaultPrefix}
          codeExample={codeExample()}
        />
      </div>
    </div>
  );
}
