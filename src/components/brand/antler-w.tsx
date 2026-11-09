import { cn } from "@/lib/utils";

import { ANTLER } from "@/lib/brand/antler";

export { ANTLER, antlerPaths } from "@/lib/brand/antler";

/** The wordmark after the antler W: "illo" + "Prep" (brand name, not translated). */
const WORD = ["illo", "Prep"] as const;

/** The antler W in `currentColor`. */
export function AntlerW({ className, variant = "full", glyph = false, title }: { className?: string; variant?: "full" | "simple"; glyph?: boolean; title?: string }) {
  const [stem, tine] = glyph ? ANTLER.glyph : ANTLER.weight[variant];
  return (
    <svg
      viewBox={glyph ? "2 6 60 50" : "0 0 64 64"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={ANTLER.stem} strokeWidth={stem} />
      {ANTLER.tines[variant].map((d) => (
        <path key={d} d={d} strokeWidth={tine} />
      ))}
    </svg>
  );
}

/** App icon: the white mark on the cyan tile. */
export function AppMark({ className, simple = false }: { className?: string; simple?: boolean }) {
  return (
    <span className={cn("inline-grid aspect-square place-items-center rounded-[28%] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]", className)} style={{ background: "linear-gradient(140deg, #0A6E87 0%, #1FB3CB 100%)" }} aria-hidden>
      <AntlerW variant={simple ? "simple" : "full"} className="w-[74%]" />
    </span>
  );
}

/**
 * The wordmark: the antler W stands in for the W of "WilloPrep".
 * "Willo" in ink, "Prep" in the primary cyan. Inherits font size.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end font-display font-extrabold tracking-[-0.035em] text-foreground", className)} aria-hidden>
      <AntlerW glyph className="me-[-0.02em] h-[0.98em] w-auto translate-y-[0.02em]" />
      <span>{WORD[0]}</span>
      <span className="text-primary">{WORD[1]}</span>
    </span>
  );
}
