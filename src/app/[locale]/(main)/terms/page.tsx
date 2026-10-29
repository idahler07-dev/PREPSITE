import { getLocale, getTranslations } from "next-intl/server";
import { Container, PageHeader } from "@/components/layout/page-header";
import { RichText } from "@/components/content/rich-text";
import { loadLegalPage } from "@/server/content";

export async function generateMetadata() {
  const t = await getTranslations("legal.terms");
  return { title: t("title") };
}

export default async function LegalPage() {
  const t = await getTranslations("legal");
  const { html } = await loadLegalPage("terms", await getLocale());
  return (
    <Container className="max-w-3xl">
      <PageHeader title={t("terms.title")} />
      <p className="mb-6 rounded-md border border-dashed bg-warning-muted p-3 text-sm">{t("draftNotice")}</p>
      <RichText html={html} className="prose prose-neutral max-w-none dark:prose-invert" />
    </Container>
  );
}
