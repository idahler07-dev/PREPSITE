import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionFilters } from "@/components/admin/question-filters";
import { ReviewQueue } from "@/components/admin/review-queue";
import { Pagination } from "@/components/admin/pagination";
import { listQuestions, PAGE_SIZE, parseQuestionFilters } from "@/server/questions/query";

export default async function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getTranslations("admin.review");
  const filters = parseQuestionFilters(await searchParams);
  const statusFilter = filters.status && ["DRAFT", "IN_REVIEW"].includes(filters.status) ? {} : { status: { in: ["DRAFT" as const, "IN_REVIEW" as const] } };
  const [{ items, total, pages }, sources] = await Promise.all([
    listQuestions(filters, statusFilter),
    db.source.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <QuestionFilters sources={sources.map((s) => ({ value: s.id, label: s.name }))} show={["flag", "section", "domain", "skill", "difficulty", "source", "origin"]} />
      {items.length === 0 ? (
        <p className="rounded-md border p-8 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ReviewQueue rows={items.map((q) => ({ ...q, updatedAt: q.updatedAt.toISOString(), stem: q.stem.slice(0, 160) }))} />
      )}
      <Pagination page={filters.page} pages={pages} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
