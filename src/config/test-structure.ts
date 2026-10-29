import type { SectionKey } from "@/lib/taxonomy";

/**
 * Structure of a full practice test. Change it here, not in components.
 * Times are in seconds.
 */
export interface ModuleSpec {
  section: SectionKey;
  moduleNumber: 1 | 2;
  questionCount: number;
  timeLimitSec: number;
}

export interface TestStructure {
  sections: { section: SectionKey; modules: ModuleSpec[] }[];
  /** Break between sections. */
  breakSec: number;
  /** Show a warning when this much time is left in a module. */
  warningSec: number;
}

export const testStructure: TestStructure = {
  sections: [
    {
      section: "RW",
      modules: [
        { section: "RW", moduleNumber: 1, questionCount: 27, timeLimitSec: 32 * 60 },
        { section: "RW", moduleNumber: 2, questionCount: 27, timeLimitSec: 32 * 60 },
      ],
    },
    {
      section: "MATH",
      modules: [
        { section: "MATH", moduleNumber: 1, questionCount: 22, timeLimitSec: 35 * 60 },
        { section: "MATH", moduleNumber: 2, questionCount: 22, timeLimitSec: 35 * 60 },
      ],
    },
  ],
  breakSec: 10 * 60,
  warningSec: 5 * 60,
};

/** Average seconds per question in the real test; used to time drills. */
export function secondsPerQuestion(section: SectionKey | "MIXED"): number {
  const per = (s: SectionKey) => {
    const m = testStructure.sections.find((x) => x.section === s)?.modules[0];
    return m ? m.timeLimitSec / m.questionCount : 75;
  };
  if (section === "MIXED") return Math.round((per("RW") + per("MATH")) / 2);
  return Math.round(per(section));
}
