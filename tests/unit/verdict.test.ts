import { describe, expect, it } from "vitest";
import { splitVerdict } from "@/lib/ai/verdict";

describe("tutor verdict line", () => {
  it("waits for the whole first line", () => {
    expect(splitVerdict("VERD")).toBeNull();
    expect(splitVerdict("VERDICT: AGR")).toBeNull();
  });

  it("parses agreement and keeps the explanation", () => {
    expect(splitVerdict("VERDICT: AGREE\nStep 1: subtract 3.")).toEqual({ verdict: "AGREE", reason: "", rest: "Step 1: subtract 3." });
    expect(splitVerdict("  **Verdict: agree**\n\nText")).toMatchObject({ verdict: "AGREE", rest: "Text" });
  });

  it("parses disagreement with a reason", () => {
    expect(splitVerdict("VERDICT: DISAGREE: choice C is correct, not B\nignored")).toMatchObject({ verdict: "DISAGREE", reason: "choice C is correct, not B" });
    expect(splitVerdict("VERDICT: DISAGREE — 2 + 2 is 4", true)).toMatchObject({ verdict: "DISAGREE", reason: "2 + 2 is 4", rest: "" });
  });

  it("treats a missing verdict line as agreement without losing text", () => {
    expect(splitVerdict("Start by isolating x.\nThen…")).toEqual({ verdict: "AGREE", reason: "", rest: "Start by isolating x.\nThen…" });
    expect(splitVerdict("Start by isolating")).toMatchObject({ verdict: "AGREE", rest: "Start by isolating" });
    expect(splitVerdict("Short", true)).toMatchObject({ verdict: "AGREE", rest: "Short" });
  });
});
