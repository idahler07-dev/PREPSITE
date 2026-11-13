import "server-only";
import { z } from "zod";
import siteConfig from "@site";
import en from "../../../messages/en.json";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  buildWeeklyPlan,
  mondayOf,
  type WeeklyPlan,
  weakestSkills,
} from "@/lib/coach/plan";
import { dayInZone } from "@/lib/stats/streak";
import { LOCALE_ENGLISH_NAMES } from "@/i18n/locales";
import { aiAvailable, models } from "@/server/ai/client";
import { generateJson } from "@/server/ai/structured";
import { getEntitlement, usageSummary } from "@/server/billing/entitlement";

const skillNames = en.taxonomy.skills as Record<string, string>;

async function coachInput(userId: string, now: Date) {
  const since = new Date(now.getTime() - 60 * 86_400_000);
  const [user, responses, due, usage] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { testDate: true, targetScore: true, locale: true, name: true },
    }),
    db.response.findMany({
      where: {
        gradedAt: { gte: since },
        answer: { not: null },
        module: { attempt: { userId } },
      },
      select: {
        isCorrect: true,
        gradedAt: true,
        question: { select: { skill: true } },
      },
      orderBy: { gradedAt: "desc" },
      take: 3000,
    }),
    db.reviewItem.count({
      where: {
        userId,
        archivedAt: null,
        dueAt: { lte: new Date(now.getTime() + 7 * 86_400_000) },
      },
    }),
    usageSummary(userId),
  ]);
  const bySkill = new Map<
    string,
    { skill: string; answered: number; correct: number }
  >();
  for (const r of responses) {
    const s = bySkill.get(r.question.skill) ?? {
      skill: r.question.skill,
      answered: 0,
      correct: 0,
    };
    s.answered++;
    if (r.isCorrect) s.correct++;
    bySkill.set(r.question.skill, s);
  }
  // days with any practice, for marking missed study days
  const activeDays = [
    ...new Set(
      responses
        .map((r) =>
          r.gradedAt ? dayInZone(r.gradedAt, siteConfig.defaultTimeZone) : null,
        )
        .filter((d): d is string => !!d),
    ),
  ];
  return {
    user,
    input: {
      activeDays,
      today: dayInZone(now, siteConfig.defaultTimeZone),
      testDate: user.testDate ? user.testDate.toISOString().slice(0, 10) : null,
      skills: [...bySkill.values()],
      dueReviews: due,
      canTakeTest: usage.testsLeft === null || usage.testsLeft > 0,
    },
  };
}

/** A short encouraging note from the AI (optional; the plan itself never depends on it). */
async function coachMessage(
  userId: string,
  plan: WeeklyPlan,
  ctx: {
    locale: string;
    targetScore: number | null;
    latestEstimate: number | null;
  },
) {
  if (!aiAvailable()) return null;
  try {
    const r = await generateJson({
      model: models().fast,
      system:
        "You are a friendly SAT study coach. Write 2–3 short sentences for the student about this week's plan: what to focus on and why, and one practical tip. Don't invent numbers. Don't mention College Board or other companies. Plain text, no Markdown.",
      user: JSON.stringify({
        language: LOCALE_ENGLISH_NAMES.en,
        daysToTest: plan.daysToTest,
        targetScore: ctx.targetScore,
        latestEstimatedScore: ctx.latestEstimate,
        focusSkills: plan.focusSkills.map((s) => skillNames[s] ?? s),
        minutesPerDay: plan.minutesPerDay,
      }),
      jsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["message"],
        properties: { message: { type: "string" } },
      },
      schema: z.object({ message: z.string().max(800) }),
      maxTokens: 4000,
      feature: "coach",
      userId,
    });
    return r.message;
  } catch (e) {
    console.warn("[coach] message", e);
    return null;
  }
}

async function latestEstimate(userId: string): Promise<number | null> {
  const [mock, official] = await Promise.all([
    db.attempt.findFirst({
      where: {
        userId,
        kind: "MOCK",
        status: "COMPLETED",
        scores: { not: { equals: null } },
      },
      orderBy: { completedAt: "desc" },
      select: { scores: true, completedAt: true },
    }),
    db.officialScore.findFirst({
      where: { userId },
      orderBy: { takenOn: "desc" },
      select: { total: true, takenOn: true },
    }),
  ]);
  const mockTotal =
    (mock?.scores as { total?: { score: number } } | null)?.total?.score ??
    null;
  if (official && (!mock?.completedAt || official.takenOn >= mock.completedAt))
    return official.total;
  return mockTotal;
}

/** Build (or rebuild) this week's plan. `withMessage` asks the AI for a note (after tests or on request). */
export async function generatePlan(
  userId: string,
  reason: string,
  opts: { withMessage?: boolean; now?: Date; keepFocus?: string[] } = {},
) {
  const now = opts.now ?? new Date();
  const { user, input } = await coachInput(userId, now);
  const plan = buildWeeklyPlan({ ...input, focusSkills: opts.keepFocus });
  const message = opts.withMessage
    ? await coachMessage(userId, plan, {
        locale: user.locale ?? "en",
        targetScore: user.targetScore,
        latestEstimate: await latestEstimate(userId),
      })
    : null;
  const data = {
    plan: plan as unknown as Prisma.InputJsonValue,
    reason,
    generatedAt: now,
    ...(message ? { message } : {}),
  };
  return db.studyPlan.upsert({
    where: { userId_weekStart: { userId, weekStart: plan.weekStart } },
    create: { userId, weekStart: plan.weekStart, ...data },
    update: data,
  });
}

/** This week's plan, creating it the first time it is looked at. */
/**
 * This week's plan, creating it the first time it is looked at and rebuilding it
 * on the first look each day, so missed days roll forward. Premium plans also
 * re-pick their focus skills from the latest results; free plans keep the week's.
 */
export async function currentPlan(userId: string, now = new Date()) {
  const today = dayInZone(now, siteConfig.defaultTimeZone);
  const weekStart = mondayOf(today);
  const existing = await db.studyPlan.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });
  if (!existing) {
    // a new week leads with skills last week's missed days couldn't fit
    const prev = await db.studyPlan.findFirst({
      where: { userId, weekStart: { lt: weekStart } },
      orderBy: { weekStart: "desc" },
      select: { plan: true },
    });
    const carry =
      (prev?.plan as unknown as WeeklyPlan | undefined)?.carryOver ?? [];
    const { input } = carry.length
      ? await coachInput(userId, now)
      : { input: null };
    const keepFocus = input
      ? [...new Set([...carry, ...weakestSkills(input.skills)])].slice(0, 3)
      : undefined;
    return generatePlan(userId, "week", { now, keepFocus });
  }
  if (dayInZone(existing.generatedAt, siteConfig.defaultTimeZone) === today)
    return existing;
  const { premium } = await getEntitlement(userId, now);
  const keepFocus = premium
    ? undefined
    : (existing.plan as unknown as WeeklyPlan).focusSkills;
  return generatePlan(userId, "daily", { now, keepFocus });
}

/** The student's weakest skills right now (same ranking the weekly plan uses), for a one-click weak-spot drill. */
export async function weakSkills(userId: string, n = 4, now = new Date()) {
  const { input } = await coachInput(userId, now);
  return weakestSkills(input.skills, n);
}

export { latestEstimate };
