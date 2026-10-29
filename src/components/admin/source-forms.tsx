"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createSourceAction, withdrawSourceAction, type SourceFormState } from "@/server/actions/admin/sources";

export function NewSourceForm() {
  const t = useTranslations("admin.sources");
  const c = useTranslations("common");
  const [state, action, pending] = useActionState<SourceFormState, FormData>(createSourceAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [rights, setRights] = useState(false);
  useEffect(() => {
    if (state.ok) {
      toast.success(t("created"));
      formRef.current?.reset();
      setRights(false);
    }
  }, [state, t]);
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="src-name">{t("name")}</Label>
        <Input id="src-name" name="name" required minLength={2} maxLength={120} placeholder={t("namePlaceholder")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="src-owner">{t("owner")}</Label>
        <Input id="src-owner" name="owner" required minLength={2} maxLength={120} placeholder={t("ownerPlaceholder")} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="src-notes">
          {t("notes")} ({c("optional")})
        </Label>
        <Textarea id="src-notes" name="notes" rows={2} maxLength={2000} />
      </div>
      <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm sm:col-span-2">
        <input type="checkbox" name="rights" required checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 size-4" />
        <span className="font-medium">{t("rightsStatement")}</span>
      </label>
      {state.error === "RIGHTS" && <p className="text-sm text-destructive sm:col-span-2">{t("rightsRequired")}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending || !rights}>
          {t("new")}
        </Button>
      </div>
    </form>
  );
}

export function WithdrawButton({ sourceId, fileId, name }: { sourceId: string; fileId?: string; name: string }) {
  const t = useTranslations("admin.sources");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={fileId ? "ghost" : "destructive"} size="sm" disabled={pending}>
          {fileId ? t("withdrawFile") : t("withdraw")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("withdrawConfirmTitle", { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("withdrawConfirmBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              start(async () => {
                const { count } = await withdrawSourceAction(sourceId, fileId);
                toast.success(t("withdrawDone", { count }));
                router.refresh();
              })
            }
          >
            {c("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
