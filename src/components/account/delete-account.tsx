"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/server/actions/profile";

export function DeleteAccount() {
  const t = useTranslations("settings");
  const c = useTranslations("common");
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const word = t("deleteConfirmWord");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{t("deleteButton")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteConfirmBody")}</AlertDialogDescription>
        </AlertDialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} aria-label={t("deleteConfirmBody")} autoComplete="off" />
        <AlertDialogFooter>
          <AlertDialogCancel>{c("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={value.trim() !== word || pending}
            onClick={() => start(async () => void (await deleteAccount("DELETE")))}
          >
            {t("deleteConfirmButton")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
