"use client";

import { useState } from "react";
import { Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
const CORRECT = 1;

/** "Get one wrong": a real question on the page, with Willo explaining the exact option you picked. */
export function TryQuestion() {
  const t = useTranslations("lp");
  const options = t.raw("try.options") as { t: string; e: string }[];
  const steps = t.raw("try.steps") as string[];
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <section id="try" className="mt-8 scroll-mt-16 border-y bg-surface-2/50">
      <div className="mx-auto grid max-w-[1176px] items-center gap-12 px-4 py-24 sm:px-8 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <div className="text-xs font-extrabold tracking-[0.14em] text-[#A9730E] uppercase">
            {t("try.eyebrow")}
          </div>
          <h2 className="mt-3 text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.05] font-black tracking-[-0.05em]">
            {t("try.title1")}{" "}
            <span className="text-primary">{t("try.title2")}</span>
          </h2>
          <p className="mt-4 max-w-[430px] text-[17px] leading-[1.6] font-medium text-muted-foreground">
            {t("try.body")}
          </p>
          <ol className="mt-7 space-y-3">
            {steps.map((s, i) => (
              <li
                key={s}
                className="flex items-center gap-3 text-[15px] font-extrabold"
              >
                <span className="grid size-7 place-items-center rounded-full border bg-surface text-[13px] font-black text-[#C2410C]">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- static sticker */}
          <img
            src="/mascot/formats/sticker-stand.png"
            alt=""
            width={210}
            height={210}
            className="mt-7 hidden w-[210px] -rotate-[5deg] lg:block"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border bg-surface shadow-[0_1px_2px_rgba(58,36,20,0.04),0_40px_80px_-40px_rgba(58,36,20,0.3)]">
          <div className="flex h-12 items-center justify-between border-b bg-surface-2/60 px-5 text-xs font-bold text-muted-foreground">
            <span>{t("try.module")}</span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Timer aria-hidden className="size-3.5" />
              {t("try.timer")}
            </span>
          </div>
          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-2.5 text-[13px] font-extrabold">
              <span className="grid h-[22px] min-w-[22px] place-items-center rounded-md bg-foreground px-1 text-xs text-background">
                {t("try.num")}
              </span>
              {t("try.skill")}
            </div>
            <p className="mt-4 text-base leading-[1.65] sm:text-[17px]">
              {t("try.passage")}
            </p>
            <p className="mt-4 text-[13px] font-extrabold">{t("try.ask")}</p>
            <div
              role="group"
              aria-label={t("try.ask")}
              className="mt-3 space-y-2"
            >
              {options.map((o, i) => {
                const isPicked = picked === i;
                const isCorrect = i === CORRECT;
                const done = picked !== null;
                return (
                  <button
                    key={o.t}
                    type="button"
                    aria-pressed={isPicked}
                    onClick={() => setPicked(i)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl border-[1.5px] bg-surface px-3.5 py-3 text-start text-[15px] font-semibold transition-colors hover:border-foreground/25",
                      done && isCorrect && "border-primary bg-primary/10",
                      done &&
                        isPicked &&
                        !isCorrect &&
                        "border-[#B8470F] bg-[#FFF1E8]",
                      done &&
                        !isCorrect &&
                        !isPicked &&
                        "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-[26px] flex-none place-items-center rounded-full border-[1.5px] text-xs font-extrabold",
                        done &&
                          isCorrect &&
                          "border-primary bg-primary text-primary-foreground",
                        done &&
                          isPicked &&
                          !isCorrect &&
                          "border-[#B8470F] bg-[#B8470F] text-white",
                      )}
                    >
                      {LETTERS[i]}
                    </span>
                    <span className="flex-1">{o.t}</span>
                    {done && isCorrect && (
                      <span className="text-[11px] font-extrabold tracking-[0.04em] text-primary uppercase">
                        {t("try.correct")}
                      </span>
                    )}
                    {done && isPicked && !isCorrect && (
                      <span className="text-[11px] font-extrabold tracking-[0.04em] text-[#B8470F] uppercase">
                        {t("try.yours")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              {picked !== null && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#FFF1E8] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static avatar */}
                  <img
                    src="/mascot/formats/avatar-wink.png"
                    alt=""
                    width={38}
                    height={49}
                    className="-mt-3 w-[38px] flex-none"
                  />
                  <div>
                    <div className="text-[13px] font-black">
                      {t("try.willo")}
                    </div>
                    <p className="mt-1 text-sm leading-[1.5] font-medium text-[#2A2A2A]">
                      {options[picked]!.e}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
