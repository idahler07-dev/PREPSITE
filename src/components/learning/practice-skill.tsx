"use client";

import { useTranslations } from "next-intl";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillMap, type SkillTile } from "./skill-map";
import { useStartDrill } from "@/components/practice/use-start-drill";

/** Skill map whose tiles start a 10-question drill on that skill. */
export function DrillSkillMap({ tiles }: { tiles: SkillTile[] }) {
  const { launch } = useStartDrill();
  return <SkillMap tiles={tiles} onPick={(skill) => launch({ skills: [skill], count: 10 })} />;
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
