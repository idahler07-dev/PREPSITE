"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createPromo, grantPremium, markOrderRefundedManually, refundOrder, setPromoActive } from "@/server/actions/admin/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CURRENCIES = ["UZS", "USD"] as const;

export function OrderActions({ orderId, provider, refundRequested }: { orderId: string; provider: string; refundRequested: boolean }) {
  const t = useTranslations("admin.orders");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" disabled={pending}>
            {t("refund")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("refundTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{provider === "payme" ? t("refundPayme") : t("refundBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                start(async () => {
                  const res = await refundOrder(orderId);
                  if (!res.ok) toast.error(t("refundFailed"));
                  else toast.success(res.data === "refunded" ? t("refunded") : res.data === "pending" ? t("refundPending") : t("refundManual"));
                  router.refresh();
                })
              }
            >
              {t("refund")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {refundRequested && (
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await markOrderRefundedManually(orderId);
              if (!res.ok) toast.error(t("refundFailed"));
              router.refresh();
            })
          }
        >
          {t("markRefunded")}
        </Button>
      )}
    </span>
  );
}

export function GrantPremiumForm() {
  const t = useTranslations("admin.orders");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await grantPremium({ email, days, note });
          if (res.ok) {
            toast.success(t("granted"));
            setEmail("");
            setNote("");
            router.refresh();
          } else toast.error(res.error === "USER_NOT_FOUND" ? t("userNotFound") : t("grantFailed"));
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="g-email">{t("email")}</Label>
        <Input id="g-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-64" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-days">{t("days")}</Label>
        <Input id="g-days" type="number" min={1} max={400} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} className="w-24" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="g-note">{t("note")}</Label>
        <Input id="g-note" value={note} onChange={(e) => setNote(e.target.value)} required maxLength={200} className="w-64" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} {t("grant")}
      </Button>
    </form>
  );
}

export function NewPromoForm() {
  const t = useTranslations("admin.promos");
  const tb = useTranslations("billing");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [form, setForm] = useState({ code: "", percentOff: "10", amountUZS: "", amountUSD: "", maxRedemptions: "", validUntil: "", note: "" });
  const [plans, setPlans] = useState<string[]>([]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createPromo({
            code: form.code,
            kind,
            percentOff: kind === "percent" ? form.percentOff : undefined,
            amountUZS: kind === "amount" && form.amountUZS ? form.amountUZS : undefined,
            amountUSD: kind === "amount" && form.amountUSD ? form.amountUSD : undefined,
            planIds: plans,
            maxRedemptions: form.maxRedemptions || null,
            validUntil: form.validUntil || null,
            note: form.note,
          });
          if (res.ok) {
            toast.success(t("created"));
            setForm({ code: "", percentOff: "10", amountUZS: "", amountUSD: "", maxRedemptions: "", validUntil: "", note: "" });
            router.refresh();
          } else toast.error(res.error === "CODE_TAKEN" ? t("codeTaken") : t("invalid"));
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="p-code">{t("code")}</Label>
        <Input id="p-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required className="font-mono" maxLength={40} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("discount")}</legend>
        <div className="flex gap-3 text-sm">
          {(["percent", "amount"] as const).map((k) => (
            <label key={k} className="flex items-center gap-1">
              <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} className="size-4" /> {t(`kinds.${k}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {kind === "percent" ? (
        <div className="space-y-2">
          <Label htmlFor="p-pct">{t("percent")}</Label>
          <Input id="p-pct" type="number" min={1} max={100} value={form.percentOff} onChange={set("percentOff")} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="p-uzs">{CURRENCIES[0]}</Label>
            <Input id="p-uzs" type="number" min={0} value={form.amountUZS} onChange={set("amountUZS")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-usd">{CURRENCIES[1]}</Label>
            <Input id="p-usd" type="number" min={0} step="0.01" value={form.amountUSD} onChange={set("amountUSD")} />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="p-max">{t("maxRedemptions")}</Label>
        <Input id="p-max" type="number" min={1} value={form.maxRedemptions} onChange={set("maxRedemptions")} placeholder="∞" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-until">{t("validUntil")}</Label>
        <Input id="p-until" type="date" value={form.validUntil} onChange={set("validUntil")} />
      </div>
      <fieldset className="space-y-2 sm:col-span-2">
        <legend className="text-sm font-medium">{t("plans")}</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {(["monthly", "quarter", "testday"] as const).map((p) => (
            <label key={p} className="flex items-center gap-1">
              <input type="checkbox" className="size-4" checked={plans.includes(p)} onChange={(e) => setPlans((x) => (e.target.checked ? [...x, p] : x.filter((y) => y !== p)))} />
              {tb(`plans.${p}.name`)}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("plansHelp")}</p>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="p-note">{t("note")}</Label>
        <Input id="p-note" value={form.note} onChange={set("note")} maxLength={200} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending || !form.code.trim()}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} {t("create")}
        </Button>
      </div>
    </form>
  );
}

export function PromoToggle({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("admin.promos");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setPromoActive(id, !active);
          router.refresh();
        })
      }
    >
      {active ? t("deactivate") : t("activate")}
    </Button>
  );
}
