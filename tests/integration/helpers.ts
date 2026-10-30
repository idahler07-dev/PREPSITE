import { db } from "@/lib/db";
import type { QuestionFormValues } from "@/lib/questions/schema";
import { questionInputSchema } from "@/lib/questions/schema";

/** Empty every table (fast, keeps the schema). */
export async function resetDb() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}

let n = 0;
export async function makeUser(role: "STUDENT" | "EDITOR" | "ADMIN" = "STUDENT") {
  n++;
  return db.user.create({ data: { email: `user${n}-${Date.now()}@test.local`, role, name: `User ${n}` } });
}

export function mathInput(overrides: Partial<QuestionFormValues> = {}) {
  return questionInputSchema.parse({
    code: `T-ALG-${String(++n).padStart(4, "0")}`,
    section: "MATH",
    domain: "ALGEBRA",
    skill: "LINEAR_FUNCTIONS",
    difficulty: "MEDIUM",
    type: "MCQ",
    stem: `If $f(x) = ${n}x$, what is $f(1)$? (question ${n})`,
    choices: [
      { key: "A", text: "1" },
      { key: "B", text: String(n) },
      { key: "C", text: "0" },
      { key: "D", text: "-1" },
    ],
    correctAnswers: ["B"],
    explanation: "Substitute 1.",
    tags: [],
    ...overrides,
  });
}
