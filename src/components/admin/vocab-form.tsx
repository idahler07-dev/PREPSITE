"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { saveVocabWord, setVocabPublished } from "@/server/actions/admin/vocab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Values = { word: string; partOfSpeech: string; definition: string; example: string; uz: string; ru: string; published: boolean };
const EMPTY: Values = { word: "", partOfSpeech: "", definition: "", example: "", uz: "", ru: "", published: true };

export function VocabForm({ id, initial = EMPTY }: { id: string | null; initial?: Values }) {
  const t = useTranslations("admin.vocab");
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const field = (k: keyof Values) => ({
    id: `v-${k}`,
    value: String(v[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value })),
  });
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveVocabWord(id, v);
          if (res.ok) {
            toast.success(t("saved"));
            if (!id) setV(EMPTY);
            router.push("/admin/vocab");
            router.refresh();
          } else toast.error(res.error === "DUPLICATE" ? t("duplicate") : t("invalid"));
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="v-word">{t("word")}</Label>
        <Input {...field("word")} required maxLength={60} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="v-partOfSpeech">{t("partOfSpeech")}</Label>
        <Input {...field("partOfSpeech")} required maxLength={30} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="v-definition">{t("definition")}</Label>
        <Input {...field("definition")} required maxLength={400} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="v-example">{t("example")}</Label>
        <Textarea {...field("example")} required maxLength={600} rows={2} />
        <p className="text-xs text-muted-foreground">{t("exampleHelp")}</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="v-uz">{t("uz")}</Label>
        <Input {...field("uz")} maxLength={200} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="v-ru">{t("ru")}</Label>
        <Input {...field("ru")} maxLength={200} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" aria-hidden />} {t("save")}
        </Button>
      </div>
    </form>
  );
}

export function VocabPublishToggle({ id, published }: { id: string; published: boolean }) {
  const t = useTranslations("admin.vocab");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setVocabPublished(id, !published);
          router.refresh();
        })
      }
    >
      {published ? t("hide") : t("show")}
    </Button>
  );
}
