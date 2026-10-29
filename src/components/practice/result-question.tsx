"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/content/rich-text";
import { ChoiceList } from "@/components/test/choice-list";
import { ReportDialog } from "@/components/test/report-dialog";
import { Button } from "@/components/ui/button";
import { AiTutor } from "@/components/tutor/ai-tutor";

export function ResultQuestion({
  attemptId,
  questionId,
  type,
  passageHtml,
  stemHtml,
  choices,
  answer,
  correctAnswers,
  explanationHtml,
  rationaleHtml,
  aiEnabled = false,
}: {
  attemptId: string;
  questionId: string;
  type: "MCQ" | "SPR";
  passageHtml: string;
  stemHtml: string;
  choices: { key: string; html: string }[];
  answer: string | null;
  correctAnswers: string[];
  explanationHtml: string;
  rationaleHtml: string;
  aiEnabled?: boolean;
}) {
  const t = useTranslations("results");
  const tt = useTranslations("test");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronDown className={open ? "rotate-180" : ""} aria-hidden />
        {open ? t("hideQuestion") : t("showQuestion")}
      </Button>
      {open && (
        <div className="mt-3 space-y-4 rounded-lg border p-4">
          {passageHtml && <RichText html={passageHtml} className="passage rounded-md bg-muted/50 p-3" />}
          <RichText html={stemHtml} />
          {type === "MCQ" ? (
            <ChoiceList
              name={`r-${questionId}`}
              choices={choices}
              value={answer}
              eliminated={[]}
              eliminatorOn={false}
              disabled
              correctAnswers={correctAnswers}
              onSelect={() => {}}
              onToggleEliminate={() => {}}
            />
          ) : (
            <p className="text-sm">{tt("acceptedAnswers", { answers: correctAnswers.join(", ") })}</p>
          )}
          {rationaleHtml && <RichText html={rationaleHtml} className="text-sm" />}
          <div className="border-t pt-3">
            <h4 className="mb-1 text-sm font-semibold">{tt("explanation")}</h4>
            {explanationHtml ? <RichText html={explanationHtml} className="text-sm" /> : <p className="text-sm text-muted-foreground">{tt("noExplanation")}</p>}
          </div>
          {aiEnabled && (
            <AiTutor attemptId={attemptId} questionId={questionId} answered wrongChoice={type === "MCQ" && !!answer && !correctAnswers.includes(answer)} />
          )}
          <ReportDialog attemptId={attemptId} questionId={questionId} />
        </div>
      )}
    </div>
  );
}
