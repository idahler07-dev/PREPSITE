"use client";

import "katex/dist/katex.min.css"; // math styles only where math is shown
import { useMemo, type ReactNode } from "react";
import katex from "katex";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { MobileSheet } from "@/components/ui/mobile-sheet";
import { fade, spring } from "@/lib/motion";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * Our own math reference sheet: simple line diagrams drawn for this site and
 * the standard formulas. A side panel on desktop, a bottom sheet on phones.
 */

/* Diagram labels (math variables, not prose). */
const L = { r: "r", l: "ℓ", w: "w", h: "h", b: "b", a: "a", c: "c", x: "x", x2: "2x", x3: "x√3", xr2: "x√2", d30: "30°", d60: "60°", d45: "45°" };

const SHAPE = "fill-primary-soft stroke-foreground/70";
const EDGE = "stroke-foreground/70";
const ACCENT = "stroke-primary";

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" className="fill-foreground font-serif text-[10px] italic">
      {children}
    </text>
  );
}
const RightAngle = ({ x, y, dx = 1, dy = -1 }: { x: number; y: number; dx?: 1 | -1; dy?: 1 | -1 }) => (
  <path d={`M${x + 7 * dx} ${y}V${y + 7 * dy}H${x}`} fill="none" className={EDGE} strokeWidth={1} />
);

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 110 80" className="h-20 w-[6.5rem] shrink-0" aria-hidden fill="none" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round">
      {children}
    </svg>
  );
}

const DIAGRAMS: Record<string, ReactNode> = {
  circle: (
    <Svg>
      <circle cx={46} cy={40} r={28} className={SHAPE} />
      <path d="M46 40H74" className={ACCENT} />
      <circle cx={46} cy={40} r={1.8} className="fill-primary stroke-none" />
      <Label x={60} y={35}>
        {L.r}
      </Label>
    </Svg>
  ),
  rectangle: (
    <Svg>
      <rect x={10} y={14} width={78} height={48} rx={1} className={SHAPE} />
      <Label x={49} y={75}>
        {L.l}
      </Label>
      <Label x={97} y={42}>
        {L.w}
      </Label>
    </Svg>
  ),
  triangle: (
    <Svg>
      <path d="M8 64H92L36 14Z" className={SHAPE} />
      <path d="M36 14V64" className={ACCENT} strokeDasharray="3 3" />
      <RightAngle x={36} y={64} />
      <Label x={42} y={44}>
        {L.h}
      </Label>
      <Label x={50} y={76}>
        {L.b}
      </Label>
    </Svg>
  ),
  pythagorean: (
    <Svg>
      <path d="M16 64H88L16 14Z" className={SHAPE} />
      <RightAngle x={16} y={64} />
      <Label x={8} y={42}>
        {L.a}
      </Label>
      <Label x={52} y={76}>
        {L.b}
      </Label>
      <Label x={58} y={34}>
        {L.c}
      </Label>
    </Svg>
  ),
  special30: (
    <Svg>
      <path d="M16 64H92L16 20Z" className={SHAPE} />
      <RightAngle x={16} y={64} />
      <Label x={7} y={45}>
        {L.x}
      </Label>
      <Label x={54} y={76}>
        {L.x3}
      </Label>
      <Label x={60} y={36}>
        {L.x2}
      </Label>
      <text x={74} y={60} className="fill-muted-foreground text-[8px]">
        {L.d30}
      </text>
      <text x={20} y={34} className="fill-muted-foreground text-[8px]">
        {L.d60}
      </text>
    </Svg>
  ),
  special45: (
    <Svg>
      <path d="M22 64H72L22 14Z" className={SHAPE} />
      <RightAngle x={22} y={64} />
      <Label x={12} y={42}>
        {L.x}
      </Label>
      <Label x={47} y={76}>
        {L.x}
      </Label>
      <Label x={58} y={34}>
        {L.xr2}
      </Label>
      <text x={55} y={60} className="fill-muted-foreground text-[8px]">
        {L.d45}
      </text>
      <text x={25} y={30} className="fill-muted-foreground text-[8px]">
        {L.d45}
      </text>
    </Svg>
  ),
  box: (
    <Svg>
      <path d="M10 28H66V66H10Z" className={SHAPE} />
      <path d="M10 28L28 14H84L66 28M84 14V52L66 66" className={EDGE} />
      <path d="M10 66L28 52H84M28 52V14" className={EDGE} strokeDasharray="2.5 2.5" strokeWidth={1} />
      <Label x={38} y={77}>
        {L.l}
      </Label>
      <Label x={82} y={66}>
        {L.w}
      </Label>
      <Label x={4} y={50}>
        {L.h}
      </Label>
    </Svg>
  ),
  cylinder: (
    <Svg>
      <path d="M22 18V60A26 7 0 0 0 74 60V18" className={SHAPE} />
      <ellipse cx={48} cy={18} rx={26} ry={7} className={SHAPE} />
      <path d="M22 60A26 7 0 0 1 74 60" className={EDGE} strokeDasharray="2.5 2.5" strokeWidth={1} />
      <path d="M48 18H74" className={ACCENT} />
      <Label x={61} y={14}>
        {L.r}
      </Label>
      <Label x={84} y={42}>
        {L.h}
      </Label>
    </Svg>
  ),
  sphere: (
    <Svg>
      <circle cx={48} cy={40} r={28} className={SHAPE} />
      <path d="M20 40A28 7 0 0 0 76 40" className={EDGE} strokeWidth={1} />
      <path d="M20 40A28 7 0 0 1 76 40" className={EDGE} strokeDasharray="2.5 2.5" strokeWidth={1} />
      <path d="M48 40H76" className={ACCENT} />
      <Label x={62} y={35}>
        {L.r}
      </Label>
    </Svg>
  ),
  cone: (
    <Svg>
      <path d="M48 10L20 62A28 7 0 0 0 76 62Z" className={SHAPE} />
      <path d="M20 62A28 7 0 0 1 76 62" className={EDGE} strokeDasharray="2.5 2.5" strokeWidth={1} />
      <path d="M48 10V62" className={ACCENT} strokeDasharray="3 3" />
      <path d="M48 62H76" className={ACCENT} />
      <Label x={53} y={40}>
        {L.h}
      </Label>
      <Label x={62} y={76}>
        {L.r}
      </Label>
    </Svg>
  ),
  pyramid: (
    <Svg>
      <path d="M14 64H70L50 10Z M70 64L88 50L50 10" className={SHAPE} />
      <path d="M14 64L32 50H88M32 50L50 10" className={EDGE} strokeDasharray="2.5 2.5" strokeWidth={1} />
      <path d="M50 10V57" className={ACCENT} strokeDasharray="3 3" />
      <Label x={42} y={76}>
        {L.l}
      </Label>
      <Label x={86} y={64}>
        {L.w}
      </Label>
      <Label x={55} y={38}>
        {L.h}
      </Label>
    </Svg>
  ),
};

