import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { Container, PageHeader } from "@/components/layout/page-header";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return { title: t("title") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <Container className="max-w-3xl">
      <PageHeader title={t("title")} />
      <div className="space-y-8 text-lg leading-relaxed">
        <p>{t("body", { name: siteConfig.name })}</p>
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("contentTitle")}</h2>
          <p className="text-muted-foreground">{t("contentBody")}</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl font-semibold">{t("scoreTitle")}</h2>
          <p className="text-muted-foreground">{t("scoreBody")}</p>
        </section>
      </div>
    </Container>
  );
}
