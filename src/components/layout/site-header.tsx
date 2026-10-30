import { getTranslations } from "next-intl/server";
import { getCurrentUser, isStaff } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle, ThemeSync } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { ScrollHeader } from "./scroll-header";
import { CommandPaletteButton } from "./command-palette";

/** Marketing pages' top bar: sticky, gains blur and shrinks a little on scroll. */
export async function SiteHeader() {
  const t = await getTranslations("nav");
  const c = await getTranslations("common");
  const user = await getCurrentUser();
  const h = await getTranslations("home.nav");
  const items = [
    { href: "/#features", label: h("features") },
    { href: "/pricing", label: h("pricing") },
    { href: "/faq", label: h("faq") },
  ];

  return (
    <ScrollHeader>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {c("skipToContent")}
      </a>
      <div className="mx-auto flex h-full max-w-[1296px] items-center gap-2 px-6 lg:px-12">
        <MobileNav items={items} />
        <Logo href="/" />
        <nav className="ms-6 hidden items-center gap-1 md:flex" aria-label={t("mainNavigation")}>
          {items.map((i) => (
            <NavLink key={i.href} href={i.href}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <CommandPaletteButton className="hidden sm:inline-flex" />
          <ThemeToggle signedIn={!!user} />
          {user ? (
            <>
              <ThemeSync theme={user.theme} />
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">{t("dashboard")}</Link>
              </Button>
              <UserMenu name={user.name} email={user.email} isStaff={isStaff(user)} />
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">{h("login")}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full px-4">
                <Link href="/login">{h("start")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </ScrollHeader>
  );
}
