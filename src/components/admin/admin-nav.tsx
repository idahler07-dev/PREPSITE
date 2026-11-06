"use client";

import { useTranslations } from "next-intl";
import {
  BarChart3,
  LineChart,
  BookOpen,
  Languages,
  CreditCard,
  Ticket,
  ClipboardCheck,
  FileText,
  FileUp,
  Flag,
  Home,
  LayoutDashboard,
  Library,
  Sparkles,
  Users,
} from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";

export function AdminNav({
  counts,
}: {
  counts: { review: number; reports: number };
}) {
  const t = useTranslations("admin.nav");
  const items = [
    {
      href: "/manage",
      label: t("overview"),
      icon: LayoutDashboard,
      exact: true,
    },
    { href: "/manage/questions", label: t("questions"), icon: BookOpen },
    {
      href: "/manage/review",
      label: t("review"),
      icon: ClipboardCheck,
      badge: counts.review,
    },
    { href: "/manage/mocks", label: t("mocks"), icon: FileText },
    { href: "/manage/import", label: t("import"), icon: FileUp },
    { href: "/manage/ai-drafts", label: t("aiDrafts"), icon: Sparkles },
    { href: "/manage/vocab", label: t("vocab"), icon: Languages },
    { href: "/manage/sources", label: t("sources"), icon: Library },
    {
      href: "/manage/reports",
      label: t("reports"),
      icon: Flag,
      badge: counts.reports,
    },
    { href: "/manage/analytics", label: t("analytics"), icon: LineChart },
    { href: "/manage/users", label: t("users"), icon: Users },
    { href: "/manage/orders", label: t("orders"), icon: CreditCard },
    { href: "/manage/promos", label: t("promos"), icon: Ticket },
    { href: "/manage/ai-usage", label: t("aiUsage"), icon: BarChart3 },
  ];
  return (
    <nav
      className="flex gap-1 overflow-x-auto md:flex-col"
      aria-label={t("overview")}
    >
      {items.map(({ href, label, icon: Icon, exact, badge }) => (
        <NavLink
          key={href}
          href={href}
          exact={exact}
          className="flex shrink-0 items-center gap-2"
        >
          <Icon className="size-4" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">
              {badge}
            </span>
          )}
        </NavLink>
      ))}
      <NavLink
        href="/dashboard"
        className="flex shrink-0 items-center gap-2 md:mt-4"
      >
        <Home className="size-4" aria-hidden />
        {t("backToSite")}
      </NavLink>
    </nav>
  );
}
