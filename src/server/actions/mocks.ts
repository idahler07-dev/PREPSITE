"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { requireApiUser } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { buildMockTest, startMock } from "@/server/mock/service";
import { assertTestAllowance } from "@/server/billing/entitlement";

type Result = { ok: true; id: string } | { ok: false; error: string };

function fail(e: unknown): Result {
  if (e instanceof HttpError) return { ok: false, error: e.code };
  if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
  throw e;
}

export async function startMockTest(raw: unknown): Promise<Result> {
  const user = await requireApiUser();
  if (!(await rateLimit(`mock:${user.id}`, 30, 3600)).ok) return { ok: false, error: "RATE_LIMITED" };
  try {
    return { ok: true, id: (await startMock(user.id, raw)).id };
  } catch (e) {
    return fail(e);
  }
}

/** Assemble a new full test for this student from questions they haven't seen, then start it. */
export async function generateMockTest(raw: unknown): Promise<Result> {
  const user = await requireApiUser();
  if (!(await rateLimit(`mockgen:${user.id}`, 10, 86_400)).ok) return { ok: false, error: "RATE_LIMITED" };
  try {
    const { sections } = z.object({ sections: z.array(z.enum(["RW", "MATH"])).min(1).max(2) }).parse(raw);
    await assertTestAllowance(user.id); // before spending work on assembling a test

    const t = await getTranslations("mocks");
    const mock = await buildMockTest({ title: t("generatedTitle"), sections }, { kind: "GENERATED", forUserId: user.id });
    const scope = sections.length === 2 ? "full" : sections[0]!;
    return { ok: true, id: (await startMock(user.id, { mockTestId: mock.id, scope })).id };
  } catch (e) {
    return fail(e);
  }
}
