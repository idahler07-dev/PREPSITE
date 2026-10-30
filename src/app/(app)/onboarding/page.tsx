import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { GoalForm } from "@/components/account/goal-form";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const t = await getTranslations("onboarding");
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 mb-8 text-muted-foreground">{t("subtitle")}</p>
      <GoalForm
        mode="onboarding"
        defaults={{
          testDate: user.testDate?.toISOString().slice(0, 10) ?? "",
          targetScore: user.targetScore?.toString() ?? "",
          currentScore: user.currentScore?.toString() ?? "",
        }}
      />
    </div>
  );
}
