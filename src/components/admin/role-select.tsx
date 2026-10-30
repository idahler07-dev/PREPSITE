"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRole } from "@/server/actions/admin/users";

export function RoleSelect({ userId, role, disabled, label }: { userId: string; role: "STUDENT" | "EDITOR" | "ADMIN"; disabled?: boolean; label: string }) {
  const t = useTranslations("admin.users");
  const te = useTranslations("enums.role");
  const [pending, start] = useTransition();
  return (
    <Select
      value={role}
      disabled={disabled || pending}
      onValueChange={(r) =>
        start(async () => {
          const res = await setUserRole(userId, r as "STUDENT");
          if (res.ok) toast.success(t("roleChanged"));
          else toast.error(res.error === "OWN_ROLE" ? t("cannotChangeOwnRole") : res.error);
        })
      }
    >
      <SelectTrigger size="sm" className="w-32" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["STUDENT", "EDITOR", "ADMIN"] as const).map((r) => (
          <SelectItem key={r} value={r}>
            {te(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
