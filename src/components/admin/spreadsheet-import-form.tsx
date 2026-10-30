"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ImportErrorKey = "MISSING_COLUMNS" | "TOO_MANY_ROWS" | "UNSUPPORTED_FILE" | "FILE_TOO_LARGE" | "EMPTY_FILE" | "INVALID_PREFIX" | "SOURCE_REQUIRED" | "SOURCE_WITHDRAWN";

export function SpreadsheetImportForm({ sources, defaultPrefix }: { sources: { id: string; name: string }[]; defaultPrefix: string }) {
  const t = useTranslations("admin.import");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(sources.length ? "existing" : "new");
  const [sourceId, setSourceId] = useState<string>("");
  const [rights, setRights] = useState(false);
  const [section, setSection] = useState<string>("none");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!rights) return setError(t("rightsRequired"));
    if (!file) return setError(t("errors.UNSUPPORTED_FILE"));
    const form = new FormData(e.currentTarget);
    form.set("file", file);
    form.set("rights", "on");
    if (mode === "existing") form.set("sourceId", sourceId);
    else form.delete("sourceId");
    if (section !== "none") form.set("section", section);
    else form.delete("section");
    form.set("difficulty", difficulty);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/imports/spreadsheet", { method: "POST", body: form });
      const body = (await res.json()) as { batchId?: string; error?: string; message?: string };
      if (!res.ok || !body.batchId) {
        const key = body.error as ImportErrorKey | "RIGHTS_REQUIRED" | undefined;
        if (key === "RIGHTS_REQUIRED") setError(t("rightsRequired"));
        else if (key === "MISSING_COLUMNS") setError(t("errors.MISSING_COLUMNS", { columns: body.message ?? "" }));
        else if (key === "TOO_MANY_ROWS") setError(t("errors.TOO_MANY_ROWS", { max: body.message ?? "" }));
        else if (key && ["UNSUPPORTED_FILE", "FILE_TOO_LARGE", "EMPTY_FILE", "INVALID_PREFIX", "SOURCE_REQUIRED", "SOURCE_WITHDRAWN"].includes(key))
          setError(t(`errors.${key as ImportErrorKey}`));
        else setError(c("unknownError"));
        return;
      }
      router.push(`/admin/import/${body.batchId}`);
    } catch {
      toast.error(c("networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <fieldset className="space-y-3">
        <legend className="mb-2 font-medium">{t("source")}</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {sources.length > 0 && (
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === "existing"} onChange={() => setMode("existing")} className="size-4" />
              {t("existingSource")}
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === "new"} onChange={() => setMode("new")} className="size-4" />
            {t("newSource")}
          </label>
        </div>
        {mode === "existing" ? (
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger className="w-full sm:w-96" aria-label={t("chooseSource")}>
              <SelectValue placeholder={t("chooseSource")} />
            </SelectTrigger>
            <SelectContent>
              {sources.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sourceName">{t("sourceName")}</Label>
              <Input id="sourceName" name="sourceName" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceOwner">{t("owner")}</Label>
              <Input id="sourceOwner" name="sourceOwner" maxLength={120} />
            </div>
          </div>
        )}
      </fieldset>

      <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 size-4" aria-describedby="rights-note" />
        <span id="rights-note" className="font-medium">
          {t("rights")}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{t("defaultSection")}</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-full" aria-label={t("defaultSection")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("defaultSectionNone")}</SelectItem>
              <SelectItem value="RW">{tx("sections.RW")}</SelectItem>
              <SelectItem value="MATH">{tx("sections.MATH")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("defaultDifficulty")}</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full" aria-label={t("defaultDifficulty")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                <SelectItem key={d} value={d}>
                  {te(`difficulty.${d}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefix">{t("codePrefix")}</Label>
          <Input id="prefix" name="prefix" defaultValue={defaultPrefix} className="font-mono uppercase" maxLength={20} aria-describedby="prefix-help" />
        </div>
        <p id="prefix-help" className="text-sm text-muted-foreground sm:col-span-3">
          {t("codePrefixHelp")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">{t("file")}</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors",
            dragging ? "border-primary bg-primary-soft" : "border-input hover:bg-muted/50",
          )}
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet className="size-8 text-muted-foreground" aria-hidden />
          {file ? <span className="font-medium">{file.name}</span> : <span>{t("dropHere")}</span>}
          <span className="text-muted-foreground">{t("fileHelp")}</span>
          <input
            ref={fileRef}
            id="file"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-muted p-3 text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy || !rights || !file || (mode === "existing" && !sourceId)}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
        {busy ? t("analyzing") : t("analyze")}
      </Button>
    </form>
  );
}
