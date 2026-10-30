"use client";

import "katex/dist/katex.min.css"; // math styles only where math is shown
import { useMemo } from "react";
import katex from "katex";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Our own math reference sheet: standard formulas, written for this site. */
const FORMULAS: { key: string; tex: string }[] = [
  { key: "circleArea", tex: "A = \\pi r^2" },
  { key: "circumference", tex: "C = 2\\pi r" },
  { key: "rectangleArea", tex: "A = \\ell w" },
  { key: "triangleArea", tex: "A = \\tfrac{1}{2} b h" },
  { key: "pythagorean", tex: "a^2 + b^2 = c^2" },
  { key: "special30", tex: "x,\\ x\\sqrt{3},\\ 2x \\quad (30^\\circ\\text{-}60^\\circ\\text{-}90^\\circ)" },
  { key: "special45", tex: "x,\\ x,\\ x\\sqrt{2} \\quad (45^\\circ\\text{-}45^\\circ\\text{-}90^\\circ)" },
  { key: "boxVolume", tex: "V = \\ell w h" },
  { key: "cylinderVolume", tex: "V = \\pi r^2 h" },
  { key: "sphereVolume", tex: "V = \\tfrac{4}{3}\\pi r^3" },
  { key: "coneVolume", tex: "V = \\tfrac{1}{3}\\pi r^2 h" },
  { key: "pyramidVolume", tex: "V = \\tfrac{1}{3}\\ell w h" },
];

export function ReferenceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("test.reference");
  const rendered = useMemo(() => FORMULAS.map((f) => ({ ...f, html: katex.renderToString(f.tex, { throwOnError: false, trust: false }) })), []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("intro")}</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rendered.map((f) => (
            <div key={f.key} className="rounded-md border p-3">
              <dt className="text-sm text-muted-foreground">{t(`items.${f.key as "circleArea"}`)}</dt>
              {/* KaTeX output of our own fixed formulas (trust: false). */}
              <dd className="mt-1 text-lg" dangerouslySetInnerHTML={{ __html: f.html }} />
            </div>
          ))}
        </dl>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{t("facts.circleDegrees")}</li>
          <li>{t("facts.circleRadians")}</li>
          <li>{t("facts.triangleAngles")}</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
