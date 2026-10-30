/** "YYYY-MM-DD" for a moment in a given IANA time zone. */
export function dayInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive days with practice, counting back from today. A streak stays
 * alive until the end of today, so practising yesterday but not yet today
 * still counts.
 */
export function computeStreak(activeDays: Iterable<string>, today: string): number {
  const days = new Set(activeDays);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** The moment the current day began in a time zone (for daily limits). */
export function startOfDayInZone(date: Date, timeZone: string): Date {
  const utcMidnight = new Date(`${dayInZone(date, timeZone)}T00:00:00Z`);
  const asLocal = new Date(utcMidnight.toLocaleString("en-US", { timeZone }));
  const asUtc = new Date(utcMidnight.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(utcMidnight.getTime() - (asLocal.getTime() - asUtc.getTime()));
}
