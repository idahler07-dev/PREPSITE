"use client";

import { useTranslations } from "next-intl";
import { BookOpen, ClipboardCheck, FileUp, Flag, Home, LayoutDashboard, Library, Users } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";

export function AdminNav({ isAdmin, counts }: { isAdmin: boolean; counts: { review: number; reports: number } }) {
  const t = useTranslations("admin.nav");
  const items = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard, exact: true },
    { href: "/admin/questions", label: t("questions"), icon: BookOpen },
    { href: "/admin/review", label: t("review"), icon: ClipboardCheck, badge: counts.review },
    { href: "/admin/import", label: t("import"), icon: FileUp },
    { href: "/admin/sources", label: t("sources"), icon: Library },
    { href: "/admin/reports", label: t("reports"), icon: Flag, badge: counts.reports },
    ...(isAdmin ? [{ href: "/admin/users", label: t("users"), icon: Users }] : []),
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label={t("overview")}>
      {items.map(({ href, label, icon: Icon, exact, badge }) => (
        <NavLink key={href} href={href} exact={exact} className="flex shrink-0 items-center gap-2">
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badge && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{badge}</span>}
        </NavLink>
      ))}
      <NavLink href="/dashboard" className="flex shrink-0 items-center gap-2 md:mt-4">
        <Home className="size-4" aria-hidden />
        {t("backToSite")}
      </NavLink>
    </nav>
  );
}
