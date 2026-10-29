"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGoal, skipOnboarding, type FormState } from "@/server/actions/profile";

export function GoalForm({
  defaults,
  mode,
}: {
  defaults: { testDate: string; targetScore: string; currentScore: string };
  mode: "onboarding" | "settings";
}) {
  const t = useTranslations("onboarding");
  const s = useTranslations("settings");
  const c = useTranslations("common");
  const router = useRouter();
  const [state, action, pending] = useActionState<FormState, FormData>(saveGoal, {});

  useEffect(() => {
    if (!state.ok) return;
    if (mode === "onboarding") router.push("/practice");
    else toast.success(s("saved"));
  }, [state, mode, router, s]);

  const err = (f: string) => state.errors?.[f];
  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="testDate">{t("testDate")}</Label>
        <Input id="testDate" name="testDate" type="date" defaultValue={defaults.testDate} aria-describedby="testDate-help" aria-invalid={!!err("testDate")} className="w-full sm:w-56" />
        <p id="testDate-help" className="text-sm text-muted-foreground">
          {err("testDate") ? <span className="text-destructive">{t("errors.date")}</span> : t("testDateHelp")}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetScore">{t("targetScore")}</Label>
          <Input id="targetScore" name="targetScore" type="number" inputMode="numeric" min={400} max={1600} step={10} defaultValue={defaults.targetScore} aria-describedby="targetScore-help" aria-invalid={!!err("targetScore")} />
          <p id="targetScore-help" className="text-sm text-muted-foreground">
            {err("targetScore") ? <span className="text-destructive">{t("errors.score")}</span> : t("targetScoreHelp")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentScore">{t("currentScore")}</Label>
          <Input id="currentScore" name="currentScore" type="number" inputMode="numeric" min={400} max={1600} step={10} defaultValue={defaults.currentScore} aria-describedby="currentScore-help" aria-invalid={!!err("currentScore")} />
          <p id="currentScore-help" className="text-sm text-muted-foreground">
            {err("currentScore") ? <span className="text-destructive">{t("errors.score")}</span> : t("currentScoreHelp")}
          </p>
        </div>
      </div>
      {mode === "onboarding" && <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">{t("diagnosticHint")}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {mode === "onboarding" ? t("save") : c("save")}
        </Button>
        {mode === "onboarding" && (
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await skipOnboarding();
              router.push("/dashboard");
            }}
          >
            {t("skip")}
          </Button>
        )}
      </div>
    </form>
  );
}
