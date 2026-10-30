/** Split milliseconds into minutes and seconds and let the caller format them in the user's language. */
export function formatDuration(ms: number, fmt: (min: number, sec: number) => string): string {
  const total = Math.round(ms / 1000);
  return fmt(Math.floor(total / 60), total % 60);
}
