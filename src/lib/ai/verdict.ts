/**
 * Every tutor answer starts with one line saying whether the AI agrees with
 * the stored answer key, e.g. "VERDICT: AGREE" or
 * "VERDICT: DISAGREE: the correct answer looks like C because …".
 * The line is never shown to students.
 */
export type Verdict = { verdict: "AGREE" | "DISAGREE"; reason: string; rest: string };

/** Longest prefix we wait for before deciding there is no verdict line. */
const MAX_VERDICT_WAIT = 400;

/**
 * Parse the start of a streamed answer. Returns null while more text is
 * needed. A missing verdict line counts as agreement (the text is kept).
 */
export function splitVerdict(buffer: string, final = false): Verdict | null {
  const trimmed = buffer.replace(/^\s+/, "");
  const nl = trimmed.indexOf("\n");
  if (nl === -1 && !final && trimmed.length < MAX_VERDICT_WAIT) {
    // Not enough text yet — unless it already can't be a verdict line.
    if (trimmed.length >= 8 && !/^\**verdict/i.test(trimmed)) return { verdict: "AGREE", reason: "", rest: trimmed };
    return null;
  }
  const line = nl === -1 ? trimmed : trimmed.slice(0, nl);
  const m = /^\**\s*verdict\s*:?\**\s*(agree|disagree)\b[\s:—–-]*(.*)$/i.exec(line.trim());
  if (!m) return { verdict: "AGREE", reason: "", rest: trimmed };
  return {
    verdict: m[1]!.toUpperCase() as "AGREE" | "DISAGREE",
    reason: m[2]!.replace(/\**$/, "").trim(),
    rest: nl === -1 ? "" : trimmed.slice(nl + 1).replace(/^\s*\n/, ""),
  };
}
