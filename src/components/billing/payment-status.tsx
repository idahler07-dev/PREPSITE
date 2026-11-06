"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Polls the order until the provider confirms (or fails) the payment. */
export function PaymentStatus({ orderId }: { orderId: string }) {
  const t = useTranslations("billing.return");
  const [status, setStatus] = useState<string>("PENDING");
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      try {
        const res = await fetch(`/api/payments/orders/${orderId}`, { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as { status: string };
          if (stop) return;
          setStatus(body.status);
          if (!["CREATED", "PENDING"].includes(body.status)) return;
        }
      } catch {}
      if (Date.now() - started > 60_000) setSlow(true);
      if (!stop) setTimeout(tick, Date.now() - started > 60_000 ? 10_000 : 2_000);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [orderId]);

  if (status === "PAID")
    return (
      <div role="status" className="space-y-4 rounded-lg border border-success bg-success-muted p-6">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="size-6 text-success" aria-hidden /> {t("paid")}
        </p>
        <Button asChild>
          <Link href="/dashboard">{t("toDashboard")}</Link>
        </Button>
      </div>
    );
  if (status === "FAILED" || status === "CANCELED" || status === "REFUNDED")
    return (
      <div role="status" className="space-y-4 rounded-lg border border-destructive bg-danger-muted p-6">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <XCircle className="size-6 text-destructive" aria-hidden /> {status === "FAILED" ? t("failed") : t("canceled")}
        </p>
        <Button asChild>
          <Link href="/pricing">{t("tryAgain")}</Link>
        </Button>
      </div>
    );
  return (
    <div role="status" aria-live="polite" className="space-y-3 rounded-lg border p-6">
      <p className="flex items-center gap-2">
        <Loader2 className="size-5 animate-spin" aria-hidden /> {t("waiting")}
      </p>
      {slow && <p className="text-sm text-muted-foreground">{t("slow")}</p>}
    </div>
  );
}
