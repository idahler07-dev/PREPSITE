import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Spot, type SpotName } from "@/components/illustrations/spot";

type CardKey = "bank" | "mocks" | "review" | "vocab" | "plan" | "progress";
const CARDS: { key: CardKey; href: string; spot: SpotName; tint: string }[] = [
  { key: "bank", href: "/practice", spot: "bank", tint: "--tint-aqua" },
  { key: "mocks", href: "/mocks", spot: "mocks", tint: "--tint-peach" },
  { key: "review", href: "/review", spot: "review", tint: "--tint-sky" },
  { key: "vocab", href: "/vocab", spot: "vocab", tint: "--tint-mint" },
  { key: "plan", href: "/plan", spot: "plan", tint: "--tint-peach" },
  {
    key: "progress",
    href: "/analytics",
    spot: "progress",
    tint: "--tint-aqua",
  },
];

/** "Practice your way": one card per area, each with its own spot illustration on a tint. */
export async function PracticeCards({ due }: { due: number }) {
  const t = await getTranslations("dash");
  return (
    <section aria-labelledby="pc-title">
      <h2
        id="pc-title"
        className="font-display text-[19px] font-extrabold tracking-[-0.02em]"
      >
        {t("practiceTitle")}
      </h2>
      <ul className="mt-3.5 grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((c) => (
          <li key={c.key}>
            <Link
              href={c.href}
              className="group block h-full rounded-2xl border bg-surface p-2.5 shadow-[var(--elev-sm)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div
                className="relative h-[168px] overflow-hidden rounded-xl"
                style={{ background: `var(${c.tint})` }}
              >
                <div
                  aria-hidden
                  className="absolute start-1/2 top-1/2 size-[132px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface/50"
                />
                <Spot
                  name={c.spot}
                  className="absolute start-1/2 top-1/2 w-[178px] -translate-x-1/2 -translate-y-1/2"
                />
              </div>
              <div className="px-1.5 pt-3 pb-1.5">
                <p className="text-[14.5px] font-bold">
                  {t(`cards.${c.key}.t`)}
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {c.key === "review"
                    ? t("cards.review.d", { n: due })
                    : t(`cards.${c.key}.d`)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
