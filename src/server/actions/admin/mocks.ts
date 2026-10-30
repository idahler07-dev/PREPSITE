"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiOwner } from "@/server/auth/session";
import { HttpError } from "@/server/http";
import { audit } from "@/server/audit";
import { buildMockTest, setMockStatus } from "@/server/mock/service";
import { enqueue, JOBS } from "@/server/jobs/queue";

type Result<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof HttpError) return { ok: false, error: e.code };
    if (e instanceof z.ZodError) return { ok: false, error: "VALIDATION" };
    console.error(e);
    return { ok: false, error: "INTERNAL" };
  }
}

export async function createMockTest(raw: unknown) {
  return run(async () => {
    const user = await requireApiOwner();
    const mock = await buildMockTest(raw, { kind: "CURATED", createdById: user.id });
    await audit(user.id, "mock.create", "MockTest", mock.id, {});
    revalidatePath("/manage/mocks", "page");
    return mock;
  });
}

export async function changeMockStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  return run(async () => {
    const user = await requireApiOwner();
    z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(status);
    await setMockStatus(z.string().max(40).parse(id), status);
    await audit(user.id, `mock.${status.toLowerCase()}`, "MockTest", id, {});
    if (status === "PUBLISHED") await enqueue(JOBS.announceTest, { mockTestId: id }, { singletonKey: `announce-${id}` }).catch((e) => console.error(e));
    revalidatePath("/manage/mocks", "layout");
    return null;
  });
}

/** Drafts nobody has taken can be deleted; anything else is archived instead. */
export async function deleteMockTest(id: string) {
  return run(async () => {
    const user = await requireApiOwner();
    const mock = await db.mockTest.findUnique({ where: { id }, select: { status: true, kind: true, _count: { select: { attempts: true } } } });
    if (!mock || mock.kind !== "CURATED") throw new HttpError(404, "NOT_FOUND");
    if (mock.status !== "DRAFT" || mock._count.attempts > 0) throw new HttpError(409, "IN_USE");
    await db.mockTest.delete({ where: { id } });
    await audit(user.id, "mock.delete", "MockTest", id, {});
    revalidatePath("/manage/mocks", "layout");
    return null;
  });
}