/** Cards in reading order: each has a diagram, a name and one or more formulas. */
const GROUPS: { key: "area" | "rightTriangles" | "volume"; cards: { key: string; diagram: string; tex: string[] }[] }[] = [
  {
    key: "area",
    cards: [
      { key: "circle", diagram: "circle", tex: ["A = \\pi r^2", "C = 2\\pi r"] },
      { key: "rectangle", diagram: "rectangle", tex: ["A = \\ell w"] },
      { key: "triangle", diagram: "triangle", tex: ["A = \\tfrac{1}{2} b h"] },
    ],
  },
  {
    key: "rightTriangles",
    cards: [
      { key: "pythagorean", diagram: "pythagorean", tex: ["c^2 = a^2 + b^2"] },
      { key: "special30", diagram: "special30", tex: ["x,\\ x\\sqrt{3},\\ 2x"] },
      { key: "special45", diagram: "special45", tex: ["x,\\ x,\\ x\\sqrt{2}"] },
    ],
  },
  {
    key: "volume",
    cards: [
      { key: "box", diagram: "box", tex: ["V = \\ell w h"] },
      { key: "cylinder", diagram: "cylinder", tex: ["V = \\pi r^2 h"] },
      { key: "sphere", diagram: "sphere", tex: ["V = \\tfrac{4}{3}\\pi r^3"] },
      { key: "cone", diagram: "cone", tex: ["V = \\tfrac{1}{3}\\pi r^2 h"] },
      { key: "pyramid", diagram: "pyramid", tex: ["V = \\tfrac{1}{3}\\ell w h"] },
    ],
  },
];

function Content() {
  const t = useTranslations("test.reference");
  const rendered = useMemo(
    () => new Map(GROUPS.flatMap((g) => g.cards).flatMap((c) => c.tex.map((tex) => [tex, katex.renderToString(tex, { throwOnError: false, trust: false })] as const))),
    [],
  );
  return (
    <div className="space-y-6">
      <p className="text-small text-muted-foreground">{t("intro")}</p>
      {GROUPS.map((g) => (
        <section key={g.key} aria-labelledby={`ref-${g.key}`} className="space-y-3">
          <h3 id={`ref-${g.key}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t(`groups.${g.key}`)}
          </h3>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {g.cards.map((c) => (
              <li key={c.key} className="flex min-w-0 items-center gap-3 rounded-2xl border bg-surface p-3">
                {DIAGRAMS[c.diagram]}
                <div className="min-w-0 space-y-1">
                  <p className="text-small font-medium">{t(`items.${c.key as "circle"}`)}</p>
                  {c.tex.map((tex) => (
                    // KaTeX output of our own fixed formulas (trust: false).
                    <p key={tex} className="overflow-x-auto text-base" dangerouslySetInnerHTML={{ __html: rendered.get(tex)! }} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ul className="space-y-1 rounded-2xl bg-surface-2 p-4 text-small">
        <li>{t("facts.circleDegrees")}</li>
        <li>{t("facts.circleRadians")}</li>
        <li>{t("facts.triangleAngles")}</li>
      </ul>
    </div>
  );
}

export function ReferenceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("test.reference");
  const tc = useTranslations("common");
  const desktop = useMediaQuery("(min-width: 768px)");
  const reduce = useReducedMotion();

  if (!desktop) {
    return (
      <MobileSheet open={open} onOpenChange={onOpenChange} title={t("title")}>
        <div className="px-1 pb-2">
          <Content />
        </div>
      </MobileSheet>
    );
  }

  // Desktop: a side panel from the right over a blurred backdrop (Esc or a click outside closes it).
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-50 bg-overlay backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                className="fixed inset-y-0 end-0 z-50 flex w-[min(40rem,92vw)] flex-col border-s bg-background shadow-xl outline-none"
                initial={reduce ? { opacity: 0 } : { x: "100%" }}
                animate={reduce ? { opacity: 1 } : { x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: "100%" }}
                transition={reduce ? fade : spring.soft}
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
                  <DialogPrimitive.Title className="font-semibold">{t("title")}</DialogPrimitive.Title>
                  <DialogPrimitive.Close className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none">
                    <X className="size-5" aria-hidden />
                    <span className="sr-only">{tc("close")}</span>
                  </DialogPrimitive.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <Content />
                </div>
              </m.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
