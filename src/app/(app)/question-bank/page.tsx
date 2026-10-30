import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { bankFiltersSchema, getBankPage, getDifficultyCounts, getDomainProgress } from "@/server/bank/query";
import { Container, PageHeader } from "@/components/layout/page-header";
import { BankView } from "@/components/bank/bank-view";

export async function generateMetadata() {
  const t = await getTranslations("bank");
  return { title: t("title") };
}

/** Every published question with the student's own results; filters live in the URL. */
export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/question-bank");
  const t = await getTranslations("bank");
  const sp = await searchParams;
  const filters = bankFiltersSchema.parse(Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])));
  const [page, counts, progress] = await Promise.all([getBankPage(user.id, filters), getDifficultyCounts(user.id, filters), getDomainProgress(user.id, filters.section)]);
  return (
    <Container className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <BankView filters={filters} page={page} counts={counts} progress={progress} />
    </Container>
  );
}
