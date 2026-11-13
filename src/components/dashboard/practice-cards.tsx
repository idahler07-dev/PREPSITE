import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type CardKey = "bank" | "mocks" | "review" | "vocab" | "plan" | "progress";
const CARDS: { key: CardKey; href: string; pose: string; tint: string }[] = [
  { key: "bank", href: "/practice", pose: "read", tint: "--tint-aqua" },
  { key: "mocks", href: "/mocks", pose: "laptop", tint: "--tint-peach" },
  { key: "review", href: "/review", pose: "think", tint: "--tint-sky" },
  { key: "vocab", href: "/vocab", pose: "idea", tint: "--tint-mint" },
  { key: "plan", href: "/plan", pose: "wink", tint: "--tint-peach" },
  { key: "progress", href: "/analytics", pose: "trophy", tint: "--tint-aqua" },
];

/** "Practice your way": one card per area, with Willo doing that activity in a tinted scene. */
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
                className="relative h-[150px] overflow-hidden rounded-xl"
                style={{ background: `var(${c.tint})` }}
              >
                <div
                  aria-hidden
                  className="absolute start-1/2 top-[62%] size-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface/55"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- static mascot art */}
                <img
                  src={`/mascot/deer-${c.pose}-sm.webp`}
                  alt=""
                  width={128}
                  height={128}
                  className="absolute start-1/2 -bottom-6 w-[128px] -translate-x-1/2 transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
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
