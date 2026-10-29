"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { changeMockStatus, createMockTest, deleteMockTest } from "@/server/actions/admin/mocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewMockForm() {
  const t = useTranslations("admin.mocks");
  const tx = useTranslations("taxonomy");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<("RW" | "MATH")[]>(["RW", "MATH"]);
  return (
    <form
      className="flex flex-wrap items-end gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createMockTest({ title, sections });
          if (res.ok) router.push(`/admin/mocks/${res.data.id}`);
          else toast.error(t("errors.create"));
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="mock-title">{t("titleLabel")}</Label>
        <Input id="mock-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} className="w-72" placeholder={t("titlePlaceholder")} />
      </div>
      <fieldset className="flex gap-3">
        <legend className="mb-2 text-sm font-medium">{t("sections")}</legend>
        {(["RW", "MATH"] as const).map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={sections.includes(s)}
              onChange={(e) => setSections((prev) => (e.target.checked ? [...prev, s] : prev.filter((x) => x !== s)))}
            />
            {tx(`sections.${s}`)}
          </label>
        ))}
      </fieldset>
      <Button type="submit" disabled={pending || !title.trim() || sections.length === 0}>
        {pending && <Loader2 className="animate-spin" aria-hidden />} {t("create")}
      </Button>
    </form>
  );
}

export function MockStatusActions({ id, status, canPublish, canDelete }: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; canPublish: boolean; canDelete: boolean }) {
  const t = useTranslations("admin.mocks");
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(t(`errors.${res.error === "MOCK_INCOMPLETE" || res.error === "IN_USE" ? res.error : "other"}`));
      else (after ?? router.refresh)();
    });
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "PUBLISHED" && (
        <Button disabled={pending || !canPublish} onClick={() => act(() => changeMockStatus(id, "PUBLISHED"))}>
          {t("publish")}
        </Button>
      )}
      {status === "PUBLISHED" && (
        <Button variant="outline" disabled={pending} onClick={() => act(() => changeMockStatus(id, "ARCHIVED"))}>
          {t("archive")}
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" disabled={pending} onClick={() => act(() => deleteMockTest(id), () => router.push("/admin/mocks"))}>
          {t("delete")}
        </Button>
      )}
    </div>
  );
}
