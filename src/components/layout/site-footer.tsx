import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const b = await getTranslations("brand");
  const cols = [
    { title: t("product"), links: [{ href: "/#features", label: t("features") }, { href: "/pricing", label: t("pricing") }, { href: "/faq", label: t("faq") }, { href: "/resources", label: t("resources") }] },
    { title: t("company"), links: [{ href: "/about", label: t("about") }, { href: "/contact", label: t("contact") }] },
    { title: t("legal"), links: [{ href: "/terms", label: t("terms") }, { href: "/privacy", label: t("privacy") }, { href: "/refunds", label: t("refunds") }] },
  ];
  const social = [
    { href: siteConfig.social.telegram, label: t("telegram") },
    { href: siteConfig.social.instagram, label: t("instagram") },
    { href: siteConfig.social.youtube, label: t("youtube") },
  ].filter((s) => s.href);
  return (
    <footer className="mt-auto border-t bg-section-tint">
      <div className="mx-auto grid max-w-[1296px] gap-12 px-6 py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-12 lg:py-20">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-[30ch] text-muted-foreground">{b("taglinePlain")}</p>
          {social.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label={t("social")}>
              {social.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border bg-surface px-4 text-small font-medium hover:border-primary/40">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="mb-4 text-small font-semibold">{c.title}</p>
            <ul className="space-y-1">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-[1296px] flex-col gap-2 px-6 py-6 text-small text-muted-foreground lg:px-12">
          <p>{t("disclaimer")}</p>
          <p>{t("copyright", { year: new Date().getFullYear(), name: siteConfig.legalName })}</p>
        </div>
      </div>
    </footer>
  );
}
