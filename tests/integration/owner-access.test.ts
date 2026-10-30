import { readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { HttpError } from "@/server/http";
import { resetDb } from "./helpers";

process.env.OWNER_EMAILS = "Owner@Example.com, second@example.com";

// Whoever `signedInAs` points at is the signed-in user for the code under test.
let signedInAs: string | null = null;
vi.mock("@/lib/auth", () => ({
  auth: async () => (signedInAs ? { user: { id: signedInAs } } : null),
}));
vi.mock("next/cache", () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

const { isOwner } = await import("@/server/auth/owner");
const { requireApiOwner } = await import("@/server/auth/session");

describe("isOwner", () => {
  const verified = new Date();
  it("needs a listed email that has been verified", () => {
    expect(
      isOwner({ email: "owner@example.com", emailVerified: verified }),
    ).toBe(true);
    expect(
      isOwner({ email: "SECOND@example.com", emailVerified: verified }),
    ).toBe(true);
    expect(isOwner({ email: "owner@example.com", emailVerified: null })).toBe(
      false,
    );
    expect(
      isOwner({ email: "someone@example.com", emailVerified: verified }),
    ).toBe(false);
    expect(isOwner({ email: null, emailVerified: verified })).toBe(false);
    expect(isOwner(null)).toBe(false);
  });
});

/** Every exported server action in src/server/actions/admin, called with junk arguments. */
const ACTIONS_DIR = path.join(process.cwd(), "src/server/actions/admin");
const actions = await Promise.all(
  readdirSync(ACTIONS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map(async (f) => {
      const mod = (await import(path.join(ACTIONS_DIR, f))) as Record<
        string,
        unknown
      >;
      return Object.entries(mod)
        .filter(([, v]) => typeof v === "function")
        .map(([name, fn]) => ({
          name: `${f}:${name}`,
          fn: fn as (...args: unknown[]) => Promise<unknown>,
        }));
    }),
).then((x) => x.flat());

async function outcome(fn: () => Promise<unknown>): Promise<string> {
  try {
    const res = (await fn()) as { error?: string } | undefined;
    return res?.error ?? "OK";
  } catch (e) {
    return e instanceof HttpError
      ? `${e.status}:${e.code}`
      : `THREW:${String(e)}`;
  }
}

describe("manage actions are owner-only", () => {
  let member: string;
  let unverifiedOwner: string;

  beforeAll(async () => {
    await resetDb();
    member = (
      await db.user.create({
        data: { email: "member@example.com", emailVerified: new Date() },
      })
    ).id;
    // Listed email, but never proved: e.g. a Telegram or demo account that typed it in.
    unverifiedOwner = (
      await db.user.create({ data: { email: "owner@example.com" } })
    ).id;
  });
  beforeEach(() => {
    signedInAs = null;
  });

  it("finds the actions", () => {
    expect(actions.length).toBeGreaterThan(15);
  });

  it.each(["signed out", "member", "unverified owner email"])(
    "%s gets 404 from requireApiOwner",
    async (who) => {
      signedInAs =
        who === "member"
          ? member
          : who === "signed out"
            ? null
            : unverifiedOwner;
      await expect(requireApiOwner()).rejects.toMatchObject({ status: 404 });
    },
  );

  it.each(actions.map((a) => [a.name, a] as const))(
    "%s refuses a normal user and changes nothing",
    async (_name, a) => {
      signedInAs = member;
      const before = await db.auditLog.count();
      const form = new FormData();
      form.set("name", "x");
      const result = await outcome(() => a.fn("x", form, "x"));
      expect(["NOT_FOUND", "404:NOT_FOUND"]).toContain(result);
      expect(await db.auditLog.count()).toBe(before);
    },
  );
});
