"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { startDrill } from "@/server/actions/practice";
import { openTest } from "@/lib/open-test";

/** Start a drill from any page (command palette, skill map, weak skills) and open it. */
export function useStartDrill() {
  const t = useTranslations("practice");
  const tb = useTranslations("billing");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  function launch(cfg: Record<string, unknown>) {
    start(async () => {
      const res = await startDrill(cfg);
      if (res.ok) {
        toast.success(t("drillStarted"));
        openTest(res.id);
      } else if (res.error === "DAILY_LIMIT")
        toast.error(tb("limits.daily", { left: Number(res.message) || 0 }), { action: { label: tb("limits.upgrade"), onClick: () => router.push("/pricing") } });
      else toast.error(res.error === "NO_QUESTIONS" ? t("noQuestions") : c("unknownError"));
    });
  }
  return { launch, pending };
}
