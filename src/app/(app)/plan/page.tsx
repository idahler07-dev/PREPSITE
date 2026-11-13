import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { requireUser } from "@/server/auth/session";
import { currentPlan } from "@/server/coach/service";
import { dayInZone } from "@/lib/stats/streak";
import type { WeeklyPlan } from "@/lib/coach/plan";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { TodayCard, WeekStrip } from "@/components/learning/plan-view";
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
  const todayTasks = plan.days.find((d) => d.date === today)?.tasks ?? [];
  return (
    <Container className="max-w-5xl space-y-12">
      <PageHeader
        art="plan"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={
          plan.daysToTest !== null
            ? t("subtitleDays", {
                days: plan.daysToTest,
                minutes: plan.minutesPerDay,
              })
            : t("subtitle", { minutes: plan.minutesPerDay })
        }
        actions={
          <>
            <RefreshPlanButton />
            {plan.daysToTest === null && (
              <Link
                href="/settings"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("setTestDate")}
              </Link>
            )}
          </>
        }
      />
      {plan.focusSkills.length > 0 && (
        <div className="-mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase">
            {t("focusShort")}
          </span>
          {plan.focusSkills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] font-semibold"
            >
              {tx(`skills.${s as "INFERENCES"}`)}
            </span>
          ))}
        </div>
      )}
      {row.message && (
        <p className="rounded-[20px] border border-border bg-surface-2 p-5 text-[15px] leading-relaxed">
          {row.message}
        </p>
      )}
      <TodayCard tasks={todayTasks} />
      <WeekStrip plan={plan} today={today} />
    </Container>
  );
}
