import { cn } from "@/lib/utils";

import { useId } from "react";
import { ANTLER, LEAF, LEAF_DOT } from "@/lib/brand/antler";

export { ANTLER, LEAF, antlerPaths, leafSvg } from "@/lib/brand/antler";

/** The wordmark after the antler W: "illo" + "Prep" (brand name, not translated). */
const WORD = ["ı", "llo", "Prep"] as const;

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

/** The willow leaf (gold enamel). Purely decorative. */
export function WillowLeaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const id = `leaf-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 100 42" overflow="visible" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={LEAF.fillFrom} />
          <stop offset="1" stopColor={LEAF.fillTo} />
        </linearGradient>
      </defs>
      <path d={LEAF.outline} fill={`url(#${id})`} stroke={LEAF.rim} strokeWidth={3.4} strokeLinejoin="round" />
      <path d={LEAF.vein} fill="none" stroke={LEAF.rim} strokeWidth={3.6} strokeLinecap="round" />
    </svg>
  );
}

/**
 * The wordmark: the antler W (in the mascot's antler brown) stands in for the
 * W of "WilloPrep", and a willow leaf dots the i. Inherits font size.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end font-display font-extrabold tracking-[-0.035em] text-foreground", className)} aria-hidden>
      <AntlerW glyph className="me-[0.05em] h-[0.98em] w-auto translate-y-[0.02em] text-[var(--antler)]" />
      <span className="relative inline-block">
        {WORD[0]}
        <WillowLeaf
          className="absolute"
          style={{ left: `${LEAF_DOT.left}em`, top: `${LEAF_DOT.top}em`, width: `${LEAF_DOT.width}em`, height: `${LEAF_DOT.height}em`, transform: `rotate(${LEAF_DOT.rotate}deg)` }}
        />
      </span>
      <span>{WORD[1]}</span>
      <span className="text-primary">{WORD[2]}</span>
    </span>
  );
}
