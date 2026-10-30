import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Landing section: one idea. Pill label with a colored icon, big headline on
 * the left, a short paragraph on the right (below on mobile), one CTA, then
 * the mockup with plenty of space. `tint` alternates the background.
 */
export function Section({ id, tint = false, className, children }: { id?: string; tint?: boolean; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("section scroll-mt-20", tint ? "bg-section-tint" : "bg-background", className)}>
      <div className="section-inner">{children}</div>
    </section>
  );
}

export function SectionPill({ icon, children, tone = "primary" }: { icon: ReactNode; children: ReactNode; tone?: "primary" | "accent" | "correct" | "highlight" }) {
  const tones = {
    primary: "text-primary",
    accent: "text-accent-ink",
    correct: "text-correct-ink",
    highlight: "text-primary",
  };
  return (
    <p className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1.5 text-small font-semibold shadow-sm">
      <span className={cn("[&_svg]:size-4", tones[tone])} aria-hidden>
        {icon}
      </span>
      {children}
    </p>
  );
}

export function SectionHead({ pill, title, body, cta, align = "split" }: { pill: ReactNode; title: ReactNode; body: ReactNode; cta?: ReactNode; align?: "split" | "center" }) {
  if (align === "center")
    return (
      <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center gap-5 text-center lg:mb-20">
        {pill}
        <h2 className="text-h1 font-semibold lg:text-section">{title}</h2>
        <p className="max-w-[60ch] text-lead text-muted-foreground">{body}</p>
        {cta}
      </div>
    );
  return (
    <div className="mb-14 grid gap-6 lg:mb-20 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-16">
      <div className="space-y-5">
        {pill}
        <h2 className="text-h1 font-semibold lg:text-section">{title}</h2>
      </div>
      <div className="space-y-6">
        <p className="max-w-[60ch] text-lead text-muted-foreground">{body}</p>
        {cta}
      </div>
    </div>
  );
}
