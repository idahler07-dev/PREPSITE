import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Illo, Laurel } from "./sprite";

const ART = ["score", "note", "willo", "desmos", "vocab", "count"] as const;

/** The dark band: six tools, one illustration each, in a hairline grid. */
export async function LpFeatures() {
  const t = await getTranslations("lp");
  const items = t.raw("features.items") as { t: string; d: string }[];
  return (
    <section className="relative mt-32 overflow-hidden bg-[#0C3A43] text-white">
      <Laurel className="pointer-events-none absolute -top-14 -right-[90px] hidden h-[880px] w-[420px] opacity-[0.07] md:block" />
      <div className="relative mx-auto max-w-[1176px] px-4 py-28 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-extrabold tracking-[0.14em] text-[#F2C14E] uppercase">
              {t("features.eyebrow")}
            </div>
            <h2 className="mt-3 max-w-[640px] text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-black tracking-[-0.05em] text-white">
              {t("features.title")}
            </h2>
          </div>
          <Link
            href="/resources"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#FFB07A] hover:text-[#FFC9A4]"
          >
            {t("features.link")} <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <li
              key={it.t}
              className="bg-[#0C3A43] px-7 py-8 transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
            >
              <div
                aria-hidden
                className="relative -mx-7 -mt-8 mb-1.5 h-[158px] overflow-hidden"
              >
                <Illo name={ART[i]!} className="mt-3 block h-[158px] w-full" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#0C3A43]" />
              </div>
              <h3 className="text-[19px] font-black tracking-[-0.03em]">
                {it.t}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.55] font-medium text-[#A7C9CE]">
                {it.d}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
