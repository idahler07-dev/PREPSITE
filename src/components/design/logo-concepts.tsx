/* eslint-disable react/jsx-no-literals -- designer-facing showcase, not user copy */
import { BrandMark, BrandMarkGloss } from "@/components/brand/mark";
import { CHOSEN_CONCEPT, MARK_CONCEPTS, type MarkConcept } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

const ABOUT: Record<MarkConcept, { name: string; note: string }> = {
  rise: {
    name: "A · Rising S",
    note: "The S of Satify finishing as an upward stroke with an arrow tip: progress, not perfection. Distinctive, and still a clear letter at 16px.",
  },
  steps: {
    name: "B · Steps",
    note: "Three rising bars. Clear idea, but it reads as a phone signal or chart icon, so it says little about Satify.",
  },
  bubble: {
    name: "C · Bubble",
    note: "A filled answer bubble with a small orbit. Calm and SAT-specific, but at 16px it becomes a plain dot in a ring.",
  },
};

const WHY =
  "Chosen: A. It is the only concept that carries the name (the S), the promise (it rises) and stays crisp from a 16px favicon to a 256px app icon. Pip the highlighter carries the personality; the mark stays simple and premium.";

/** The three logo concepts at 16, 32, 64 and 256px: flat up to 32, gloss from 64. */
export function LogoConcepts() {
  return (
    <section className="space-y-6 rounded-[20px] border bg-background p-6 lg:p-10" aria-labelledby="logo-concepts">
      <div>
        <h2 id="logo-concepts" className="text-h3 font-semibold">
          Logo concepts
        </h2>
        <p className="max-w-[70ch] text-muted-foreground">{WHY}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {MARK_CONCEPTS.map((k) => (
          <article key={k} className={cn("space-y-4 rounded-2xl border p-4", k === CHOSEN_CONCEPT && "border-primary ring-2 ring-primary/30")}>
            <h3 className="font-semibold">
              {ABOUT[k].name}
              {k === CHOSEN_CONCEPT && <span className="ms-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary">In use</span>}
            </h3>
            {(["light", "dark"] as const).map((theme) => (
              <div key={theme} className={cn(theme, "flex flex-wrap items-end gap-4 rounded-xl bg-background p-4")}>
                <BrandMark concept={k} className="size-4" />
                <BrandMark concept={k} className="size-8" />
                <BrandMarkGloss concept={k} theme={theme} className="size-16" />
                <BrandMarkGloss concept={k} theme={theme} className="size-[256px] max-w-full" />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">{ABOUT[k].note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
