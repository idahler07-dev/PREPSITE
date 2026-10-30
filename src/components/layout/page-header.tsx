import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * App page header: title, one-line description, primary action on the right.
 * Every app page uses this so headers line up across the product.
 */
export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-2">
        {eyebrow && <p className="text-small font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>}
        <h1 className="text-h2 font-semibold sm:text-h1">{title}</h1>
        {description && <p className="max-w-[70ch] text-lead text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Page content width: 1200px max with 16/24px gutters, on the 8px grid. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:py-10", className)}>{children}</div>;
}
