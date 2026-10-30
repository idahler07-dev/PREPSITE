import "server-only";
import { z } from "zod";
import siteConfig from "@site";
import en from "../../../messages/en.json";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { aiLimits, type AiTier } from "@/config/ai-limits";
import { ENABLED_LOCALES, LOCALE_ENGLISH_NAMES } from "@/i18n/locales";
import { splitVerdict } from "@/lib/ai/verdict";
import { startOfDayInZone } from "@/lib/stats/streak";
import { HttpError } from "@/server/http";
import { getEntitlement } from "@/server/billing/entitlement";
import type { CurrentUser } from "@/server/auth/session";
import { IMAGE_TYPES, storage } from "@/server/storage";
import { aiAvailable, logAiUsage, models } from "./client";
import { streamText, type TextContent } from "./stream-text";
import { questionContext, TUTOR_MODES, TUTOR_SYSTEM_PROMPT, type TutorMode, type TutorQuestion } from "./tutor-prompt";

export const TUTOR_FEATURES = ["tutor", "tutor_chat"] as const;
const MAX_TOKENS = 16_000; // includes the model's thinking

export const tutorRequestSchema = z.object({
  attemptId: z.string().max(40),
  questionId: z.string().max(40),
  mode: z.enum(TUTOR_MODES),
  locale: z.enum(ENABLED_LOCALES),
});

export const chatRequestSchema = z.object({
  attemptId: z.string().max(40),
  questionId: z.string().max(40),
  /** The explanation the student is asking about (it opens the conversation). */
  mode: z.enum(TUTOR_MODES),
  locale: z.enum(ENABLED_LOCALES),
  message: z.string().trim().min(1).max(aiLimits.chatMessageMaxChars),
});

export type TutorEvent =
  | { type: "start"; cached: boolean }
  | { type: "delta"; text: string }
  | { type: "flagged" }
  | { type: "done"; remaining: number | null }
  | { type: "error"; code: string };

const skillNames = en.taxonomy.skills as Record<string, string>;

// ─── Access and limits ───────────────────────────────────────────────────────

/**
 * The student must have this question in one of their own attempts. Anything
 * beyond a hint needs the answer to be graded first, so tests never leak
 * answers; hints are only for drills that check answers as you go.
 */
async function loadAccess(userId: string, attemptId: string, questionId: string, mode: TutorMode | "followup") {
  const r = await db.response.findFirst({
    where: { questionId, module: { attemptId, attempt: { userId } } },
    include: {
      module: { select: { attempt: { select: { status: true, feedbackMode: true } } } },
      question: {
        select: {
          id: true,
          version: true,
          section: true,
          skill: true,
          type: true,
          passage: true,
          stem: true,
          choices: true,
          correctAnswers: true,
          explanation: true,
          flags: true,
          assets: { select: { id: true, storageKey: true, mimeType: true } },
        },
      },
    },
  });
  if (!r) throw new HttpError(404, "NOT_FOUND");
  const answered = !!r.gradedAt;
  if (mode === "hint") {
    const drillInProgress = r.module.attempt.status === "IN_PROGRESS" && r.module.attempt.feedbackMode === "IMMEDIATE";
    if (!answered && !drillInProgress) throw new HttpError(403, "HINTS_NOT_ALLOWED");
  } else if (!answered) {
    throw new HttpError(403, "NOT_YET_ANSWERED");
  }
  if (mode === "whyWrong" && (r.question.type !== "MCQ" || !r.answer || r.isCorrect)) throw new HttpError(400, "NOT_A_WRONG_CHOICE");
  return { response: r, question: r.question, answered };
}

export async function tierOf(user: Pick<CurrentUser, "id" | "role">): Promise<AiTier> {
  if (user.role === "EDITOR" || user.role === "ADMIN") return "staff";
  return (await getEntitlement(user.id)).premium ? "premium" : "free";
}

/** New AI answers left today (cached answers don't count). */
export async function remainingToday(user: Pick<CurrentUser, "id" | "role">): Promise<number> {
  const limit = aiLimits.tutorPerDay[await tierOf(user)];
  const used = await db.aiUsage.count({
    where: { userId: user.id, feature: { in: [...TUTOR_FEATURES] }, createdAt: { gte: startOfDayInZone(new Date(), siteConfig.defaultTimeZone) } },
  });
  return Math.max(0, limit - used);
}

async function requireQuota(user: Pick<CurrentUser, "id" | "role">) {
  if (!aiAvailable()) throw new HttpError(503, "AI_UNAVAILABLE");
  if ((await remainingToday(user)) <= 0) throw new HttpError(429, "QUOTA_EXCEEDED");
}

// ─── Building the request ────────────────────────────────────────────────────

type LoadedQuestion = Awaited<ReturnType<typeof loadAccess>>["question"];

