"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, KeyRound, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ApiError = { error?: string; message?: string };
type Upload = { fileId: string; name: string; url: string; direct: boolean };

const KNOWN_ERRORS = ["RIGHTS_REQUIRED", "SOURCE_REQUIRED", "SOURCE_WITHDRAWN", "INVALID_PREFIX", "FILE_TOO_LARGE", "UNSUPPORTED_FILE", "NO_QUESTION_FILE", "UPLOAD_INCOMPLETE"] as const;

/** PUT a file with upload progress (fetch has no upload progress events). */
function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

export function PdfImportForm({ sources, defaultPrefix, aiEnabled }: { sources: { id: string; name: string }[]; defaultPrefix: Record<"RW" | "MATH", string>; aiEnabled: boolean }) {
  const t = useTranslations("admin.import");
  const tp = useTranslations("admin.import.pdf");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(sources.length ? "existing" : "new");
  const [sourceId, setSourceId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceOwner, setSourceOwner] = useState("");
  const [rights, setRights] = useState(false);
  const [section, setSection] = useState<"RW" | "MATH">("MATH");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [prefix, setPrefix] = useState(defaultPrefix.MATH);
  const [files, setFiles] = useState<File[]>([]);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | File[]) => {
    const pdfs = [...list].filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length < [...list].length) setError(tp("errors.NOT_PDF"));
    setFiles((prev) => [...prev, ...pdfs.filter((p) => !prev.some((x) => x.name === p.name && x.size === p.size))]);
  };

  const explain = (body: ApiError) => {
    const code = body.error as (typeof KNOWN_ERRORS)[number] | undefined;
    if (code === "RIGHTS_REQUIRED") return t("rightsRequired");
    if (code === "NO_QUESTION_FILE" || code === "UPLOAD_INCOMPLETE") return tp(`errors.${code}`);
    if (code && (KNOWN_ERRORS as readonly string[]).includes(code)) return t(`errors.${code as "SOURCE_REQUIRED"}`);
    return c("unknownError");
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!rights) return setError(t("rightsRequired"));
    if (!files.length) return setError(tp("errors.NO_QUESTION_FILE"));
    setBusy(true);
    try {
      const res = await fetch("/api/admin/imports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(mode === "existing" ? { sourceId } : { sourceName, sourceOwner }),
          rights: true,
          section,
          difficulty,
          prefix,
          files: [
            ...files.map((f) => ({ name: f.name, size: f.size, role: "QUESTIONS" })),
            ...(keyFile ? [{ name: keyFile.name, size: keyFile.size, role: "ANSWER_KEY" }] : []),
          ],
        }),
      });
      const body = (await res.json()) as { batchId?: string; uploads?: Upload[] } & ApiError;
      if (!res.ok || !body.batchId || !body.uploads) return setError(explain(body));

      const all = [...files, ...(keyFile ? [keyFile] : [])];
      for (const [i, up] of body.uploads.entries()) {
        const file = all[i]!;
        try {
          await putFile(up.url, file, (pct) => setStatus(tp("uploading", { name: file.name, percent: pct })));
        } catch {
          return setError(tp("errors.UPLOAD_FAILED", { name: file.name }));
        }
      }
      setStatus(tp("starting"));
      const start = await fetch(`/api/admin/imports/${body.batchId}/start`, { method: "POST" });
      if (!start.ok) return setError(explain((await start.json()) as ApiError));
      router.push(`/admin/import/${body.batchId}`);
    } catch {
      setError(c("networkError"));
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <p className="text-sm text-muted-foreground">{tp("intro")}</p>
      <p className={cn("rounded-md border p-3 text-sm", aiEnabled ? "border-success/50 bg-success-muted" : "border-warning/50 bg-warning-muted")}>
        {aiEnabled ? tp("aiOn") : tp("aiOff")}
      </p>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-medium">{t("source")}</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          {sources.length > 0 && (
            <label className="flex items-center gap-2">
              <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} className="size-4" />
              {t("existingSource")}
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} className="size-4" />
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
              <Label htmlFor="pdf-source-name">{t("sourceName")}</Label>
              <Input id="pdf-source-name" value={sourceName} onChange={(e) => setSourceName(e.target.value)} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdf-source-owner">{t("owner")}</Label>
              <Input id="pdf-source-owner" value={sourceOwner} onChange={(e) => setSourceOwner(e.target.value)} maxLength={120} />
            </div>
          </div>
        )}
      </fieldset>

      <label className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 text-sm">
        <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 size-4" />
        <span className="font-medium">{t("rights")}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{tp("section")}</Label>
          <Select
            value={section}
            onValueChange={(v) => {
              setSection(v as "RW");
              setPrefix(defaultPrefix[v as "RW"]);
            }}
          >
            <SelectTrigger className="w-full" aria-label={tp("section")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
          <Label htmlFor="pdf-prefix">{t("codePrefix")}</Label>
          <Input id="pdf-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} className="font-mono" maxLength={20} />
        </div>
        <p className="text-sm text-muted-foreground sm:col-span-3">{t("codePrefixHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf-files">{tp("questionFiles")}</Label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm transition-colors",
            dragging ? "border-primary bg-primary-soft" : "border-input hover:bg-muted/50",
          )}
        >
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <span>{tp("dropHere")}</span>
          <span className="text-muted-foreground">{tp("questionFilesHelp")}</span>
          <input
            ref={fileRef}
            id="pdf-files"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {files.length > 0 && (
          <ul className="divide-y rounded-md border text-sm">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate font-mono">{f.name}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {c("sizeMb", { value: (f.size / 1024 / 1024).toFixed(1) })}
                  <Button type="button" variant="ghost" size="icon" aria-label={tp("remove", { name: f.name })} onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}>
                    <X aria-hidden />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf-key">{tp("answerKey")}</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => keyRef.current?.click()}>
            <KeyRound aria-hidden /> {tp("chooseKey")}
          </Button>
          {keyFile && (
            <span className="flex items-center gap-1 font-mono text-sm">
              {keyFile.name}
              <Button type="button" variant="ghost" size="icon" aria-label={tp("remove", { name: keyFile.name })} onClick={() => setKeyFile(null)}>
                <X aria-hidden />
              </Button>
            </span>
          )}
          <input
            ref={keyRef}
            id="pdf-key"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setKeyFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{tp("answerKeyHelp")}</p>
      </div>

      <details className="rounded-md border p-3 text-sm">
        <summary className="cursor-pointer font-medium">{tp("tipsTitle")}</summary>
        <p className="mt-2 text-muted-foreground">{tp("tips")}</p>
      </details>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-danger-muted p-3 text-sm">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}

      <Button type="submit" disabled={busy || !rights || !files.length || (mode === "existing" && !sourceId)}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
        {tp("submit")}
      </Button>
    </form>
  );
}
