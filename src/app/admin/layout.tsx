import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireRole, STAFF_ROLES } from "@/server/auth/session";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { AdminNav } from "@/components/admin/admin-nav";

export async function generateMetadata() {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(STAFF_ROLES, "/admin");
  const t = await getTranslations("admin");
  const [review, reports] = await Promise.all([
    db.question.count({ where: { status: { in: ["DRAFT", "IN_REVIEW"] } } }),
    db.questionReport.count({ where: { status: "OPEN" } }),
  ]);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
        <Logo href="/admin" />
        <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{t("title")}</span>
        <div className="ms-auto flex items-center gap-1">
          <ThemeToggle signedIn />
          <UserMenu name={user.name} email={user.email} isStaff />
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b p-3 md:w-56 md:shrink-0 md:border-e md:border-b-0">
          <AdminNav isAdmin={user.role === "ADMIN"} counts={{ review, reports }} />
        </aside>
        <main id="main" className="min-w-0 flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
