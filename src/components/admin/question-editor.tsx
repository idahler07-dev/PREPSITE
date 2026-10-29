"use client";

import { useDeferredValue, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { DOMAINS, domainsForSection, getDomain, type SectionKey } from "@/lib/taxonomy";
import { renderMarkdown } from "@/lib/markdown/render";
import { computeContentFlags, isBlocking } from "@/lib/questions/flags";
import { CHOICE_KEYS, type ChoiceKey, type QuestionFormValues } from "@/lib/questions/schema";
import { saveQuestion, suggestCode } from "@/server/actions/admin/questions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichText } from "@/components/content/rich-text";
import { FlagList } from "./flag-badges";
import { cn } from "@/lib/utils";

export interface EditorQuestion {
  id?: string;
  version?: number;
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "RETIRED";
  flags?: string[];
  nearDuplicates?: { id: string; code: string; similarity: number }[];
  values: QuestionFormValues;
}

type FieldName = "passage" | "stem" | "explanation" | `choice.${ChoiceKey}`;

const emptyChoices = () => CHOICE_KEYS.map((key) => ({ key, text: "" }));

export function QuestionEditor({
  initial,
  sources,
  defaultPrefix,
  codeExample,
  stacked = false,
}: {
  initial: EditorQuestion;
  sources: { id: string; name: string }[];
  defaultPrefix: Record<SectionKey, string>;
  codeExample: string;
  /** Preview under the form instead of beside it (used next to the original PDF page). */
  stacked?: boolean;
}) {
  const t = useTranslations("admin.editor");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [v, setV] = useState<QuestionFormValues>(() => ({
    ...initial.values,
    choices: initial.values.choices?.length ? padChoices(initial.values.choices) : emptyChoices(),
  }));
  const [version, setVersion] = useState(initial.version);
  const [status, setStatus] = useState(initial.status ?? "DRAFT");
  const [savedFlags, setSavedFlags] = useState(initial.flags ?? []);
  const [prefix, setPrefix] = useState(defaultPrefix[(initial.values.section as SectionKey) ?? "MATH"]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dupes, setDupes] = useState<{ id: string; code: string; similarity: number }[]>(initial.nearDuplicates ?? []);
  const [uploading, setUploading] = useState(false);
  const textareas = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<FieldName>("stem");

  const set = <K extends keyof QuestionFormValues>(key: K, value: QuestionFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const section = v.section as SectionKey;
  const domains = domainsForSection(section);
  const skills = getDomain(v.domain)?.skills ?? [];
  const correct = useMemo(() => v.correctAnswers ?? [], [v.correctAnswers]);

  // Live flags from the current content (process flags come from the server).
  const liveFlags = useMemo(() => {
    const content = computeContentFlags({
      type: v.type,
      passage: v.passage,
      stem: v.stem ?? "",
      choices: v.type === "MCQ" ? (v.choices ?? []) : null,
      correctAnswers: correct,
      explanation: v.explanation,
    });
    const processFlags = savedFlags.filter((f) => !["MISSING_ANSWER", "UNCERTAIN_TEXT", "CHOICE_COUNT", "ANSWER_NOT_IN_CHOICES", "INVALID_SPR_ANSWER", "MISSING_FIGURE"].includes(f));
    return [...new Set([...content, ...processFlags])];
  }, [v, correct, savedFlags]);
  // Saving in the editor confirms the domain and skill, so that flag doesn't block the buttons here.
  const hasBlocking = liveFlags.some((f) => isBlocking(f) && f !== "TAXONOMY_UNCONFIRMED" && f !== "AI_UNREVIEWED");

  function changeSection(next: SectionKey) {
    const d = domainsForSection(next)[0]!;
    setV((prev) => ({ ...prev, section: next, domain: d.key, skill: d.skills[0]! }));
    setPrefix(defaultPrefix[next]);
  }
  function changeDomain(next: string) {
    const d = getDomain(next)!;
    setV((prev) => ({ ...prev, domain: next, skill: d.skills[0]! }));
  }

  function setChoiceText(key: ChoiceKey, text: string) {
    set(
      "choices",
      (v.choices ?? emptyChoices()).map((ch) => (ch.key === key ? { ...ch, text } : ch)),
    );
  }

  function fieldValue(field: FieldName): string {
    if (field.startsWith("choice.")) return v.choices?.find((ch) => ch.key === field.slice(7))?.text ?? "";
    return (v[field as "passage" | "stem" | "explanation"] as string | null | undefined) ?? "";
  }
  function setField(field: FieldName, value: string) {
    if (field.startsWith("choice.")) setChoiceText(field.slice(7) as ChoiceKey, value);
    else set(field as "passage" | "stem" | "explanation", value);
  }

  async function uploadImage(file: File) {
    const field = uploadTarget.current;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("alt", t("imageAlt"));
      const res = await fetch("/api/admin/assets", { method: "POST", body: form });
      if (!res.ok) throw new Error(String(res.status));
      const { markdown } = (await res.json()) as { markdown: string };
      const el = textareas.current[field];
      const current = fieldValue(field);
      const pos = el?.selectionStart ?? current.length;
      const insert = `${pos > 0 && current[pos - 1] !== "\n" ? "\n\n" : ""}${markdown}\n\n`;
      setField(field, current.slice(0, pos) + insert + current.slice(pos));
    } catch {
      toast.error(t("imageTooLarge"));
    } finally {
      setUploading(false);
    }
  }

  function pickImage(field: FieldName) {
    uploadTarget.current = field;
    fileInput.current?.click();
  }

  function requestCode() {
    startTransition(async () => {
      const res = await suggestCode(prefix, v.domain);
      if (res.ok) set("code", res.data);
      else toast.error(res.error === "INVALID_PREFIX" ? t("errors.INVALID_CODE") : c("unknownError"));
    });
  }

  function save(intent: "draft" | "review" | "publish" | "keep") {
    setErrors({});
    startTransition(async () => {
      const payload: QuestionFormValues = {
        ...v,
        choices: v.type === "MCQ" ? (v.choices ?? []).filter((ch) => ch.text.trim()) : null,
        tags: (v.tags ?? []).map((x) => x.trim()).filter(Boolean),
      };
      const res = await saveQuestion(payload, { id: initial.id, expectedVersion: version, intent });
      if (!res.ok) {
        if (res.error === "VALIDATION" && res.fieldErrors) {
          setErrors(res.fieldErrors);
          toast.error(c("unknownError"));
        } else if (res.error === "VERSION_CONFLICT") toast.error(t("versionConflict"));
        else if (res.error === "DUPLICATE_CODE") setErrors({ code: "DUPLICATE_CODE" });
        else if (res.error === "BLOCKING_FLAGS") toast.error(t("blockingFlags"));
        else toast.error(c("unknownError"));
        return;
      }
      const d = res.data;
      setVersion(d.version);
      setStatus(d.status);
      setSavedFlags(d.flags);
      setDupes(d.nearDuplicates);
      if (d.publishError) toast.error(t("blockingFlags"));
      else toast.success(initial.id ? t("updated") : t("created"));
      if (!initial.id) router.replace(`/admin/questions/${d.id}`);
      else router.refresh();
    });
  }

  const errorText = (key: string) => {
    const e = errors[key];
    if (!e) return null;
    if (e === "DUPLICATE_CODE") return t("duplicateCode");
    return ["INVALID_CODE", "REQUIRED", "INVALID_DOMAIN", "INVALID_SKILL"].includes(e) ? t(`errors.${e as "REQUIRED"}`) : e;
  };

  // Render the preview from a deferred copy so typing stays responsive.
  const deferred = useDeferredValue(v);
  const previewHtml = useMemo(
    () => ({
      passage: renderSafe(deferred.passage),
      stem: renderSafe(deferred.stem),
      explanation: renderSafe(deferred.explanation),
      choices: (deferred.choices ?? []).map((ch) => ({ key: ch.key, html: renderSafe(ch.text) })),
    }),
    [deferred],
  );

  const imageButton = (field: FieldName) => (
    <Button type="button" variant="ghost" size="sm" onClick={() => pickImage(field)} disabled={uploading}>
      {uploading && uploadTarget.current === field ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
      {t("insertImage")}
    </Button>
  );

  return (
    <div className={cn("grid gap-6", !stacked && "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void uploadImage(f);
        }}
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {t("metadata")}
              <Badge variant={status === "PUBLISHED" ? "default" : "secondary"}>{te(`status.${status}`)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="code">{t("code")}</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="code"
                  value={v.code ?? ""}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  className="w-56 font-mono"
                  aria-invalid={!!errors.code}
                  aria-describedby="code-help"
                />
                <Input
                  aria-label={t("codePrefix")}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  className="w-28 font-mono"
                />
                <Button type="button" variant="outline" onClick={requestCode} disabled={pending}>
                  <Sparkles aria-hidden /> {t("suggestCode")}
                </Button>
              </div>
              <p id="code-help" className="text-sm text-muted-foreground">
                {errorText("code") ? <span className="text-destructive">{errorText("code")}</span> : t("codeHelp", { example: codeExample })}
              </p>
            </div>
            <Field label={t("section")}>
              <Select value={section} onValueChange={(x) => changeSection(x as SectionKey)}>
                <SelectTrigger className="w-full" aria-label={t("section")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["RW", "MATH"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      {tx(`sections.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("difficulty")}>
              <Select value={v.difficulty} onValueChange={(x) => set("difficulty", x as "EASY")}>
                <SelectTrigger className="w-full" aria-label={t("difficulty")}>
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
            </Field>
            <Field label={t("domain")} error={errorText("domain")}>
              <Select value={v.domain} onValueChange={changeDomain}>
                <SelectTrigger className="w-full" aria-label={t("domain")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {tx(`domains.${d.key as (typeof DOMAINS)[number]["key"]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("skill")} error={errorText("skill")}>
              <Select value={v.skill} onValueChange={(x) => set("skill", x)}>
                <SelectTrigger className="w-full" aria-label={t("skill")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tx(`skills.${s as "INFERENCES"}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("type")}>
              <Select value={v.type} onValueChange={(x) => set("type", x as "MCQ")}>
                <SelectTrigger className="w-full" aria-label={t("type")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["MCQ", "SPR"] as const).map((x) => (
                    <SelectItem key={x} value={x}>
                      {te(`type.${x}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("source")}>
              <Select value={v.sourceId ?? "none"} onValueChange={(x) => set("sourceId", x === "none" ? null : x)}>
                <SelectTrigger className="w-full" aria-label={t("source")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noSource")}</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">{t("tags")}</Label>
              <Input
                id="tags"
                value={Array.isArray(v.tags) ? v.tags.join(", ") : (v.tags ?? "")}
                onChange={(e) => set("tags", splitTags(e.target.value, true))}
                aria-describedby="tags-help"
              />
              <p id="tags-help" className="text-sm text-muted-foreground">
                {t("tagsHelp")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("content")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <MarkdownField
              id="passage"
              label={`${t("passage")} (${c("optional")})`}
              help={t("passageHelp")}
              value={v.passage ?? ""}
              onChange={(x) => set("passage", x)}
              rows={6}
              refCb={(el) => (textareas.current.passage = el)}
              action={imageButton("passage")}
            />
            <MarkdownField
              id="stem"
              label={t("stem")}
              help={t("stemHelp")}
              value={v.stem ?? ""}
              onChange={(x) => set("stem", x)}
              rows={4}
              error={errorText("stem")}
              refCb={(el) => (textareas.current.stem = el)}
              action={imageButton("stem")}
            />
            {v.type === "MCQ" ? (
              <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-medium">{t("choices")}</legend>
                {CHOICE_KEYS.map((key) => {
                  const isCorrect = correct.includes(key);
                  return (
                    <div key={key} className="flex items-start gap-3">
                      <label className="mt-2 flex shrink-0 cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="correct"
                          checked={isCorrect}
                          onChange={() => set("correctAnswers", [key])}
                          aria-label={t("markCorrect", { key })}
                          className="size-4 accent-[var(--success)]"
                        />
                        <span className="w-4 font-semibold">{key}</span>
                      </label>
                      <Textarea
                        ref={(el) => {
                          textareas.current[`choice.${key}`] = el;
                        }}
                        value={v.choices?.find((ch) => ch.key === key)?.text ?? ""}
                        onChange={(e) => setChoiceText(key, e.target.value)}
                        rows={1}
                        aria-label={t("choice", { key })}
                        className={isCorrect ? "border-success" : ""}
                      />
                    </div>
                  );
                })}
              </fieldset>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="answers">{t("correctAnswers")}</Label>
                <Textarea
                  id="answers"
                  rows={3}
                  value={correct.join("\n")}
                  onChange={(e) => set("correctAnswers", e.target.value.split("\n"))}
                  onBlur={() => set("correctAnswers", correct.map((a) => a.trim()).filter(Boolean))}
                  className="font-mono"
                  aria-describedby="answers-help"
                />
                <p id="answers-help" className="text-sm text-muted-foreground">
                  {t("correctAnswersHelp")}
                </p>
              </div>
            )}
            <MarkdownField
              id="explanation"
              label={`${t("explanation")} (${c("optional")})`}
              value={v.explanation ?? ""}
              onChange={(x) => set("explanation", x)}
              rows={5}
              refCb={(el) => (textareas.current.explanation = el)}
              action={imageButton("explanation")}
            />
            {v.type === "MCQ" && (
              <details className="rounded-md border p-3">
                <summary className="cursor-pointer text-sm font-medium">{t("rationales")}</summary>
                <div className="mt-3 space-y-3">
                  {CHOICE_KEYS.filter((k) => !correct.includes(k)).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={`rationale-${key}`}>{t("rationale", { key })}</Label>
                      <Textarea
                        id={`rationale-${key}`}
                        rows={2}
                        value={v.wrongChoiceRationales?.[key] ?? ""}
                        onChange={(e) => set("wrongChoiceRationales", { ...(v.wrongChoiceRationales ?? {}), [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap gap-2 border-t bg-background/95 px-1 py-3 backdrop-blur">
          {initial.id && (
            <Button onClick={() => save("keep")} disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {t("saveChanges")}
            </Button>
          )}
          {status !== "PUBLISHED" && (
            <>
              {!initial.id && (
                <Button onClick={() => save("draft")} disabled={pending}>
                  {t("saveDraft")}
                </Button>
              )}
              <Button variant="secondary" onClick={() => save("review")} disabled={pending}>
                {t("submitForReview")}
              </Button>
              <Button variant="outline" onClick={() => save("publish")} disabled={pending || hasBlocking} title={hasBlocking ? t("blockingFlags") : undefined}>
                <CheckCircle2 aria-hidden /> {t("publish")}
              </Button>
            </>
          )}
          {initial.id && status === "PUBLISHED" && (
            <Button variant="outline" onClick={() => save("review")} disabled={pending}>
              {t("unpublish")}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {(liveFlags.length > 0 || dupes.length > 0) && (
          <Card className="border-warning/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-warning" aria-hidden /> {t("status")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FlagList flags={liveFlags} detailed />
              {dupes.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">{t("nearDuplicates")}</p>
                  <ul className="mt-1 space-y-1">
                    {dupes.map((d) => (
                      <li key={d.id}>
                        <a href={`./${d.id}`} className="font-mono text-primary hover:underline">
                          {d.code}
                        </a>{" "}
                        <span className="text-muted-foreground">({Math.round(d.similarity * 100)}%)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <Card className={cn(!stacked && "xl:sticky xl:top-20")}>
          <CardHeader>
            <CardTitle className="text-base">{t("studentView")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewHtml.passage && <RichText html={previewHtml.passage} className="passage rounded-md bg-muted/50 p-4" />}
            <RichText html={previewHtml.stem} />
            {v.type === "MCQ" ? (
              <ol className="space-y-2">
                {previewHtml.choices.map((ch) => (
                  <li
                    key={ch.key}
                    className={`flex items-start gap-3 rounded-md border p-3 ${correct.includes(ch.key) ? "border-success bg-success-muted" : ""}`}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border font-semibold">{ch.key}</span>
                    <RichText html={ch.html} className="pt-0.5" />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="font-mono text-sm">{correct.filter(Boolean).join(" · ")}</p>
            )}
            {previewHtml.explanation && (
              <div className="border-t pt-4">
                <h3 className="mb-2 text-sm font-semibold">{t("explanation")}</h3>
                <RichText html={previewHtml.explanation} className="text-sm" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function MarkdownField({
  id,
  label,
  help,
  value,
  onChange,
  rows,
  error,
  refCb,
  action,
}: {
  id: string;
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  error?: string | null;
  refCb: (el: HTMLTextAreaElement | null) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <Textarea
        id={id}
        ref={refCb}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
        aria-invalid={!!error}
        aria-describedby={help ? `${id}-help` : undefined}
      />
      {(help || error) && (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {error ? <span className="text-destructive">{error}</span> : help}
        </p>
      )}
    </div>
  );
}

function padChoices(choices: { key: string; text: string }[]) {
  return CHOICE_KEYS.map((key) => ({ key, text: choices.find((ch) => ch.key === key)?.text ?? "" }));
}

/** Split the tags input; keep a trailing empty tag while the user is typing ", ". */
function splitTags(s: string, keepTrailing = false): string[] {
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
  return keepTrailing && s.trimEnd().endsWith(",") ? [...parts, ""] : parts;
}

function renderSafe(md: string | null | undefined): string {
  try {
    return renderMarkdown(md ?? "");
  } catch {
    return "";
  }
}
