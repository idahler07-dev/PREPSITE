import { DOMAINS } from "@/lib/taxonomy";

/**
 * The study coach's weekly plan, built with fixed rules (the AI only writes
 * a short note on top). Days run Monday to Sunday.
 */
export type TaskKind = "drill" | "review" | "mock" | "vocab" | "rest";

export interface PlanTask {
  kind: TaskKind;
  minutes: number;
  skill?: string;
  count?: number;
}

export interface PlanDay {
  date: string; // YYYY-MM-DD
  tasks: PlanTask[];
}

export interface WeeklyPlan {
  weekStart: string;
  daysToTest: number | null;
  minutesPerDay: number;
  focusSkills: string[];
  days: PlanDay[];
}

export interface CoachInput {
  today: string; // YYYY-MM-DD in the student's time zone
  testDate: string | null;
  /** Accuracy per skill from recent practice. */
  skills: { skill: string; answered: number; correct: number }[];
  dueReviews: number;
  /** Can the student start a practice test this week (premium, or free tests left)? */
  canTakeTest: boolean;
}

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const diffDays = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);

export function mondayOf(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((dow + 6) % 7));
}

/** Weakest skills first: low accuracy with enough answers, then skills never practised. */
export function weakestSkills(skills: CoachInput["skills"], n = 3): string[] {
  const tried = skills.filter((s) => s.answered >= 3).sort((a, b) => a.correct / a.answered - b.correct / b.answered || b.answered - a.answered);
  const weak = tried.filter((s) => s.correct / s.answered < 0.8).map((s) => s.skill);
  const seen = new Set(skills.filter((s) => s.answered > 0).map((s) => s.skill));
  // Alternate sections so both get attention.
  const untouched: string[] = [];
  const rw = DOMAINS.filter((d) => d.section === "RW").flatMap((d) => d.skills);
  const math = DOMAINS.filter((d) => d.section === "MATH").flatMap((d) => d.skills);
  for (let i = 0; i < Math.max(rw.length, math.length); i++) for (const s of [rw[i], math[i]]) if (s && !seen.has(s)) untouched.push(s);
  return [...new Set([...weak, ...untouched, ...tried.map((s) => s.skill)])].slice(0, n);
}

export function buildWeeklyPlan(input: CoachInput): WeeklyPlan {
  const weekStart = mondayOf(input.today);
  const daysToTest = input.testDate ? diffDays(input.today, input.testDate) : null;
  const minutesPerDay = daysToTest === null || daysToTest > 90 ? 30 : daysToTest > 30 ? 45 : 60;
  const studyDays = daysToTest !== null && daysToTest <= 90 ? 6 : 5;
  const focusSkills = weakestSkills(input.skills);
  let reviewLeft = input.dueReviews;
  let focus = 0;
  let mockPlaced = false;

  const days: PlanDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const tasks: PlanTask[] = [];
    const untilTest = input.testDate ? diffDays(date, input.testDate) : null;
    const past = diffDays(input.today, date) < 0;
    if (untilTest !== null && untilTest < 0) {
      days.push({ date, tasks: [] }); // after the test
      continue;
    }
    if (untilTest === 0 || untilTest === 1) {
      days.push({ date, tasks: [{ kind: "rest", minutes: 0 }] }); // test day and the day before
      continue;
    }
    // Sunday (and Saturday when studying 5 days) are rest days.
    const isRest = i === 6 || (studyDays === 5 && i === 5);
    if (isRest) {
      days.push({ date, tasks: [{ kind: "rest", minutes: 0 }] });
      continue;
    }
    // One full practice test on Saturday (or Friday on 5-day weeks), not in the last 3 days before the test.
    const mockDay = studyDays === 5 ? 4 : 5;
    if (i === mockDay && input.canTakeTest && !past && (untilTest === null || untilTest > 3) && !mockPlaced) {
      tasks.push({ kind: "mock", minutes: 140 });
      mockPlaced = true;
      days.push({ date, tasks });
      continue;
    }
    let minutes = minutesPerDay;
    if (reviewLeft > 0) {
      const n = Math.min(reviewLeft, 10);
      tasks.push({ kind: "review", minutes: Math.ceil(n * 1.5), count: n });
      reviewLeft -= n;
      minutes -= Math.ceil(n * 1.5);
    }
    tasks.push({ kind: "vocab", minutes: 5 });
    minutes -= 5;
    if (minutes >= 5 && focusSkills.length) {
      const skill = focusSkills[focus++ % focusSkills.length]!;
      tasks.push({ kind: "drill", skill, minutes, count: Math.max(5, Math.round(minutes / 1.5)) });
    }
    days.push({ date, tasks });
  }
  return { weekStart, daysToTest, minutesPerDay, focusSkills, days };
}
