import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const links = [
    { href: "/about", label: t("about") },
    { href: "/resources", label: t("resources") },
    { href: "/contact", label: t("contact") },
    { href: "/terms", label: t("terms") },
    { href: "/privacy", label: t("privacy") },
    { href: "/refunds", label: t("refunds") },
  ];
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground">
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label={t("about")}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>{t("disclaimer")}</p>
        <p>{t("copyright", { year: new Date().getFullYear(), name: siteConfig.legalName })}</p>
      </div>
    </footer>
  );
}
