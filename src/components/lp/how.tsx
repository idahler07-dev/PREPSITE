import { getTranslations } from "next-intl/server";
import { Illo } from "./sprite";

const ART = ["diag", "plan", "trophy"] as const;

/** Three steps, each with its illustration fading into the card. */
export async function LpHow() {
  const t = await getTranslations("lp");
  const steps = t.raw("how.steps") as { t: string; d: string }[];
  return (
    <section className="mx-auto max-w-[1176px] px-4 pt-32 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-xs font-extrabold tracking-[0.14em] text-[#A9730E] uppercase">
            {t("how.eyebrow")}
          </div>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-black tracking-[-0.05em]">
            {t("how.title")}
          </h2>
        </div>
        <p className="max-w-[380px] text-base leading-[1.55] font-medium text-muted-foreground">
          {t("how.blurb")}
        </p>
      </div>
      <ol className="mt-11 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.t}
            className="rounded-3xl border bg-surface-2/60 p-2.5 pb-7"
          >
            <div
              aria-hidden
              className="relative h-[190px] overflow-hidden rounded-[18px]"
            >
              <Illo name={ART[i]!} className="block h-[190px] w-full" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-[color-mix(in_oklab,var(--surface-2)_60%,var(--background))]" />
            </div>
            <div className="px-5">
              <div className="mt-6 grid size-8 place-items-center rounded-full bg-[#B8470F] text-sm font-black text-white">
                {i + 1}
              </div>
              <h3 className="mt-3.5 text-[21px] font-black tracking-[-0.035em]">
                {s.t}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.55] font-medium text-muted-foreground">
                {s.d}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
