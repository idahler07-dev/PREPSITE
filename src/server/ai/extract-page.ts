import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import en from "../../../messages/en.json";
import { DOMAINS } from "@/lib/taxonomy";
import { pageExtractionJsonSchema, pageExtractionSchema, type PageExtraction } from "@/lib/import/pdf-schema";
import { anthropic, fallbackParams, logAiUsage, models } from "./client";

export class AiExtractionError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
  ) {
    super(message);
  }
}

const taxonomyList = DOMAINS.map(
  (d) =>
    `- ${d.key} (${en.taxonomy.domains[d.key]}, ${d.section === "RW" ? "Reading and Writing" : "Math"}): ${d.skills
      .map((s) => `${s} (${en.taxonomy.skills[s as keyof typeof en.taxonomy.skills]})`)
      .join("; ")}`,
).join("\n");

// Stable across calls so it can be cached.
const SYSTEM_PROMPT = `You transcribe pages of SAT-style practice booklets into structured data for a learning centre's own question bank. The centre wrote these materials or has permission to use them. Every question you produce is reviewed by a teacher before students see it, so accuracy matters more than completeness: never invent content.

Transcription rules:
1. Copy text exactly as printed. Do not correct, rewrite, simplify, summarize or translate anything. Keep spelling, punctuation, capitalization, line content and wording, including any mistakes.
2. Write all mathematics in LaTeX: inline as $...$, displayed as $$...$$ on its own line. Keep the math exactly as printed (same numbers, variables, operations and order). Write a literal dollar sign (money) as \\$.
3. When you are not sure about a character, word, number or symbol, write your best reading wrapped like [[?this]]. Use the marker every time you are unsure; never guess silently.
4. Return one entry per question. "number" is the printed question number as text. If the page begins with the rest of a question from the previous page (no number), return that part with number null and continuesFromPreviousPage true. If the last question on the page is cut off, set continuesOnNextPage true.
5. "passage" holds the reading text, notes or data the question refers to (for paired texts, label them **Text 1** and **Text 2** on their own lines). "stem" holds the question sentence itself. For math, put everything in "stem" and set passage to null unless there is a separate passage.
6. "choices" are the answer options A–D as printed, without the letter label. Use type "MCQ" when there are choices and "SPR" when the student writes in an answer.
7. Figures: for every graph, diagram, chart, table, map or picture that belongs to a question, add an entry to "figures" with its bounding box [left, top, right, bottom] as fractions of the page image (0 = left/top edge, 1 = right/bottom edge), the field it belongs to ("placement"), and a short neutral description to use as alt text. The box must contain only the figure (with its labels and caption), not the question text. Do not transcribe tables or figures as text; instead put the placeholder [[FIGURE n]] on its own line in the field where the figure appears, where n is the figure's position in that question's figures list, starting at 1.
8. "answer" and "explanation": only when printed on this page for that question; otherwise null.
9. Answer-key pages: put every entry in "answerKey" with the question number, the answer exactly as printed, the explanation if printed, and "part" set to the heading of the key section (for example "Module 1") or null. Set pageType to "answer_key". A page may contain both questions and key entries ("mixed").
10. Ignore page headers and footers, page numbers, general test directions, logos and copyright lines.
11. "suggestedDomain" and "suggestedSkill": choose the best fit for each question from the list below, within the section you are told. Use null if you cannot tell.
12. You may receive the PDF's text layer for the page. Use it for exact spelling and numbers and the image for layout, math, figures and anything missing from the text layer. If they disagree, follow the image and mark the uncertain part with [[?...]].

Domains and skills:
${taxonomyList}`;

export interface ExtractPageInput {
  png: Uint8Array;
  textLayer: string | null;
  role: "QUESTIONS" | "ANSWER_KEY";
  section: "RW" | "MATH" | null;
  pageNumber: number;
  pageCount: number;
  userId: string | null;
  pageId: string;
}

/** Read one page image (and its text layer) with Claude and return structured, validated data. */
export async function extractPageWithAi(input: ExtractPageInput): Promise<{ extraction: PageExtraction; model: string }> {
  const model = models().smart;
  const sectionName = input.section === "RW" ? "Reading and Writing" : input.section === "MATH" ? "Math" : "unknown (decide per question)";
  const context = [
    `Section: ${sectionName}.`,
    input.role === "ANSWER_KEY" ? "This page comes from the ANSWER KEY file." : "This page comes from a question booklet.",
    `Page ${input.pageNumber} of ${input.pageCount}.`,
    input.textLayer?.trim()
      ? `Text layer extracted from the PDF:\n<text_layer>\n${input.textLayer}\n</text_layer>`
      : "This page has no text layer (it is a scan); read everything from the image.",
  ].join("\n");

  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropic()
      .beta.messages.stream({
        model,
        max_tokens: 32000,
        ...fallbackParams(model),
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        output_config: { format: { type: "json_schema", schema: pageExtractionJsonSchema as unknown as Record<string, unknown> } },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: Buffer.from(input.png).toString("base64") } },
              { type: "text", text: context },
            ],
          },
        ],
      })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
      throw new AiExtractionError(`AI service unavailable: ${e.message}`, true);
    }
    if (e instanceof Anthropic.APIError) throw new AiExtractionError(`AI request failed (${e.status}): ${e.message}`, false);
    throw e;
  }

  await logAiUsage({ userId: input.userId, feature: "pdf_extract", model: response.model, usage: response.usage, refId: input.pageId });

  if (response.stop_reason === "refusal") throw new AiExtractionError("The AI declined to read this page.", false);
  if (response.stop_reason === "max_tokens") throw new AiExtractionError("The page was too long to read in one pass.", true);

  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  if (!text) throw new AiExtractionError("The AI returned no data.", true);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiExtractionError("The AI returned malformed data.", true);
  }
  const parsed = pageExtractionSchema.safeParse(json);
  if (!parsed.success) throw new AiExtractionError(`The AI returned unexpected data: ${parsed.error.issues[0]?.message ?? ""}`, true);
  return { extraction: parsed.data, model: response.model };
}
