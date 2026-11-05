import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/** A star between phrases. */
function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0", className)} aria-hidden>
      <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="currentColor" />
    </svg>
  );
}

function Band({ items, reverse, className, starClass, seconds }: { items: string[]; reverse?: boolean; className: string; starClass: string; seconds: number }) {
  const row = (hidden: boolean) => (
    <ul className="ribbon__track" aria-hidden={hidden || undefined} style={{ animationDuration: `${seconds}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {items.map((s) => (
        <li key={s} className="flex shrink-0 items-center gap-6 font-display text-2xl font-extrabold tracking-tight whitespace-nowrap uppercase sm:text-3xl">
          {s}
          <Star className={starClass} />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("ribbon flex w-[120%] -translate-x-[8%] py-4 shadow-[0_10px_30px_-12px_rgb(15_23_42/0.35)]", className)}>
      {row(false)}
      {row(true)}
    </div>
  );
}

/** Two endless ribbons crossing like tape across the page. Decorative, pauses with reduced motion. */
export async function Ribbons() {
  const t = await getTranslations("landing.ribbon");
  return (
    <section aria-hidden className="relative h-[220px] overflow-hidden sm:h-[260px]">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 rotate-[4deg]">
        <Band items={t.raw("b") as string[]} reverse seconds={50} className="bg-[#0F172A] text-white dark:bg-surface-2" starClass="text-accent" />
      </div>
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-[3deg]">
        <Band items={t.raw("a") as string[]} seconds={40} className="bg-primary text-primary-foreground" starClass="text-accent" />
      </div>
    </section>
  );
}
