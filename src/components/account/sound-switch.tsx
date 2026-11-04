"use client";

import { useTranslations } from "next-intl";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { playSfx, setSfxEnabled, useSfxEnabled } from "@/lib/sfx";

/** Sound effects on or off for this device (drills only; mock tests are silent). */
export function SoundSwitch() {
  const t = useTranslations("settings");
  const on = useSfxEnabled();
  return (
    <ToggleSwitch
      checked={on}
      label={t("sound")}
      onChange={(next) => {
        setSfxEnabled(next);
        // A short preview so the student hears what they turned on.
        if (next) playSfx("correct");
      }}
    />
  );
}
