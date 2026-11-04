"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { logOfficialScore } from "@/server/actions/learning";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Odometer } from "@/components/motion/odometer";
import { playSfx } from "@/lib/sfx";
import { ScoreRuler } from "./score-ruler";

/** Enter the score of a practice test already taken: one tape-measure ruler per section, the total rolls as they move. */
export function ScoreEntry({ trigger, initial, today }: { trigger: ReactNode; initial?: { rw: number; math: number }; today: string }) {
  const t = useTranslations("dashboard.scoreEntry");
  const tx = useTranslations("taxonomy");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [rw, setRw] = useState(initial?.rw ?? 600);
  const [math, setMath] = useState(initial?.math ?? 600);
  const [date, setDate] = useState(today);

  function save() {
    start(async () => {
      const res = await logOfficialScore({ testName: t("testName"), takenOn: date, rw, math, missedSkills: [] });
      if (res.ok) {
        playSfx("done");
        toast.success(t("saved"));
        setOpen(false);
        router.refresh();
      } else toast.error(t("error"));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <ScoreRuler label={tx("sections.RW")} value={rw} onChange={setRw} tone="highlight" />
          <ScoreRuler label={tx("sections.MATH")} value={math} onChange={setMath} tone="primary" />
        </div>
        <div className="flex items-end justify-between gap-4 rounded-2xl bg-primary-soft/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("total")}</p>
            <p className="text-[2.75rem] leading-none font-bold tracking-tight">
              <Odometer value={rw + math} className="font-mono" />
            </p>
          </div>
          <p className="pb-1 font-mono text-sm text-muted-foreground">{t("outOf")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="score-date">{t("date")}</Label>
          <Input id="score-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={pending || !date} className="w-full sm:w-auto">
            {pending && <Loader2 className="animate-spin" aria-hidden />} {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
