/**
 * The learning path (brief §6): one unit per SAT domain, one lesson node per
 * skill, then a chest (mixed unit review) and a unit test. Built only from
 * the student's real answers: a skill is done once it has at least
 * MIN_ANSWERS answers at MASTERY accuracy or better.
 */
import { DOMAINS, type SectionKey } from "@/lib/taxonomy";

export const MIN_ANSWERS = 6;
export const MASTERY = 0.7;

export type NodeKind = "lesson" | "review" | "chest" | "test";
export type NodeState = "done" | "current" | "open" | "locked";

export interface PathNode {
  id: string;
  kind: NodeKind;
  state: NodeState;
  /** Skill key for lessons; domain key for chest and unit test. */
  key: string;
  /** Accuracy 0–1 when the skill has answers. */
  mastery: number | null;
  answered: number;
}

export interface PathUnit {
  index: number;
  domain: string;
  section: SectionKey;
  nodes: PathNode[];
  done: number;
  total: number;
}

export function buildPath(skills: { key: string; total: number; correct: number }[], dueReviews = 0): { units: PathUnit[]; current: PathNode | null } {
  const rows = new Map(skills.map((s) => [s.key, s]));
  const isDone = (k: string) => {
    const r = rows.get(k);
    return !!r && r.total >= MIN_ANSWERS && r.correct / r.total >= MASTERY;
  };

  let current: PathNode | null = null;
  const units: PathUnit[] = DOMAINS.map((d, ui) => {
    const nodes: PathNode[] = [];
    d.skills.forEach((k, si) => {
      const r = rows.get(k);
      const done = isDone(k);
      const node: PathNode = { id: `${d.key}:${k}`, kind: "lesson", state: done ? "done" : "locked", key: k, mastery: r && r.total ? r.correct / r.total : null, answered: r?.total ?? 0 };
      if (!done && !current) {
        node.state = "current";
        current = node;
      }
      nodes.push(node);
      // A review stop after the second lesson of the unit you're in, when mistakes are due.
      if (si === 1 && dueReviews > 0 && current && nodes.includes(current)) nodes.push({ id: `${d.key}:review`, kind: "review", state: "open", key: d.key, mastery: null, answered: 0 });
    });
    const lessons = nodes.filter((n) => n.kind === "lesson");
    const allDone = lessons.every((n) => n.state === "done");
    // Chest and unit test open once every lesson in the unit is done.
    nodes.push({ id: `${d.key}:chest`, kind: "chest", state: allDone ? "open" : "locked", key: d.key, mastery: null, answered: 0 });
    nodes.push({ id: `${d.key}:test`, kind: "test", state: allDone ? "open" : "locked", key: d.key, mastery: null, answered: 0 });
    return { index: ui + 1, domain: d.key, section: d.section as SectionKey, nodes, done: lessons.filter((n) => n.state === "done").length, total: lessons.length };
  });
  return { units, current };
}

/** Horizontal offset (px from the centre line) of the i-th node: a gentle S-curve. */
export function nodeOffset(i: number, amp = 72): number {
  return Math.round(Math.sin((i * Math.PI) / 3.2) * amp);
}

/** 10 XP per correct answer: the same rule the lesson screen shows ("+10 XP"). */
export const XP_PER_CORRECT = 10;
