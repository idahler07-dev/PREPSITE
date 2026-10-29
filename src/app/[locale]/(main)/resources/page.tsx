import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import siteConfig from "@site";
import { Container, PageHeader } from "@/components/layout/page-header";

export async function generateMetadata() {
  const t = await getTranslations("resources");
  return { title: t("title") };
}

export default async function ResourcesPage() {
  const t = await getTranslations("resources");
  return (
    <Container>
      <PageHeader title={t("title")} description={t("subtitle")} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {siteConfig.officialResources.map((r) => (
          <li key={r.id} className="flex flex-col rounded-xl border bg-card p-5">
            <h2 className="mb-1 font-semibold">{t(`items.${r.id}.title`)}</h2>
            <p className="mb-4 flex-1 text-sm text-muted-foreground">{t(`items.${r.id}.body`)}</p>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("visit")} <ExternalLink className="size-4" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">{t("note")}</p>
    </Container>
  );
}
