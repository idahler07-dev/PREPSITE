import { getTranslations } from "next-intl/server";
import { Illo } from "./sprite";

const NAMES = [
  "diag",
  "score",
  "note",
  "plan",
  "willo",
  "desmos",
  "trophy",
  "vocab",
  "count",
] as const;
const GLOW = [
  "#E3F0F1",
  "#FFE9DB",
  "#E3F0F1",
  "#FFF3D6",
  "#FFE9DB",
  "#E3F0F1",
  "#FFF3D6",
  "#FFE9DB",
  "#E3F0F1",
];

/** Endless ribbon of the tools, each with its illustration. Paused on hover; static for reduced motion. */
export async function LpRibbon() {
  const t = await getTranslations("lp");
  const labels = t.raw("ribbon.items") as string[];
  const row = (aria: boolean) => (
    <div className="flex gap-10" aria-hidden={aria || undefined}>
      {NAMES.map((n, i) => (
        <div
          key={n}
          className="relative flex w-[210px] flex-none flex-col items-center"
        >
          <div
            aria-hidden
            className="absolute top-1 left-1/2 h-32 w-[180px] -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(closest-side, ${GLOW[i]}, rgba(255,255,255,0))`,
            }}
          />
          <Illo name={n} ribbon className="relative block h-32 w-[200px]" />
          <span className="relative mt-2.5 text-[13px] font-bold tracking-[-0.01em] text-muted-foreground">
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
  return (
    <section
      aria-label={t("ribbon.label")}
      className="lp-marquee mt-14 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
    >
      <div className="lp-marquee-track flex w-max gap-10 py-2">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
