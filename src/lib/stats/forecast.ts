/**
 * Progress forecast (v3 plan §7.3): least squares over the last scores,
 * projected to test day, with a ± band from the fit's spread. Always shown
 * as an estimate. Needs at least 4 scores.
 */
export function forecastScore(points: { day: number; score: number }[], targetDay: number): { score: number; band: number } | null {
  const pts = points.slice(-8);
  if (pts.length < 4 || targetDay <= pts.at(-1)!.day) return null;
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.day, 0) / n;
  const my = pts.reduce((s, p) => s + p.score, 0) / n;
  const sxx = pts.reduce((s, p) => s + (p.day - mx) ** 2, 0);
  const slope = sxx === 0 ? 0 : pts.reduce((s, p) => s + (p.day - mx) * (p.score - my), 0) / sxx;
  // Gains slow down: cap the projected rise at 3 points a day and 200 overall.
  const rise = Math.max(-200, Math.min(200, slope * (targetDay - pts.at(-1)!.day), 3 * (targetDay - pts.at(-1)!.day)));
  const fitLast = my + slope * (pts.at(-1)!.day - mx);
  const resid = Math.sqrt(pts.reduce((s, p) => s + (p.score - (my + slope * (p.day - mx))) ** 2, 0) / Math.max(1, n - 2));
  const round10 = (v: number) => Math.round(v / 10) * 10;
  const score = Math.max(400, Math.min(1600, round10(fitLast + rise)));
  const band = Math.max(30, Math.min(150, round10(resid * 1.5 + Math.abs(rise) * 0.25)));
  return { score, band };
}
