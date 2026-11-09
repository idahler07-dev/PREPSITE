"use client";

import { useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { LiquidGroup } from "@/components/motion/liquid-group";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { freeLimits, paidPlans, type Currency } from "@/config/plans";
import { cn } from "@/lib/utils";

function money(n: number, c: Currency, digits = 0): string {
  const num = n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return c === "USD" ? `$${num}` : `UZS ${num}`;
}

/**
 * Pricing: four plans, a liquid UZS/USD toggle, swipeable on phones. Prices
 * come from src/config/plans.ts. Buttons go to checkout (through sign-in).
 */
export function Pricing({ signedIn, startHref, canPay, planNames }: { signedIn: boolean; startHref: string; canPay: Record<Currency, boolean>; planNames: Record<string, string> }) {
  const t = useTranslations("landing.pricing");
  const [cur, setCur] = useState<Currency>("UZS");
  const reduce = useReducedMotion();

  const cards = [
    { id: "free", name: t("free"), price: cur === "USD" ? "$0" : `UZS ${t("freePrice")}`, note: t("freeNote", { count: freeLimits.questionsPerDay ?? 0 }), href: startHref, cta: t("start"), featured: false },
    ...paidPlans.map((p) => {
      const amount = p.price[cur];
      const checkout = `/checkout?plan=${p.id}&currency=${cur}`;
      const note = p.periodDays
        ? p.featured
          ? t("perDay", { amount: money(amount / p.periodDays, cur, cur === "USD" ? 2 : 0) })
          : t("monthlyNote")
        : t("testdayNote");
      return {
        id: p.id,
        name: planNames[p.id] ?? p.id,
        price: money(amount, cur, cur === "USD" && !Number.isInteger(amount) ? 2 : 0),
        note,
        href: canPay[cur] ? (signedIn ? checkout : `/login?next=${encodeURIComponent(checkout)}`) : undefined,
        cta: canPay[cur] ? t("choose") : t("soon"),
        featured: !!p.featured,
      };
    }),
  ];

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16 border-y border-border bg-section-tint py-20 lg:py-28">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6">
        <h2 id="pricing-title" className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          {t("title")}
        </h2>
        <LiquidGroup activeKey={cur} role="radiogroup" aria-label={`${t("uzs")} / ${t("usd")}`} className="mx-auto mt-8 flex w-fit rounded-full border border-border bg-surface p-1 shadow-sm" indicatorClassName="rounded-full bg-primary shadow-[0_3px_0_var(--primary-edge)]">
            {(["UZS", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                data-liquid-key={c}
                aria-checked={cur === c}
                onClick={() => setCur(c)}
                className={cn("relative rounded-full px-5 py-1.5 font-display text-sm font-extrabold transition-colors", cur === c ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <span className="relative">{c === "UZS" ? t("uzs") : t("usd")}</span>
              </button>
            ))}
          </LiquidGroup>

        <ul className="swipe-row -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 pt-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
          {cards.map((c, i) => (
            <m.li
              key={c.id}
              className={cn(
                "relative flex w-[78%] shrink-0 flex-col rounded-3xl bg-surface p-5 sm:w-[46%] md:w-auto",
                c.featured ? "border-2 border-primary shadow-[0_20px_40px_-24px_color-mix(in_oklab,var(--primary),transparent_40%)]" : "border border-border shadow-sm",
              )}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ type: "spring", stiffness: 400, damping: 30, delay: i * 0.05 }}
            >
              {c.featured && (
                <span className="absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-0.5 font-display text-[11px] font-extrabold tracking-wide text-primary-foreground uppercase">{t("best")}</span>
              )}
              <h3 className="font-display text-base font-bold">{c.name}</h3>
              <p className="mt-2 h-9 overflow-hidden font-display text-[1.65rem] leading-9 font-extrabold tracking-tight">
                <AnimatePresence mode="popLayout" initial={false}>
                  <m.span
                    key={c.price}
                    className="block"
                    initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={reduce ? { opacity: 0 } : { y: -24, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {c.price}
                  </m.span>
                </AnimatePresence>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
              <div className="mt-6 flex-1" />
              {c.href ? (
                <Button asChild variant={c.featured ? "default" : "outline"} className="w-full">
                  <Link href={c.href}>{c.cta}</Link>
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  {c.cta}
                </Button>
              )}
            </m.li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted-foreground">{t("pay")}</p>
      </div>
    </section>
  );
}
