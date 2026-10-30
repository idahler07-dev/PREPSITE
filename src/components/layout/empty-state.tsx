import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small illustration from simple shapes: a card, a rising line and two dots, in theme colors. */
function Illustration() {
  return (
    <svg viewBox="0 0 120 88" className="h-20 w-auto" aria-hidden>
      <rect x="14" y="10" width="78" height="62" rx="12" className="fill-surface stroke-border" strokeWidth="1.5" />
      <rect x="24" y="22" width="34" height="6" rx="3" className="fill-surface-2" />
      <rect x="24" y="34" width="52" height="6" rx="3" className="fill-surface-2" />
      <path d="M26 60c10 2 18-10 28-8s14 6 24-10" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary" />
      <circle cx="96" cy="22" r="9" className="fill-accent-soft stroke-accent" strokeWidth="1.5" />
      <circle cx="104" cy="66" r="6" className="fill-primary-soft stroke-highlight" strokeWidth="1.5" />
    </svg>
  );
}

/** Never a blank screen: a small illustration, a short helpful message and one clear next action. */
export function EmptyState({ illustration, title, body, action, className }: { illustration?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("dot-grid relative overflow-hidden rounded-lg border border-dashed bg-surface px-6 py-12 text-center", className)}>
      <div className="relative mx-auto flex max-w-sm flex-col items-center gap-3">
        {illustration ?? <Illustration />}
        <h2 className="text-h3 font-semibold">{title}</h2>
        {body && <p className="text-muted-foreground">{body}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
