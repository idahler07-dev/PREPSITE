"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface PlanCardData {
  id: string;
  name: string;
  tagline: string;
  price: string;
  note?: string;
  features: string[];
  href?: string;
  cta: string;
  recommended?: boolean;
  /** "Recommended" (or "Most popular" when real data supports it). */
  badge?: string;
  disabledNote?: string;
}

/**
 * Plan cards. The recommended plan gets a cobalt → coral gradient border and
 * a pill. Each card has a layoutId so it can morph into the checkout summary.
 */
export function PlanCards({ plans, compact = false }: { plans: PlanCardData[]; compact?: boolean }) {
  return (
    <Reveal className="grid items-stretch gap-4 md:grid-cols-3">
      {plans.map((p) => (
        <RevealItem key={p.id} className="flex">
          <motion.article
            layoutId={`plan-card-${p.id}`}
            transition={spring.soft}
            className={cn(
              "relative flex w-full flex-col rounded-lg p-6 shadow-sm transition-shadow hover:shadow-lg",
              p.recommended ? "border-gradient shadow-md" : "border bg-surface",
            )}
          >
            {p.badge && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">{p.badge}</span>
            )}
            <h3 className="text-h3 font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
            <p className="mt-5 font-mono text-[2rem] leading-none font-semibold tracking-tight tabular-nums" data-numeric>
              {p.price}
            </p>
            {p.note && <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>}
            {!compact && (
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-correct-ink" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            )}
            <div className={cn("pt-6", compact && "mt-auto")}>
              {p.href ? (
                <Button asChild className="w-full" variant={p.recommended ? "accent" : "secondary"}>
                  <Link href={p.href}>{p.cta}</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">{p.disabledNote}</p>
              )}
            </div>
          </motion.article>
        </RevealItem>
      ))}
    </Reveal>
  );
}

/** Checkout summary: same layoutId as the chosen plan card, so the card morphs into it. */
export function PlanSummary({ id, name, price, children }: { id: string; name: string; price: string; children?: React.ReactNode }) {
  return (
    <motion.div layoutId={`plan-card-${id}`} transition={spring.soft} className="border-gradient mb-6 rounded-lg p-5 shadow-md">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-h3 font-semibold">{name}</p>
        <p className="font-mono text-xl font-semibold tabular-nums" data-numeric>
          {price}
        </p>
      </div>
      {children}
    </motion.div>
  );
}
