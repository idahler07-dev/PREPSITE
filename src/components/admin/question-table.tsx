"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlagList } from "./flag-badges";

export interface QuestionRow {
  id: string;
  code: string;
  section: "RW" | "MATH";
  domain: string;
  skill: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "MCQ" | "SPR";
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "RETIRED";
  flags: string[];
  isSample: boolean;
  updatedAt: string;
  stem: string;
}

export function QuestionTable({
  rows,
  selectable = false,
  selected = [],
  onSelectedChange,
}: {
  rows: QuestionRow[];
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
}) {
  const t = useTranslations("admin.questions");
  const tr = useTranslations("admin.review");
  const tx = useTranslations("taxonomy");
  const te = useTranslations("enums");
  const c = useTranslations("common");
  const format = useFormatter();

  if (rows.length === 0) return <p className="rounded-md border p-8 text-center text-muted-foreground">{t("empty")}</p>;
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggle = (id: string, on: boolean) => onSelectedChange?.(on ? [...new Set([...selected, id])] : selected.filter((x) => x !== id));

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(on) => onSelectedChange?.(on ? rows.map((r) => r.id) : [])}
                  aria-label={tr("selectAll")}
                />
              </TableHead>
            )}
            <TableHead>{t("columns.code")}</TableHead>
            <TableHead className="min-w-64">{t("columns.skill")}</TableHead>
            <TableHead>{t("columns.difficulty")}</TableHead>
            <TableHead>{t("columns.type")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.flags")}</TableHead>
            <TableHead>{t("columns.updated")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} data-state={selected.includes(r.id) ? "selected" : undefined}>
              {selectable && (
                <TableCell>
                  <Checkbox checked={selected.includes(r.id)} onCheckedChange={(on) => toggle(r.id, !!on)} aria-label={tr("selectRow", { code: r.code })} />
                </TableCell>
              )}
              <TableCell className="font-mono text-sm whitespace-nowrap">
                <Link href={`/manage/questions/${r.id}`} className="text-primary hover:underline">
                  {r.code}
                </Link>
                {r.isSample && (
                  <Badge variant="outline" className="ms-2" title={c("sampleHint")}>
                    {c("sample")}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">{tx(`skills.${r.skill as "INFERENCES"}`)}</div>
                <div className="line-clamp-1 max-w-md text-xs text-muted-foreground">{r.stem}</div>
              </TableCell>
              <TableCell>{te(`difficulty.${r.difficulty}`)}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>
                <Badge variant={r.status === "PUBLISHED" ? "default" : r.status === "RETIRED" ? "outline" : "secondary"}>{te(`status.${r.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <FlagList flags={r.flags} />
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{format.dateTime(new Date(r.updatedAt), { dateStyle: "medium" })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
