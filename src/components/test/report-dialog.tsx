"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { submitQuestionReport } from "@/server/actions/practice";

const REASONS = ["WRONG_ANSWER", "TYPO", "UNCLEAR", "FIGURE", "OTHER"] as const;

export function ReportDialog({ attemptId, questionId }: { attemptId: string; questionId: string }) {
  const t = useTranslations("results.report");
  const c = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("WRONG_ANSWER");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Flag aria-hidden /> {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">{t("reason")}</legend>
          {REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="size-4" />
              {t(`reasons.${r}`)}
            </label>
          ))}
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="report-msg">{t("message")}</Label>
          <Textarea id="report-msg" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {c("cancel")}
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await submitQuestionReport({ attemptId, questionId, reason, message });
                if (!res.ok) toast.error(c("unknownError"));
                else {
                  toast.success(res.already ? t("already") : t("thanks"));
                  setOpen(false);
                  setMessage("");
                }
              })
            }
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
