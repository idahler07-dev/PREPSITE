"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS } from "@/lib/taxonomy";
import { deleteOfficialScore, logOfficialScore } from "@/server/actions/learning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OfficialScoreForm() {
  const t = useTranslations("resources.log");
  const tx = useTranslations("taxonomy");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ testName: "", takenOn: "", rw: "", math: "" });
  const [skills, setSkills] = useState<string[]>([]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await logOfficialScore({ ...f, missedSkills: skills });
          if (res.ok) {
            toast.success(t("saved"));
            setF({ testName: "", takenOn: "", rw: "", math: "" });
            setSkills([]);
            router.refresh();
          } else toast.error(t("invalid"));
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="os-name">{t("testName")}</Label>
          <Input id="os-name" value={f.testName} onChange={set("testName")} required maxLength={80} placeholder={t("testNamePlaceholder")} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="os-date">{t("date")}</Label>
          <Input id="os-date" type="date" value={f.takenOn} onChange={set("takenOn")} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="os-rw">{tx("sections.RW")}</Label>
          <Input id="os-rw" type="number" min={200} max={800} step={10} value={f.rw} onChange={set("rw")} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="os-math">{tx("sections.MATH")}</Label>
          <Input id="os-math" type="number" min={200} max={800} step={10} value={f.math} onChange={set("math")} required />
        </div>
      </div>
      <details>
        <summary className="cursor-pointer text-sm font-medium">{t("missed")}</summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {DOMAINS.flatMap((d) => d.skills).map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-4" checked={skills.includes(s)} onChange={(e) => setSkills((x) => (e.target.checked ? [...x, s] : x.filter((y) => y !== s)))} />
              {tx(`skills.${s as "INFERENCES"}`)}
            </label>
          ))}
        </div>
      </details>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} {t("save")}
      </Button>
    </form>
  );
}

export function DeleteScoreButton({ id }: { id: string }) {
  const t = useTranslations("resources.log");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="icon"
      variant="ghost"
      className="size-7"
      aria-label={t("delete")}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await deleteOfficialScore(id);
          router.refresh();
        })
      }
    >
      <Trash2 aria-hidden />
    </Button>
  );
}
