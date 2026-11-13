import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Closing panel with Willo's cheering sticker. */
export async function LpFinalCta({ startHref }: { startHref: string }) {
  const t = await getTranslations("lp");
  return (
    <section className="mx-auto max-w-[1176px] px-4 pt-32 pb-20 sm:px-8">
      <div className="relative flex flex-wrap items-center justify-between gap-10 overflow-hidden rounded-[32px] bg-[#FFF1E8] px-8 py-16 sm:px-16">
        <div
          aria-hidden
          className="absolute -right-[120px] -bottom-40 size-[520px] rounded-full bg-[#FFE2CF]"
        />
        <div className="relative min-w-0 flex-[1_1_440px]">
          <h2 className="max-w-[600px] text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.02] font-black tracking-[-0.055em] text-[#0B0B0C]">
            {t("final.title")}
          </h2>
          <p className="mt-4 text-[17px] font-medium text-[#5E4A3E]">
            {t("final.body")}
          </p>
          <Button asChild size="lg" className="mt-7 tracking-wide uppercase">
            <Link href={startHref}>
              {t("final.cta")} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <div className="mt-3.5 text-[13px] font-semibold text-[#7A5A48]">
            {t("final.note")}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- static sticker */}
        <img
          src="/mascot/formats/sticker-cheer.png"
          alt=""
          width={300}
          height={300}
          className="relative w-[240px] rotate-[6deg] drop-shadow-[0_18px_24px_rgba(122,74,35,0.22)] sm:w-[300px]"
        />
      </div>
    </section>
  );
}
