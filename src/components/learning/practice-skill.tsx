"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillMap, type SkillTile } from "./skill-map";
import { useStartDrill } from "@/components/practice/use-start-drill";

/** Skill map whose tiles start a 10-question drill on that skill. */
export function DrillSkillMap({ tiles, limit = 10 }: { tiles: SkillTile[]; limit?: number }) {
  const t = useTranslations("dashboard");
  const { launch } = useStartDrill();
  const [all, setAll] = useState(false);
  // Skills with results come first, weakest on top; with no results the order stays as is.
  const ordered = [...tiles].sort((a, b) => (a.mastery == null ? 2 : a.mastery) - (b.mastery == null ? 2 : b.mastery));
  const shown = all || tiles.length <= limit ? tiles : ordered.slice(0, limit);
  return (
    <div className="space-y-4">
      <SkillMap tiles={shown} onPick={(skill) => launch({ skills: [skill], count: 10 })} />
      {tiles.length > limit && (
        <Button variant="ghost" size="sm" onClick={() => setAll((v) => !v)} aria-expanded={all} className="mx-auto flex">
          {all ? t("showFewerSkills") : t("showAllSkills", { count: tiles.length })}
          <ChevronDown className={`transition-transform duration-300 ${all ? "rotate-180" : ""}`} aria-hidden />
        </Button>
      )}
    </div>
  );
}

/** "Practice now" for one skill. */
export function PracticeSkillButton({ skill }: { skill: string }) {
  const t = useTranslations("dashboard");
  const { launch, pending } = useStartDrill();
  return (
    <Button size="sm" variant="secondary" onClick={() => launch({ skills: [skill], count: 10 })} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
      {t("practiceNow")}
    </Button>
  );
}
