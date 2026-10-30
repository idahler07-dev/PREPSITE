import { getTranslations } from "next-intl/server";
import { FileUp, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { QuestionFilters } from "@/components/admin/question-filters";
import { QuestionTable } from "@/components/admin/question-table";
import { Pagination } from "@/components/admin/pagination";
import { listQuestions, PAGE_SIZE, parseQuestionFilters } from "@/server/questions/query";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getTranslations("admin.questions");
  const filters = parseQuestionFilters(await searchParams);
  const [{ items, total, pages }, sources] = await Promise.all([
    listQuestions(filters),
    db.source.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader
        title={t("title")}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/import">
                <FileUp aria-hidden /> {t("importCta")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/questions/new">
                <Plus aria-hidden /> {t("new")}
              </Link>
            </Button>
          </>
        }
      />
      <QuestionFilters sources={sources.map((s) => ({ value: s.id, label: s.name }))} />
      <QuestionTable rows={items.map((q) => ({ ...q, updatedAt: q.updatedAt.toISOString(), stem: q.stem.slice(0, 160) }))} />
      <Pagination page={filters.page} pages={pages} total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
