import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { GoalForm } from "@/components/account/goal-form";
import { Mascot } from "@/components/mascot/mascot";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const t = await getTranslations("onboarding");
  return (
    <div className="mx-auto max-w-xl px-6 py-12 lg:py-16">
      <h1 className="text-h2 font-semibold">{t("title")}</h1>
      <p className="mt-3 text-lead text-muted-foreground">{t("subtitle")}</p>
      <div className="my-8 flex items-end gap-4">
        <Mascot pose="point" className="w-24 shrink-0" />
        <p className="mb-6 rounded-2xl rounded-bl-md border bg-surface px-4 py-3 text-small shadow-sm">{t("tip")}</p>
      </div>
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
