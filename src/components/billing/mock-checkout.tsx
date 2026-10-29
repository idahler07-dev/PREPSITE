"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { mockCheckoutDecision } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";

export function MockCheckoutButtons({ orderId, disabled }: { orderId: string; disabled: boolean }) {
  const t = useTranslations("billing.mock");
  const router = useRouter();
  const [pending, start] = useTransition();
  const decide = (outcome: "paid" | "failed") =>
    start(async () => {
      const res = await mockCheckoutDecision(orderId, outcome);
      if (res.ok) router.push(res.returnPath);
    });
  return (
    <div className="flex gap-2">
      <Button onClick={() => decide("paid")} disabled={pending || disabled}>
        {t("pay")}
      </Button>
      <Button variant="outline" onClick={() => decide("failed")} disabled={pending || disabled}>
        {t("decline")}
      </Button>
    </div>
  );
}
