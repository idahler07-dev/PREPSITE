"use client";

import { useTranslations } from "next-intl";
import SquishSwitch from "@/components/fx/SquishSwitch";
import { playSfx, setSfxEnabled, useSfxEnabled } from "@/lib/sfx";

/** Sound effects on or off for this device (drills only; mock tests are silent). */
export function SoundSwitch() {
  const t = useTranslations("settings");
  const on = useSfxEnabled();
  return (
    <SquishSwitch
      checked={on}
      onChange={(next) => {
        setSfxEnabled(next);
        // A short preview so the student hears what they turned on.
        if (next) playSfx("correct");
      }}
      ariaLabel={t("sound")}
      width={52}
      height={30}
      radius={15}
      stretch={24}
      trackColor="var(--input)"
      trackOnColor="var(--primary)"
      thumbColor="var(--background)"
      thumbOnColor="var(--primary-foreground)"
    />
  );
}
