"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Loader2, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { previewPrice, startCheckout } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Currency = "UZS" | "USD";
type Preview = Extract<Awaited<ReturnType<typeof previewPrice>>, { ok: true }>;

export function money(minor: number, currency: Currency, format: ReturnType<typeof useFormatter>) {
  return format.number(minor / 100, { style: "currency", currency, maximumFractionDigits: currency === "UZS" ? 0 : 2 });
}

const minus = (s: string) => `\u2212${s}`;

export function CheckoutForm({
  locale,
  plans,
  providers,
  initialPlan,
  initialCurrency,
}: {
  locale: string;
  plans: { id: string; price: Record<Currency, number> }[];
  providers: Record<Currency, string[]>;
  initialPlan: string;
  initialCurrency: Currency;
}) {
  const t = useTranslations("billing");
  const format = useFormatter();
  const [plan, setPlan] = useState(initialPlan);
  const [currency, setCurrency] = useState<Currency>(initialCurrency);
  const [provider, setProvider] = useState(providers[initialCurrency][0] ?? "");
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!providers[currency].includes(provider)) setProvider(providers[currency][0] ?? "");
  }, [currency, provider, providers]);

  useEffect(() => {
    let live = true;
    void previewPrice({ planId: plan, currency, promoCode: appliedPromo }).then((res) => {
      if (!live) return;
      if (res.ok) {
        setPreview(res);
        setError(null);
      } else {
        setPreview(null);
        setError(res.error);
        if (res.error.startsWith("PROMO_")) setAppliedPromo(null);
      }
    });
    return () => {
      live = false;
    };
  }, [plan, currency, appliedPromo]);

  const errText = (code: string) => (t.has(`checkout.errors.${code as "PROMO_INVALID"}`) ? t(`checkout.errors.${code as "PROMO_INVALID"}`) : t("checkout.errors.other"));
  const blocked = !!preview?.periodError;

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await startCheckout({ planId: plan, currency, provider, promoCode: appliedPromo, locale });
          if (res.ok) {
            setRedirecting(true);
            window.location.assign(res.redirectUrl);
          } else setError(res.error);
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium">{t("checkout.plan")}</legend>
        {plans.map((p) => (
          <label key={p.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3", plan === p.id && "border-primary bg-primary-soft")}>
            <span className="flex items-center gap-3">
              <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="size-4" />
              <span>
                <span className="font-medium">{t(`plans.${p.id as "monthly"}.name`)}</span>
                <span className="block text-sm text-muted-foreground">{t(`plans.${p.id as "monthly"}.tagline`)}</span>
              </span>
            </span>
            <span className="font-semibold tabular-nums">{money(p.price[currency], currency, format)}</span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-medium">{t("checkout.currency")}</legend>
        <div className="flex gap-2">
          {(["UZS", "USD"] as const).map((c) => (
            <label key={c} className={cn("flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm", currency === c && "border-primary bg-primary-soft")}>
              <input type="radio" name="currency" checked={currency === c} onChange={() => setCurrency(c)} className="size-4" />
              {c === "UZS" ? `so'm — ${t("pricing.uzsHint")}` : `USD — ${t("pricing.usdHint")}`}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 font-medium">{t("checkout.provider")}</legend>
        {providers[currency].length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("pricing.noProviders")}</p>
        ) : (
          <div className="space-y-2">
            {providers[currency].map((p) => (
              <label key={p} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm", provider === p && "border-primary bg-primary-soft")}>
                <input type="radio" name="provider" checked={provider === p} onChange={() => setProvider(p)} className="size-4" />
                {t(`providers.${p as "payme"}`)}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="promo">{t("checkout.promo")}</Label>
          <Input id="promo" value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} maxLength={40} autoComplete="off" className="font-mono" />
        </div>
        <Button type="button" variant="outline" disabled={!promo.trim()} onClick={() => setAppliedPromo(promo.trim())}>
          {t("checkout.apply")}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6 text-sm">
          {preview ? (
            <>
              <div className="flex justify-between">
                <span>{t("checkout.list")}</span>
                <span className="tabular-nums">{money(preview.list, currency, format)}</span>
              </div>
              {preview.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>{preview.referral ? t("checkout.referralApplied", { percent: preview.referralPercent }) : t("checkout.promoApplied")}</span>
                  <span className="tabular-nums">{minus(money(preview.discount, currency, format))}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>{t("checkout.total")}</span>
                <span className="tabular-nums">{money(preview.amount, currency, format)}</span>
              </div>
              {preview.endsAt && <p className="text-muted-foreground">{t("checkout.period", { date: format.dateTime(new Date(preview.endsAt), { dateStyle: "long" }) })}</p>}
              {preview.periodError && (
                <p role="alert" className="text-destructive">
                  {errText(preview.periodError)}{" "}
                  <Link href="/settings" className="underline">
                    {t("checkout.openSettings")}
                  </Link>
                </p>
              )}
            </>
          ) : (
            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" aria-hidden />
          )}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {errText(error)}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending || redirecting || !preview || blocked || (!provider && preview.amount > 0)}>
        {pending || redirecting ? <Loader2 className="animate-spin" aria-hidden /> : <Lock aria-hidden />}
        {redirecting ? t("checkout.redirecting") : preview && preview.amount === 0 ? t("checkout.getFree") : t("checkout.pay", { amount: preview ? money(preview.amount, currency, format) : "" })}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("checkout.secure")}</p>
    </form>
  );
}
