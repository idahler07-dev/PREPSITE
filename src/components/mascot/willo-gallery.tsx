"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Willo } from "./willo";
import { DEER_POSES, type DeerPose } from "./deer";

const POSES = Object.keys(DEER_POSES) as DeerPose[];
/** A little story for the mood switcher: thinking → idea → cheer → trophy. */
const STORY: DeerPose[] = ["think", "idea", "cheer", "trophy", "stand"];

export function WilloGallery() {
  const t = useTranslations("willo");
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % STORY.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <section className="mt-12 grid items-center gap-8 rounded-[32px] bg-gradient-to-br from-ice to-surface p-8 sm:grid-cols-[1fr_1.1fr] sm:p-12">
        <div>
          <p className="text-sm font-semibold text-primary">
            {t("storyLabel")}
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">
            {t(`story.${STORY[i] as "think"}`)}
          </p>
          <p className="mt-3 text-muted-foreground">{t("storyBody")}</p>
        </div>
        <div className="flex justify-center">
          <Willo pose={STORY[i]} className="w-64 sm:w-72" />
        </div>
      </section>
      <ul className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {POSES.map((p) => (
          <li
            key={p}
            className="flex flex-col items-center gap-3 rounded-[24px] border border-border bg-surface px-4 pt-6 pb-5"
          >
            <Willo pose={p} className="w-36" />
            <span className="text-sm font-semibold text-muted-foreground">
              {t(`poses.${p}`)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