function toTutorQuestion(q: LoadedQuestion): TutorQuestion {
  return {
    section: q.section,
    skillName: skillNames[q.skill] ?? q.skill,
    type: q.type,
    passage: q.passage,
    stem: q.stem,
    choices: (q.choices as { key: string; text: string }[] | null) ?? [],
    correctAnswers: q.correctAnswers,
    explanation: q.explanation,
  };
}

/** Figures referenced in the question, in the order they appear, as image blocks. */
async function figureBlocks(q: LoadedQuestion): Promise<TextContent[]> {
  const text = [q.passage ?? "", q.stem, ...((q.choices as { text: string }[] | null) ?? []).map((c) => c.text), q.explanation ?? ""].join("\n");
  const ids = [...text.matchAll(/!\[[^\]]*\]\(asset:([^)]+)\)/g)].map((m) => m[1]!);
  const blocks: TextContent[] = [];
  for (const id of ids.slice(0, 4)) {
    const asset = q.assets.find((a) => a.id === id);
    if (!asset || !(asset.mimeType in IMAGE_TYPES) || asset.mimeType === "image/gif") continue;
    const bytes = await storage().get(asset.storageKey);
    if (!bytes) continue;
    blocks.push({ type: "image", source: { type: "base64", media_type: asset.mimeType as "image/png", data: Buffer.from(bytes).toString("base64") } });
  }
  return blocks;
}

async function firstUserMessage(q: LoadedQuestion, ctx: Parameters<typeof questionContext>[1]): Promise<TextContent[]> {
  return [...(await figureBlocks(q)), { type: "text", text: questionContext(toTutorQuestion(q), ctx) }];
}

// ─── Streaming ───────────────────────────────────────────────────────────────

const encoder = new TextEncoder();
const line = (e: TutorEvent) => encoder.encode(`${JSON.stringify(e)}\n`);

/** Mark a question for staff when the AI thinks its key is wrong. Never changes what students see. */
async function recordDispute(questionId: string) {
  const q = await db.question.findUnique({ where: { id: questionId }, select: { flags: true } });
  if (q && !q.flags.includes("AI_KEY_DISPUTE")) {
    await db.question.update({ where: { id: questionId }, data: { flags: [...q.flags, "AI_KEY_DISPUTE"].sort() } });
  }
}

/**
 * Run one model call and stream it as NDJSON events. The verdict line is
 * held back; on DISAGREE the reply is dropped and the question flagged.
 */
function streamReply(opts: {
  user: Pick<CurrentUser, "id" | "role">;
  feature: (typeof TUTOR_FEATURES)[number];
  questionId: string;
  messages: { role: "user" | "assistant"; content: string | TextContent[] }[];
  onFinish: (result: { verdict: "AGREE" | "DISAGREE"; reason: string; text: string; model: string }) => Promise<void>;
}): ReadableStream<Uint8Array> {
  const model = models().smart;
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(line({ type: "start", cached: false }));
      const call = streamText({ model, system: TUTOR_SYSTEM_PROMPT, messages: opts.messages, maxTokens: MAX_TOKENS });
      let buffer = "";
      let verdict: ReturnType<typeof splitVerdict> = null;
      let text = "";
      try {
        for await (const chunk of call.text) {
          if (!verdict) {
            buffer += chunk;
            verdict = splitVerdict(buffer);
            if (!verdict) continue;
            if (verdict.verdict === "DISAGREE") {
              call.abort();
              break;
            }
            text = verdict.rest;
            if (text) controller.enqueue(line({ type: "delta", text }));
            continue;
          }
          text += chunk;
          controller.enqueue(line({ type: "delta", text: chunk }));
        }
        verdict ??= splitVerdict(buffer, true)!;
        if (verdict.verdict === "DISAGREE") {
          await recordDispute(opts.questionId);
          await opts.onFinish({ verdict: "DISAGREE", reason: verdict.reason, text: "", model });
          controller.enqueue(line({ type: "flagged" }));
        } else {
          const done = await call.done;
          await logAiUsage({ userId: opts.user.id, feature: opts.feature, model: done.model, usage: done.usage, refId: opts.questionId });
          if (done.stopReason === "refusal" || !text.trim()) {
            controller.enqueue(line({ type: "error", code: "NO_ANSWER" }));
          } else {
            await opts.onFinish({ verdict: "AGREE", reason: "", text: text.trim(), model: done.model });
          }
        }
        controller.enqueue(line({ type: "done", remaining: await remainingToday(opts.user) }));
      } catch (e) {
        console.error("[tutor]", e);
        controller.enqueue(line({ type: "error", code: "AI_FAILED" }));
      } finally {
        controller.close();
      }
    },
  });
}

function cachedStream(events: TutorEvent[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const e of events) controller.enqueue(line(e));
      controller.close();
    },
  });
}

