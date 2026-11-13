import { getTranslations } from "next-intl/server";
import { ArrowDown, ArrowRight, Check, Flame } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Laurel, SAMPLE } from "./sprite";

/** First screen: the target score in a laurel, a headline whose last line rotates, one orange action. */
export async function LpHero({
  startHref,
  price,
}: {
  startHref: string;
  price: string;
}) {
  const t = await getTranslations("lp");
  const words = t.raw("hero.words") as string[];
  const checks = t.raw("hero.checks") as string[];
  const lead = t("hero.lead");
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-20 text-center sm:px-8">
      <div
        aria-hidden
        className="lp-dots pointer-events-none absolute inset-0"
      />

      {/* Floating product chips (decorative): wide screens only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mx-auto hidden max-w-[1240px] min-[1180px]:block"
      >
        <div className="lp-bob absolute top-[150px] left-10 w-[210px] -rotate-[5deg] rounded-[18px] bg-[#0C3A43] p-4 text-start text-white shadow-[0_24px_48px_-20px_rgba(12,58,67,0.55)]">
          <div className="text-[11px] font-extrabold tracking-[0.08em] text-[#A7C9CE] uppercase">
            {t("hero.predicted")}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-[-0.06em]">
              {SAMPLE.score}
            </span>
            <span className="text-xs font-extrabold text-[#F2C14E]">
              {SAMPLE.delta}
            </span>
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/15">
            <div className="h-full w-[74%] rounded-full bg-[#FF6A1A]" />
          </div>
        </div>
        <div className="lp-bob2 absolute top-[340px] left-[90px] flex rotate-3 items-center gap-2.5 rounded-full border bg-surface py-2 ps-2 pe-4 shadow-[0_16px_36px_-18px_rgba(58,36,20,0.3)]">
          <span className="grid size-[30px] place-items-center rounded-full bg-[#FFF1E8]">
            <Flame className="size-4 fill-[#FF6A1A] text-[#FF6A1A]" />
          </span>
          <span className="text-[13px] font-extrabold">{t("hero.streak")}</span>
        </div>
        <div className="lp-bob2 absolute top-[140px] right-[30px] flex w-[250px] rotate-[4deg] items-start gap-2.5 rounded-[18px] border bg-surface p-3.5 text-start shadow-[0_24px_48px_-22px_rgba(58,36,20,0.35)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- static avatar */}
          <img
            src="/mascot/formats/avatar-wink.png"
            alt=""
            width={40}
            height={52}
            className="-mt-3 w-10 flex-none"
          />
          <span className="text-[13px] leading-[1.45] font-semibold">
            <b className="font-black">{t("hero.willo")}:</b> {t("hero.chat")}
          </span>
        </div>
        <div className="lp-bob absolute top-[330px] right-[70px] flex -rotate-3 items-center gap-2.5 rounded-[14px] border bg-surface px-3.5 py-2.5 shadow-[0_16px_36px_-18px_rgba(58,36,20,0.3)]">
          <span className="rounded-md bg-[#0F6B78] px-2 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white uppercase">
            {t("hero.module")}
          </span>
          <span className="text-[13px] font-extrabold">{t("hero.hard")}</span>
        </div>
      </div>

      <div className="relative">
        <Link
          href="/sat"
          className="inline-flex h-9 items-center gap-2.5 rounded-full border bg-surface ps-1.5 pe-3.5 text-[13px] font-semibold text-foreground/80 hover:text-foreground"
        >
          <span className="rounded-full bg-[#0C3A43] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.06em] text-white uppercase">
            {t("hero.chipTag")}
          </span>
          <span>{t("hero.chipText")}</span>
          <ArrowRight aria-hidden className="size-3.5 text-muted-foreground" />
        </Link>

        <div className="mt-9 flex items-center justify-center gap-1">
          <Laurel className="h-[clamp(120px,15vw,218px)] w-auto" />
          <div
            className="px-2 text-[clamp(6rem,14vw,10.5rem)] leading-[0.9] font-black tracking-[-0.075em]"
            aria-label={t("hero.laurelLabel")}
          >
            {t("hero.laurelLabel")}
          </div>
          <Laurel className="h-[clamp(120px,15vw,218px)] w-auto -scale-x-100" />
        </div>

        <h1
          aria-label={`${lead} ${words[0]}`}
          className="mx-auto mt-7 max-w-[960px] text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.04] font-black tracking-[-0.05em]"
        >
          <span aria-hidden className="block">
            {lead}
          </span>
          <span
            aria-hidden
            className="relative block h-[1.08em] overflow-hidden text-primary"
          >
            <span className="lp-rot block">
              {[...words, words[0]].map((w, i) => (
                <span
                  key={i}
                  className="block h-[1.08em] leading-[1.08em] whitespace-nowrap"
                >
                  {w}
                </span>
              ))}
            </span>
          </span>
          <svg
            aria-hidden
            width="300"
            height="16"
            viewBox="0 0 300 16"
            className="mx-auto mt-0.5 block"
          >
            <path
              d="M6 11 C70 3 150 2 294 8"
              fill="none"
              stroke="#F2C14E"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </h1>
        <p className="mx-auto mt-5 max-w-[600px] text-[19px] leading-[1.5] font-medium text-muted-foreground">
          {t("hero.sub")}
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3.5">
          <Button asChild size="lg" className="tracking-wide uppercase">
            <Link href={startHref}>
              {t("hero.cta")} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="tracking-wide uppercase"
          >
            <a href="#try">
              {t("hero.try")} <ArrowDown aria-hidden />
            </a>
          </Button>
        </div>
        <ul className="mt-5 flex flex-wrap justify-center gap-x-[18px] gap-y-1 text-[13px] font-semibold text-muted-foreground">
          {checks.map((c) => (
            <li key={c} className="inline-flex items-center gap-1.5">
              <Check
                aria-hidden
                className="size-3.5 text-primary"
                strokeWidth={3}
              />
              {c.replace("{price}", price)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
