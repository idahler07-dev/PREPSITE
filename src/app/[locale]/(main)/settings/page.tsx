import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { requireUser } from "@/server/auth/session";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/account/goal-form";
import { NameForm } from "@/components/account/name-form";
import { DeleteAccount } from "@/components/account/delete-account";
import { NotificationSettings } from "@/components/account/notification-settings";
import { resolvePrefs } from "@/config/notifications";
import { db } from "@/lib/db";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export async function generateMetadata() {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  const t = await getTranslations("settings");
  const prefs = await db.user.findUnique({ where: { id: user.id }, select: { notificationPrefs: true, telegramId: true } });
  return (
    <Container className="max-w-3xl space-y-6">
      <PageHeader title={t("title")} />
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NameForm name={user.name ?? ""} />
          <dl className="grid gap-2 text-sm sm:grid-cols-3">
            <dt className="font-medium">{t("email")}</dt>
            <dd className="text-muted-foreground sm:col-span-2">{user.email ?? t("notConnected")}</dd>
            <dt className="font-medium">{t("telegram")}</dt>
            <dd className="text-muted-foreground sm:col-span-2">{user.telegramUsername ? `@${user.telegramUsername}` : t("notConnected")}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("preferences")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t("language")}</span>
            <LocaleSwitcher />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t("theme")}</span>
            <ThemeToggle signedIn />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSettings initial={resolvePrefs(prefs?.notificationPrefs)} hasEmail={!!user.email} hasTelegram={!!user.telegramUsername || !!prefs?.telegramId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("goal")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalForm
            mode="settings"
            defaults={{
              testDate: user.testDate?.toISOString().slice(0, 10) ?? "",
              targetScore: user.targetScore?.toString() ?? "",
              currentScore: user.currentScore?.toString() ?? "",
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("data")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">{t("exportTitle")}</h3>
            <CardDescription>{t("exportBody")}</CardDescription>
            <Button asChild variant="outline">
              <a href="/api/me/export" download>
                <Download aria-hidden /> {t("exportButton")}
              </a>
            </Button>
          </div>
          <div className="space-y-2 border-t pt-6">
            <h3 className="font-medium text-destructive">{t("deleteTitle")}</h3>
            <CardDescription>{t("deleteBody")}</CardDescription>
            <DeleteAccount />
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
