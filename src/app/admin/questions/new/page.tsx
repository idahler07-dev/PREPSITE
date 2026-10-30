import { getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { DOMAINS } from "@/lib/taxonomy";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionEditor } from "@/components/admin/question-editor";
import { codeExample } from "@/server/questions/code-example";

export default async function NewQuestionPage() {
  const t = await getTranslations("admin.editor");
  const sources = await db.source.findMany({ where: { withdrawnAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } });
  const first = DOMAINS.find((d) => d.section === "MATH")!;
  return (
    <div>
      <PageHeader title={t("newTitle")} />
      <QuestionEditor
        sources={sources}
        defaultPrefix={siteConfig.questionCodes.defaultPrefix}
        codeExample={codeExample()}
        initial={{
          values: {
            code: "",
            section: "MATH",
            domain: first.key,
            skill: first.skills[0],
            difficulty: "MEDIUM",
            type: "MCQ",
            passage: "",
            stem: "",
            choices: [],
            correctAnswers: [],
            explanation: "",
            tags: [],
            sourceId: null,
          },
        }}
      />
    </div>
  );
}
