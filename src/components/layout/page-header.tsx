import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spot, type SpotName } from "@/components/illustrations/spot";

/**
 * App page header: title, one-line description, primary action on the right.
 * Every app page uses this so headers line up across the product.
 */
const ART_TINT: Record<SpotName, string> = {
  bank: "--tint-aqua",
  mocks: "--tint-peach",
  review: "--tint-sky",
  vocab: "--tint-mint",
  plan: "--tint-peach",
  progress: "--tint-aqua",
  target: "--tint-peach",
  focus: "--tint-sky",
};

/**
 * Page title, one line of description and actions. With `art`, it becomes a tinted
 * banner with a spot illustration on the right (the illustration hides on narrow
 * screens).
 */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  art,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  art?: SpotName;
}) {
  if (art)
    return (
      <header
        className="group relative mb-8 grid items-center gap-4 overflow-hidden rounded-[24px] px-6 py-6 sm:grid-cols-[minmax(0,1fr)_200px] sm:px-8 sm:py-7"
        style={{ background: `var(${ART_TINT[art]})` }}
      >
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="text-small font-semibold tracking-wide text-primary uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-h2 font-extrabold lg:text-h1">{title}</h1>
          {description && (
            <p className="max-w-[60ch] text-lead text-muted-foreground">
              {description}
            </p>
          )}
          {actions && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {actions}
            </div>
          )}
        </div>
        <div className="relative hidden sm:block" aria-hidden>
          <div className="absolute inset-x-6 top-1/2 aspect-square -translate-y-1/2 rounded-full bg-surface/55" />
          <Spot name={art} className="relative" />
        </div>
      </header>
    );
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p className="text-small font-semibold tracking-wide text-primary uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-h2 font-extrabold lg:text-h1">{title}</h1>
        {description && (
          <p className="max-w-[70ch] text-lead text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** Page content width: 1200px max with 24px (mobile) / 48px (desktop) side padding. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-6 py-8 lg:px-12 lg:py-12",
        className,
      )}
    >
      {children}
    </div>
  );
}
