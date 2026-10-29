import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { Container, PageHeader } from "@/components/layout/page-header";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: t("title") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const c = siteConfig.contact;
  const rows = [
    { label: t("email"), value: c.email, href: `mailto:${c.email}` },
    { label: t("phone"), value: c.phone, href: `tel:${c.phone.replace(/\s+/g, "")}` },
    { label: t("telegram"), value: c.telegram, href: c.telegramUrl },
    { label: t("address"), value: c.address },
    { label: t("hours"), value: c.hours },
  ].filter((r) => r.value);
  return (
    <Container className="max-w-2xl">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <dl className="divide-y rounded-xl border">
        {rows.map((r) => (
          <div key={r.label} className="grid gap-1 p-4 sm:grid-cols-3">
            <dt className="font-medium">{r.label}</dt>
            <dd className="text-muted-foreground sm:col-span-2">
              {r.href ? (
                <a href={r.href} className="text-primary hover:underline" rel="noopener noreferrer">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
