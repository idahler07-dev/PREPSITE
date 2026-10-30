"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveName, type FormState } from "@/server/actions/profile";

export function NameForm({ name }: { name: string }) {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const [state, action, pending] = useActionState<FormState, FormData>(saveName, {});
  useEffect(() => {
    if (state.ok) toast.success(t("saved"));
  }, [state, t]);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1 space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" defaultValue={name} maxLength={80} autoComplete="name" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {c("save")}
      </Button>
    </form>
  );
}
