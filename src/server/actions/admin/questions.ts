"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { questionInputSchema, type QuestionFormValues } from "@/lib/questions/schema";
import { normalizePrefix, PREFIX_PATTERN } from "@/lib/questions/codes";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import {
  bulkSetStatus,
  bulkUpdateMeta,
  createQuestion,
  setQuestionStatus,
  suggestNextCodes,
  updateQuestion,
} from "@/server/questions/service";

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; message?: string; fieldErrors?: Record<string, string> };

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code, message: e.message };
    if (e instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const i of e.issues) fieldErrors[i.path.join(".")] = i.message;
      return { ok: false, error: "VALIDATION", fieldErrors };
    }
    console.error(e);
    return { ok: false, error: "INTERNAL" };
  }
}

const intentSchema = z.enum(["draft", "review", "publish", "keep"]);

/**
 * Create or update a question. `intent` decides the resulting status:
 * content is always saved first; publishing then goes through the status
 * service, which checks blocking flags and records the reviewer.
 */
export async function saveQuestion(
  values: QuestionFormValues,
  opts: { id?: string; expectedVersion?: number; intent: "draft" | "review" | "publish" | "keep"; changeNote?: string },
) {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const input = questionInputSchema.parse(values);
    const intent = intentSchema.parse(opts.intent);
    const saveStatus = intent === "draft" ? "DRAFT" : intent === "review" ? "IN_REVIEW" : undefined;
    const result = opts.id
      ? await updateQuestion(opts.id, input, actor, { expectedVersion: opts.expectedVersion, changeNote: opts.changeNote, status: saveStatus })
      : await createQuestion(input, actor, { origin: "MANUAL", status: saveStatus ?? "DRAFT" });

    let question = result.question;
    let publishError: string | null = null;
    if (intent === "publish") {
      try {
        question = await setQuestionStatus(question.id, "PUBLISHED", actor);
      } catch (e) {
        publishError = e instanceof HttpError ? e.code : "INTERNAL";
      }
    }
    revalidatePath("/[locale]/admin", "layout");
    return {
      id: question.id,
      version: question.version,
      flags: question.flags,
      status: question.status,
      nearDuplicates: result.nearDuplicates,
      publishError,
    };
  });
}

export async function changeQuestionStatus(id: string, status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "RETIRED") {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const q = await setQuestionStatus(id, z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"]).parse(status), actor);
    revalidatePath("/[locale]/admin", "layout");
    return { status: q.status, version: q.version };
  });
}

export async function bulkQuestionStatus(ids: string[], status: "IN_REVIEW" | "PUBLISHED" | "RETIRED" | "DRAFT") {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const parsedIds = z.array(z.string()).max(500).parse(ids);
    const res = await bulkSetStatus(parsedIds, z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "RETIRED"]).parse(status), actor);
    revalidatePath("/[locale]/admin", "layout");
    return res;
  });
}

export async function bulkQuestionMeta(ids: string[], patch: { difficulty?: string; domain?: string; skill?: string }) {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const parsed = z
      .object({
        ids: z.array(z.string()).max(500),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
        domain: z.string().optional(),
        skill: z.string().optional(),
      })
      .parse({ ids, ...patch });
    await bulkUpdateMeta(parsed.ids, parsed, actor);
    revalidatePath("/[locale]/admin", "layout");
    return { updated: parsed.ids.length };
  });
}

export async function suggestCode(prefix: string, domain: string) {
  return run(async () => {
    await requireApiRole(STAFF_ROLES);
    const p = normalizePrefix(prefix);
    if (!PREFIX_PATTERN.test(p)) throw new HttpError(400, "INVALID_PREFIX");
    const [code] = await suggestNextCodes(p, domain, 1);
    return code!;
  });
}

/** Restore an earlier version's content as a new version (history is never rewritten). */
export async function restoreQuestionVersion(id: string, version: number) {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const { db } = await import("@/lib/db");
    const [q, v] = await Promise.all([
      db.question.findUnique({ where: { id }, select: { version: true, status: true } }),
      db.questionVersion.findUnique({ where: { questionId_version: { questionId: id, version } } }),
    ]);
    if (!q || !v) throw new HttpError(404, "NOT_FOUND");
    const snap = v.snapshot as Record<string, unknown>;
    const input = questionInputSchema.parse({ ...snap, choices: snap.choices ?? null });
    // A restored version goes back through review unless it is still a draft.
    const status = q.status === "DRAFT" ? "DRAFT" : "IN_REVIEW";
    const res = await updateQuestion(id, input, actor, { expectedVersion: q.version, changeNote: `restored v${version}`, status });
    revalidatePath("/[locale]/admin", "layout");
    return { version: res.question.version };
  });
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "DISMISSED") {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const { db } = await import("@/lib/db");
    const report = await db.questionReport.update({
      where: { id: reportId },
      data: { status: z.enum(["RESOLVED", "DISMISSED"]).parse(status), resolvedById: actor.id, resolvedAt: new Date() },
    });
    const open = await db.questionReport.count({ where: { questionId: report.questionId, status: "OPEN" } });
    const q = await db.question.findUniqueOrThrow({ where: { id: report.questionId }, select: { flags: true } });
    await db.question.update({
      where: { id: report.questionId },
      data: { reportCount: open, flags: open ? q.flags : q.flags.filter((f) => f !== "STUDENT_REPORT") },
    });
    revalidatePath("/[locale]/admin", "layout");
    return { open };
  });
}

/** Publish every waiting question in the current filter that has no blocking flags. */
export async function publishCleanInFilter(rawFilters: Record<string, string | undefined>) {
  return run(async () => {
    const actor = await requireApiRole(STAFF_ROLES);
    const { db } = await import("@/lib/db");
    const { parseQuestionFilters, questionWhere } = await import("@/server/questions/query");
    const { ALL_FLAGS, isBlocking } = await import("@/lib/questions/flags");
    const filters = parseQuestionFilters(rawFilters);
    const blocking = ALL_FLAGS.filter(isBlocking);
    const ids = (
      await db.question.findMany({
        where: questionWhere({ ...filters, status: undefined }, { status: { in: ["DRAFT", "IN_REVIEW"] }, NOT: { flags: { hasSome: blocking } } }),
        select: { id: true },
        take: 1000,
      })
    ).map((q) => q.id);
    const res = await bulkSetStatus(ids, "PUBLISHED", actor);
    revalidatePath("/[locale]/admin", "layout");
    return res;
  });
}
