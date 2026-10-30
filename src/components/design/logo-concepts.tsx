/* eslint-disable react/jsx-no-literals -- designer-facing showcase, not user copy */
import { BrandMark, BrandMarkGloss } from "@/components/brand/mark";
import { CHOSEN_CONCEPT, MARK_CONCEPTS, type MarkConcept } from "@/lib/brand-mark";
import { cn } from "@/lib/utils";

const ABOUT: Record<MarkConcept, { name: string; note: string }> = {
  curls: {
    name: "A · Curls",
    note: "Dome head, two eyes, four mirrored arms ending in tidy curls. Reads as an octopus at every size and stays calm and balanced.",
  },
  rise: {
    name: "B · Rising arm",
    note: "One arm rises into an arrow for “scores go up”. Clever at 256px, but the arrow turns into a smudge at 16px and makes the mark lopsided.",
  },
  stamp: {
    name: "C · Stamp",
    note: "Head only with a scalloped edge. Strongest at 16px, but without arms it reads as a ghost rather than an octopus, and loses Otto.",
  },
};

const WHY =
  "Chosen: A. It is the only concept that is unmistakably Otto at 16px (the head and four arm stubs survive) and still rich at 256px. The symmetry suits a calm study tool; the rising arrow (B) is kept as an idea for marketing, not the mark.";

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
