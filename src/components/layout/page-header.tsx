import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spot, type SpotName } from "@/components/illustrations/spot";

/**
 * App page header: title, one-line description, primary action on the right.
 * Every app page uses this so headers line up across the product.
 */
/**
 * Page title in the landing page's style: a small gold label, a large tight
 * heading, one short line and the page's actions. With `art`, it sits on a cream
 * panel with the page's illustration on the right (hidden on narrow screens).
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
  const text = (
    <div className="min-w-0 space-y-3">
      {eyebrow && (
        <p className="text-[12px] font-bold tracking-[0.14em] text-[#A9730E] uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-[42px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-[52ch] text-[16px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actions && (
        <div className="flex flex-wrap items-center gap-2 pt-2">{actions}</div>
      )}
    </div>
  );
  if (art)
    return (
      <header className="group relative mb-10 grid items-center gap-6 overflow-hidden rounded-[24px] border border-border bg-surface-2 px-7 py-8 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        {text}
        <div className="relative hidden sm:block" aria-hidden>
          <Spot name={art} className="relative" />
        </div>
      </header>
    );
  return (
    <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
      {text}
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
