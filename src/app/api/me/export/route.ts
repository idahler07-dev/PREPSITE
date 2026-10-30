import { db } from "@/lib/db";
import { requireApiUser } from "@/server/auth/session";
import { errorResponse } from "@/server/http";

function csvCell(v: unknown): string {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Everything the user has answered, as CSV. */
export async function GET() {
  try {
    const user = await requireApiUser();
    const rows = await db.response.findMany({
      where: { module: { attempt: { userId: user.id } } },
      orderBy: [{ module: { attempt: { startedAt: "asc" } } }, { position: "asc" }],
      select: {
        answer: true,
        isCorrect: true,
        flagged: true,
        timeSpentMs: true,
        answeredAt: true,
        question: { select: { code: true, section: true, domain: true, skill: true, difficulty: true } },
        module: { select: { attempt: { select: { id: true, kind: true, startedAt: true, completedAt: true } } } },
      },
    });
    const header = ["attempt_id", "attempt_type", "started_at", "completed_at", "question_code", "section", "domain", "skill", "difficulty", "your_answer", "correct", "flagged", "time_seconds", "answered_at"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const a = r.module.attempt;
      lines.push(
        [a.id, a.kind, a.startedAt, a.completedAt, r.question.code, r.question.section, r.question.domain, r.question.skill, r.question.difficulty, r.answer, r.isCorrect == null ? "" : r.isCorrect ? "yes" : "no", r.flagged ? "yes" : "no", Math.round(r.timeSpentMs / 1000), r.answeredAt]
          .map(csvCell)
          .join(","),
      );
    }
    return new Response("﻿" + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="my-sat-practice-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
