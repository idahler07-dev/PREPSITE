import { getTranslations } from "next-intl/server";
import { Container, PageHeader } from "@/components/layout/page-header";

const ITEMS = ["official", "score", "language", "device", "mistake"] as const;

export async function generateMetadata() {
  const t = await getTranslations("faq");
  return { title: t("title") };
}

export default async function FaqPage() {
  const t = await getTranslations("faq");
  return (
    <Container className="max-w-3xl">
      <PageHeader title={t("title")} />
      <div className="divide-y rounded-xl border">
        {ITEMS.map((k) => (
          <details key={k} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="me-2 inline-block transition-transform group-open:rotate-90" aria-hidden>
                ›
              </span>
              {t(`items.${k}.q`)}
            </summary>
            <p className="mt-3 text-muted-foreground">{t(`items.${k}.a`)}</p>
          </details>
        ))}
      </div>
    </Container>
  );
}
