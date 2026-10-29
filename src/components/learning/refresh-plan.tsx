"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { refreshStudyPlan } from "@/server/actions/learning";
import { Button } from "@/components/ui/button";

export function RefreshPlanButton() {
  const t = useTranslations("coach");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await refreshStudyPlan();
          if (!res.ok) toast.error(res.error === "RATE_LIMITED" ? t("tooOften") : t("error"));
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />} {t("refresh")}
    </Button>
  );
}
