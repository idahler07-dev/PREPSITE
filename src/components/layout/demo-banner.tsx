import { getTranslations } from "next-intl/server";

export async function DemoBanner() {
  const t = await getTranslations("demo");
  return <p className="bg-primary px-4 py-1.5 text-center text-small font-medium text-primary-foreground">{t("banner")}</p>;
}