/** Explanation, hint or another way of solving: cached per question version, language, mode and (why-wrong) choice. */
export async function tutorStream(user: CurrentUser, raw: unknown): Promise<ReadableStream<Uint8Array>> {
  const input = tutorRequestSchema.parse(raw);
  const { response, question, answered } = await loadAccess(user.id, input.attemptId, input.questionId, input.mode);
  const choice = input.mode === "whyWrong" ? (response.answer ?? "").toUpperCase() : "";
  const key = { questionId: question.id, questionVersion: question.version, locale: input.locale, mode: input.mode, choice };

  const cached = await db.aiExplanation.findUnique({ where: { questionId_questionVersion_locale_mode_choice: key } });
  if (cached) {
    return cachedStream([
      { type: "start", cached: true },
      cached.verdict === "AGREE" ? { type: "delta", text: cached.content } : { type: "flagged" },
      { type: "done", remaining: null },
    ]);
  }

  await requireQuota(user);
  const content = await firstUserMessage(question, {
    mode: input.mode,
    studentAnswer: response.answer,
    isCorrect: response.isCorrect,
    answered,
    language: LOCALE_ENGLISH_NAMES[input.locale],
  });
  return streamReply({
    user,
    feature: "tutor",
    questionId: question.id,
    messages: [{ role: "user", content }],
    onFinish: async (r) => {
      await db.aiExplanation.upsert({
        where: { questionId_questionVersion_locale_mode_choice: key },
        create: { ...key, verdict: r.verdict, content: r.verdict === "AGREE" ? r.text : r.reason, model: r.model },
        update: {},
      });
    },
  });
}

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Follow-up questions about one question, after an explanation (or hint) was shown. */
export async function tutorChatStream(user: CurrentUser, raw: unknown): Promise<ReadableStream<Uint8Array>> {
  const input = chatRequestSchema.parse(raw);
  const { response, question, answered } = await loadAccess(user.id, input.attemptId, input.questionId, accessModeFor(input.mode));
  const opening = await db.aiExplanation.findUnique({
    where: {
      questionId_questionVersion_locale_mode_choice: {
        questionId: question.id,
        questionVersion: question.version,
        locale: input.locale,
        mode: input.mode,
        choice: input.mode === "whyWrong" ? (response.answer ?? "").toUpperCase() : "",
      },
    },
  });
  if (!opening || opening.verdict !== "AGREE") throw new HttpError(409, "NO_EXPLANATION");

  const where = { userId_attemptId_questionId: { userId: user.id, attemptId: input.attemptId, questionId: question.id } };
  const convo = await db.aiConversation.findUnique({ where });
  const history = (convo?.messages as ChatMessage[] | undefined) ?? [];
  if (history.filter((m) => m.role === "user").length >= aiLimits.chatTurnsPerQuestion) throw new HttpError(429, "CHAT_LIMIT");
  await requireQuota(user);

  const ctx = { studentAnswer: response.answer, isCorrect: response.isCorrect, answered, language: LOCALE_ENGLISH_NAMES[input.locale] };
  const studentTurn = (m: string) => `<student_message>\n${m}\n</student_message>\nMode: followup. Write the reply in: ${ctx.language}.`;
  const messages: { role: "user" | "assistant"; content: string | TextContent[] }[] = [
    { role: "user", content: await firstUserMessage(question, { ...ctx, mode: input.mode }) },
    { role: "assistant", content: `VERDICT: AGREE\n${opening.content}` },
    ...history.map((m) => (m.role === "user" ? { role: "user" as const, content: studentTurn(m.content) } : { role: "assistant" as const, content: `VERDICT: AGREE\n${m.content}` })),
    { role: "user", content: studentTurn(input.message) },
  ];

  return streamReply({
    user,
    feature: "tutor_chat",
    questionId: question.id,
    messages,
    onFinish: async (r) => {
      if (r.verdict !== "AGREE") return;
      const next: ChatMessage[] = [...history, { role: "user", content: input.message }, { role: "assistant", content: r.text }];
      await db.aiConversation.upsert({
        where,
        create: { userId: user.id, attemptId: input.attemptId, questionId: question.id, locale: input.locale, messages: next as unknown as Prisma.InputJsonValue },
        update: { messages: next as unknown as Prisma.InputJsonValue, locale: input.locale },
      });
    },
  });
}

/** A conversation that opened from a hint stays in hint rules until the question is answered. */
function accessModeFor(mode: TutorMode): TutorMode | "followup" {
  return mode === "hint" ? "hint" : "followup";
}

/** Earlier follow-up messages, to show when the student comes back to a question. */
export async function loadConversation(userId: string, attemptId: string, questionId: string): Promise<ChatMessage[]> {
  const c = await db.aiConversation.findUnique({ where: { userId_attemptId_questionId: { userId, attemptId, questionId } } });
  return (c?.messages as ChatMessage[] | undefined) ?? [];
}
