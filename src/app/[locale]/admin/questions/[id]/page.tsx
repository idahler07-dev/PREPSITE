import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import type { QuestionFormValues } from "@/lib/questions/schema";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionEditor } from "@/components/admin/question-editor";
import { ReportsPanel, StatusActions, VersionHistory } from "@/components/admin/question-side-panels";
import { codeExample } from "@/server/questions/code-example";
import { nearDuplicatesOf } from "@/server/questions/service";
import { Link } from "@/i18n/navigation";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("admin.editor");
  const te = await getTranslations("enums");
  const format = await getFormatter();
  const q = await db.question.findUnique({
    where: { id },
    include: {
      sourceFile: { select: { originalName: true, uploadedAt: true, uploadedBy: { select: { name: true, email: true } } } },
      createdBy: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
      versions: { orderBy: { version: "desc" }, take: 30, include: { editedBy: { select: { name: true, email: true } } } },
      reports: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true, email: true } } } },
      aiExplanations: { where: { verdict: "DISAGREE" }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, content: true, questionVersion: true, mode: true } },
    },
  });
  if (!q) notFound();
  const [sources, dupes] = await Promise.all([
    db.source.findMany({ where: { OR: [{ withdrawnAt: null }, { id: q.sourceId ?? "" }] }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    nearDuplicatesOf(q.fingerprint, q.section, [q.id]),
  ]);
  const who = (u: { name: string | null; email: string | null } | null) => u?.name ?? u?.email ?? null;
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
    <div className="space-y-6">
      <PageHeader title={t("editTitle", { code: q.code })} actions={<StatusActions id={q.id} status={q.status} />} />
      <QuestionEditor
        initial={{ id: q.id, version: q.version, status: q.status, flags: q.flags, values, nearDuplicates: dupes }}
        sources={sources}
        defaultPrefix={siteConfig.questionCodes.defaultPrefix}
        codeExample={codeExample()}
      />
      {q.aiExplanations.length > 0 && q.flags.includes("AI_KEY_DISPUTE") && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-base">{t("aiConcerns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {q.aiExplanations.map((e) => (
                <li key={e.id}>
                  {e.content || "—"} <span className="text-muted-foreground">({t("aiConcernVersion", { version: e.questionVersion })})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("provenance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              {t("origin")}: {te(`origin.${q.origin}`)}
            </p>
            {q.sourceFile && (
              <p>
                {t("provenanceFile", { file: q.sourceFile.originalName })}
                {q.sourcePage != null && `, ${t("provenancePage", { page: q.sourcePage })}`}
                {q.sourceRef && q.sourcePage == null && `, ${t("provenanceRow", { row: q.sourceRef })}`}
              </p>
            )}
            {q.importBatchId && q.sourcePage != null && (
              <p>
                <Link className="underline" href={`/admin/import/${q.importBatchId}/review?q=${q.id}`}>
                  {t("viewOriginal")}
                </Link>
              </p>
            )}
            {q.sourceFile && (
              <p className="text-muted-foreground">
                {t("provenanceBy", {
                  name: who(q.sourceFile.uploadedBy) ?? "—",
                  date: format.dateTime(q.sourceFile.uploadedAt, { dateStyle: "medium" }),
                })}
              </p>
            )}
            {q.createdBy && <p className="text-muted-foreground">{t("createdBy", { name: who(q.createdBy) ?? "—" })}</p>}
            {q.reviewedBy && q.reviewedAt && (
              <p className="text-muted-foreground">
                {t("reviewedBy", { name: who(q.reviewedBy) ?? "—", date: format.dateTime(q.reviewedAt, { dateStyle: "medium" }) })}
              </p>
            )}
            {q.attemptCount > 0 && <p>{t("stats", { correct: q.correctCount, attempts: q.attemptCount })}</p>}
          </CardContent>
        </Card>
        <VersionHistory
          questionId={q.id}
          current={q.version}
          versions={q.versions.map((v) => ({ version: v.version, createdAt: v.createdAt.toISOString(), editor: who(v.editedBy), changeNote: v.changeNote }))}
        />
        <ReportsPanel
          reports={q.reports.map((r) => ({ id: r.id, reason: r.reason, message: r.message, status: r.status, createdAt: r.createdAt.toISOString(), by: who(r.user) }))}
        />
      </div>
    </div>
  );
}
