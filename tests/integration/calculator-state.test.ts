import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createQuestion } from "@/server/questions/service";
import { createDrill, getRunnerState, saveCalculatorState, type RunnerState } from "@/server/attempts/service";
import { makeUser, mathInput, resetDb } from "./helpers";

async function drillFor(userId: string) {
  const author = await makeUser();
  for (let i = 0; i < 3; i++) await createQuestion(mathInput(), author, { origin: "MANUAL", status: "PUBLISHED" });
  return createDrill(userId, { section: "MATH", count: 3, feedback: "IMMEDIATE" });
}

describe("calculator state", () => {
  beforeEach(resetDb);

  it("is saved with the attempt and comes back with the test screen", async () => {
    const student = await makeUser();
    const { id } = await drillFor(student.id);
    const state = { graphing: { expressions: { list: [{ latex: "y=x^2" }] } }, tab: "graphing", degrees: true };
    await saveCalculatorState(id, student.id, state);
    const runner = (await getRunnerState(id, student.id)) as RunnerState;
    expect(runner.calculatorState).toEqual(state);
  });

  it("is private, size-limited and only kept while the attempt is in progress", async () => {
    const student = await makeUser();
    const other = await makeUser();
    const { id } = await drillFor(student.id);
    await expect(saveCalculatorState(id, other.id, { tab: "graphing" })).rejects.toMatchObject({ status: 404 });
    await expect(saveCalculatorState(id, student.id, { big: "x".repeat(250_000) })).rejects.toMatchObject({ status: 413 });
    await expect(saveCalculatorState(id, student.id, ["not", "an", "object"])).rejects.toMatchObject({ status: 400 });
    await db.attempt.update({ where: { id }, data: { status: "COMPLETED" } });
    await expect(saveCalculatorState(id, student.id, { tab: "graphing" })).rejects.toMatchObject({ status: 409 });
  });
});
