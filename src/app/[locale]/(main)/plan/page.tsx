import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { requireUser } from "@/server/auth/session";
import { currentPlan } from "@/server/coach/service";
import { dayInZone } from "@/lib/stats/streak";
import type { WeeklyPlan } from "@/lib/coach/plan";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { WeekView } from "@/components/learning/plan-view";
import { RefreshPlanButton } from "@/components/learning/refresh-plan";

export async function generateMetadata() {
  const t = await getTranslations("coach");
  return { title: t("title") };
}

export default async function PlanPage() {
  const user = await requireUser("/plan");
  const t = await getTranslations("coach");
  const tx = await getTranslations("taxonomy");
  const row = await currentPlan(user.id);
  const plan = row.plan as unknown as WeeklyPlan;
  const today = dayInZone(new Date(), siteConfig.defaultTimeZone);
  return (
    <Container className="max-w-6xl space-y-6">
      <PageHeader
        title={t("title")}
        description={plan.daysToTest !== null ? t("subtitleDays", { days: plan.daysToTest, minutes: plan.minutesPerDay }) : t("subtitle", { minutes: plan.minutesPerDay })}
        actions={<RefreshPlanButton />}
      />
      {row.message && (
        <Card>
          <CardContent className="pt-6 text-sm">{row.message}</CardContent>
        </Card>
      )}
      {plan.focusSkills.length > 0 && (
        <p className="text-sm">
          {t("focus")}: <strong>{plan.focusSkills.map((s) => tx(`skills.${s as "INFERENCES"}`)).join(", ")}</strong>
        </p>
      )}
      {plan.daysToTest === null && (
        <p className="text-sm text-muted-foreground">
          {t("noTestDate")}{" "}
          <Link href="/settings" className="underline">
            {t("setTestDate")}
          </Link>
        </p>
      )}
      <WeekView plan={plan} today={today} />
      <p className="text-xs text-muted-foreground">{t("howItWorks")}</p>
    </Container>
  );
}
