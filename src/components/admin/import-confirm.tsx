"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { commitImport } from "@/server/actions/admin/imports";

export function ImportConfirm({ batchId, count }: { batchId: string; count: number }) {
  const t = useTranslations("admin.import");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending || count === 0}
      onClick={() =>
        start(async () => {
          const res = await commitImport(batchId);
          if (res.ok) {
            toast.success(t("done", { count: res.created }));
            router.push(`/manage/review?batch=${batchId}`);
          } else {
            toast.error(res.error === "SOURCE_WITHDRAWN" ? t("errors.SOURCE_WITHDRAWN") : c("unknownError"));
            router.refresh();
          }
        })
      }
    >
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending ? t("importing") : t("confirm", { count })}
    </Button>
  );
}
