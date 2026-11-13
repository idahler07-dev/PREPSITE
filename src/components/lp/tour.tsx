import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SAMPLE } from "./sprite";
import { AppMark } from "@/components/brand/antler-w";

const SKILLS: [string, number, "teal" | "gold" | "orange"][] = [
  ["Algebra", 88, "teal"],
  ["Craft & Structure", 71, "teal"],
  ["Geometry", 64, "gold"],
  ["Standard English", 52, "orange"],
];
const BAR = {
  teal: "bg-[#0F6B78]",
  gold: "bg-[#E2AA2E]",
  orange: "bg-[#FF6A1A]",
} as const;

/** "Take a look inside": the real dashboard layout in a browser frame, Willo's head behind the window edge. */
export async function LpTour({ startHref }: { startHref: string }) {
  const t = await getTranslations("lp");
  const p = await getTranslations("lp");
  const nav = p.raw("preview.nav") as string[];
  return (
    <section
      id="tour"
      className="mx-auto max-w-[1176px] px-4 pt-28 text-center sm:px-8"
    >
      <div className="text-xs font-extrabold tracking-[0.14em] text-[#A9730E] uppercase">
        {t("tour.eyebrow")}
      </div>
      <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-black tracking-[-0.05em]">
        {t("tour.title")}
      </h2>

      <div className="relative mx-auto mt-28 max-w-[1120px]">
        {/* Willo sits behind the window edge: head and scarf only */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static cutout */}
        <img
          src="/mascot/formats/behind-wink.png"
          alt=""
          width={150}
          height={159}
          className="absolute -top-[128px] right-[6%] z-0 hidden w-[150px] sm:block"
        />
        <div
          aria-hidden
          className="relative z-10 overflow-hidden rounded-[18px] border bg-surface text-start shadow-[0_50px_120px_-30px_rgba(12,58,67,0.38),0_18px_40px_-20px_rgba(12,58,67,0.2)]"
        >
          <div className="flex h-12 items-center gap-2 border-b bg-[#F5F2EC] px-4">
            <i className="size-3 rounded-full bg-[#FF5F57]" />
            <i className="size-3 rounded-full bg-[#FEBC2E]" />
            <i className="size-3 rounded-full bg-[#28C840]" />
            <span className="mx-auto w-[min(360px,60%)] rounded-lg border bg-surface py-1 text-center text-xs font-medium text-muted-foreground">
              {SAMPLE.host}
            </span>
          </div>
          <div className="grid md:grid-cols-[200px_1fr]">
            <div className="hidden border-e bg-surface p-4 md:block">
              <div className="flex items-center gap-2 pb-5">
                <AppMark className="w-7" />
                <span className="text-sm font-extrabold tracking-[-0.03em]">
                  {SAMPLE.brand}
                </span>
              </div>
              {nav.map((n, i) => (
                <div
                  key={n}
                  className={`rounded-lg px-3 py-2 text-[13px] font-bold ${i === 0 ? "bg-[#FFF1E8] text-[#C2410C]" : "text-foreground/70"}`}
                >
                  {n}
                </div>
              ))}
            </div>
            <div className="bg-[#FBF9F5] p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {p("preview.day")}
                  </div>
                  <div className="text-[22px] font-black tracking-[-0.04em]">
                    {p("preview.hello")}
                  </div>
                </div>
                <span className="inline-flex h-9 items-center rounded-full bg-[#FF6A1A] px-4 text-[11px] font-extrabold tracking-[0.04em] text-white uppercase">
                  {p("preview.continue")} →
                </span>
              </div>
              <div className="mt-4 grid gap-3.5 lg:grid-cols-[1.7fr_1fr]">
                <div className="rounded-2xl bg-[#0C3A43] p-5 text-white">
                  <div className="flex justify-between text-[11px] font-extrabold tracking-[0.08em] uppercase">
                    <span className="text-[#A7C9CE]">
                      {p("preview.predicted")}
                    </span>
                    <span className="text-[#F2C14E]">
                      {p("preview.target")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2.5">
                    <span className="text-5xl font-black tracking-[-0.06em]">
                      {SAMPLE.score}
                    </span>
                    <span className="text-xs font-extrabold text-[#F2C14E]">
                      {p("preview.since")}
                    </span>
                  </div>
                  <div className="relative mt-3 h-2 rounded-full bg-white/15">
                    <div className="h-full w-[74%] rounded-full bg-[#FF6A1A]" />
                    <div className="absolute -top-1 left-[84%] h-4 w-0.5 bg-[#F2C14E]" />
                  </div>
                  <div className="mt-2 text-center text-[11px] font-semibold text-[#A7C9CE]">
                    {p("preview.sections")}
                  </div>
                </div>
                <div className="rounded-2xl border bg-surface p-5">
                  <div className="text-[11px] font-extrabold tracking-[0.08em] text-muted-foreground uppercase">
                    {p("preview.streak")}
                  </div>
                  <div className="mt-1 text-3xl font-black tracking-[-0.05em]">
                    {p("preview.days")}
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {[1, 1, 1, 1, 1, 0.3, 0.12].map((o, i) => (
                      <i
                        key={i}
                        className="h-3.5 flex-1 rounded-[5px] bg-[#FF6A1A]"
                        style={{ opacity: o }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3.5 grid gap-3.5 md:grid-cols-3">
                <div className="rounded-2xl border bg-surface p-5">
                  <div className="text-[13px] font-extrabold">
                    {p("preview.plan")}
                  </div>
                  <ul className="mt-3 space-y-2 text-[13px] font-bold">
                    <li className="flex items-center gap-2 text-muted-foreground line-through">
                      <i className="size-3.5 rounded-full bg-[#0F6B78]" />
                      {p("preview.p1")}
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground line-through">
                      <i className="size-3.5 rounded-full bg-[#0F6B78]" />
                      {p("preview.p2")}
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="size-3.5 rounded-full border-2 border-[#FF6A1A]" />
                      {p("preview.p3")}
                    </li>
                    <li className="flex items-center gap-2">
                      <i className="size-3.5 rounded-full border-2 border-border" />
                      {p("preview.p4")}
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border bg-surface p-5">
                  <div className="text-[13px] font-extrabold">
                    {p("preview.skills")}
                  </div>
                  <div className="mt-3 space-y-2.5">
                    {SKILLS.map(([n, v, c]) => (
                      <div key={n}>
                        <div className="flex justify-between text-xs font-bold">
                          <span>{n}</span>
                          <span className="text-muted-foreground">{v}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-border">
                          <div
                            className={`h-full rounded-full ${BAR[c]}`}
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-[#FFF1E8] p-5">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static avatar */}
                    <img
                      src="/mascot/formats/avatar-wink.png"
                      alt=""
                      width={30}
                      height={39}
                      className="-mt-2 w-[30px]"
                    />
                    <span className="text-[15px] font-black tracking-[-0.03em]">
                      {p("preview.willo")}
                    </span>
                  </div>
                  <p className="mt-2.5 rounded-xl rounded-es-sm bg-surface p-3 text-[13px] leading-[1.45] font-semibold">
                    {p("preview.note")}
                  </p>
                  <div className="mt-2 text-xs font-extrabold text-[#C2410C]">
                    {p("preview.drill")} →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-9">
          <Button asChild size="lg" className="tracking-wide uppercase">
            <Link href={startHref}>
              {t("tour.cta")} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            {t("tour.caption")}
          </p>
        </div>
      </div>
    </section>
  );
}
