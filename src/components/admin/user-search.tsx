"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UserSearch({ initial }: { initial: string }) {
  const t = useTranslations("admin.users");
  const c = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initial);
  return (
    <form
      role="search"
      className="mb-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `${pathname}?q=${encodeURIComponent(q.trim())}` : pathname);
      }}
    >
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={c("search")} className="max-w-sm" />
      <Button type="submit" variant="secondary">
        <Search aria-hidden /> {c("search")}
      </Button>
    </form>
  );
}
