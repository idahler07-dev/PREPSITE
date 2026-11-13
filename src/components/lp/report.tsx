import { SAMPLE } from "./sprite";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

const BARS: [number, string][] = [
  [88, "bg-[#0F6B78]"],
  [71, "bg-[#0F6B78]"],
  [64, "bg-[#E2AA2E]"],
  [52, "bg-[#FF6A1A]"],
];
const CARD =
  "rounded-3xl border bg-surface p-7 shadow-[0_1px_2px_rgba(58,36,20,0.04),0_30px_60px_-36px_rgba(58,36,20,0.3)]";

/** A sample score report instead of testimonials we don't have yet. Always labelled as sample data. */
export async function LpReport() {
  const t = await getTranslations("lp");
  const names = t.raw("report.skillNames") as string[];
  return (
    <section className="mx-auto max-w-[1176px] px-4 pt-32 sm:px-8">
      <div className="text-center">
        <div className="text-xs font-extrabold tracking-[0.14em] text-[#A9730E] uppercase">
          {t("report.eyebrow")}
        </div>
        <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-black tracking-[-0.05em]">
          {t("report.title")}
        </h2>
        <p className="mx-auto mt-3.5 max-w-[560px] text-[17px] font-medium text-muted-foreground">
          {t("report.blurb")}
        </p>
      </div>
      <div className="mt-11 grid gap-5 md:grid-cols-3">
        <div className={CARD}>
          <div className="text-xs font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
            {t("report.predicted")}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5">
            <span className="text-[56px] leading-none font-black tracking-[-0.06em]">
              {SAMPLE.score}
            </span>
            <span className="text-[15px] font-extrabold text-primary">
              {t("report.since")}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-border">
            <div className="h-full w-[74%] rounded-full bg-[#FF6A1A]" />
          </div>
          <div className="mt-2.5 flex justify-between text-[13px] font-semibold text-muted-foreground">
            <span>
              {t("report.rw")} <b className="text-foreground">{SAMPLE.rw}</b>
            </span>
            <span>
              {t("report.math")}{" "}
              <b className="text-foreground">{SAMPLE.math}</b>
            </span>
          </div>
        </div>
        <div className={CARD}>
          <div className="text-xs font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
            {t("report.skills")}
          </div>
          <div className="mt-3">
            {BARS.map(([v, c], i) => (
              <div key={names[i]} className="flex h-[34px] items-center gap-3">
                <span className="flex-1 text-sm font-bold">{names[i]}</span>
                <span className="h-[7px] w-[110px] rounded-full bg-border">
                  <span
                    className={`block h-full rounded-full ${c}`}
                    style={{ width: `${v}%` }}
                  />
                </span>
                <span className="w-9 text-end text-[13px] font-extrabold">
                  {v}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[13px] font-semibold text-muted-foreground">
            {t("report.lowest")}
          </div>
        </div>
        <div className={`${CARD} border-[#F6DCC9] bg-[#FFF1E8]`}>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static avatar */}
            <img
              src="/mascot/formats/avatar-wink.png"
              alt=""
              width={42}
              height={54}
              className="-mt-3 w-[42px]"
            />
            <span className="text-[15px] font-black tracking-[-0.03em]">
              {t("report.next")}
            </span>
          </div>
          <p className="mt-4 text-base leading-[1.55] font-semibold text-[#2A2A2A]">
            {t("report.nextBody")}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-extrabold text-[#B8470F]"
          >
            {t("report.drill")}
          </Link>
        </div>
      </div>
    </section>
  );
}
