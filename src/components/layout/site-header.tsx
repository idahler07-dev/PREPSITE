import { getTranslations } from "next-intl/server";
import { getCurrentUser, isStaff } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { MobileNav } from "./mobile-nav";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle, ThemeSync } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const user = await getCurrentUser();
  const items = user
    ? [
        { href: "/dashboard", label: t("dashboard") },
        { href: "/practice", label: t("practice") },
        { href: "/mocks", label: t("mocks") },
        { href: "/history", label: t("history") },
        { href: "/resources", label: t("resources") },
      ]
    : [
        { href: "/pricing", label: t("pricing") },
        { href: "/resources", label: t("resources") },
        { href: "/about", label: t("about") },
        { href: "/faq", label: t("faq") },
      ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {(await getTranslations("common"))("skipToContent")}
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <MobileNav items={items} />
        <Logo href={user ? "/dashboard" : "/"} />
        <nav className="ms-4 hidden items-center gap-1 md:flex" aria-label={t("mainNavigation")}>
          {items.map((i) => (
            <NavLink key={i.href} href={i.href}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <div className="hidden sm:block">
            <LocaleSwitcher compact />
          </div>
          <ThemeToggle signedIn={!!user} />
          {user ? (
            <>
              <ThemeSync theme={user.theme} />
              <UserMenu name={user.name} email={user.email} isStaff={isStaff(user)} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
