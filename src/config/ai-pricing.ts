/**
 * Anthropic prices in US dollars per million tokens, used to estimate the
 * cost of each AI call (Admin → AI usage). Update when prices change.
 * Cache writes are billed at 1.25× input for the 5-minute cache.
 */
export const AI_PRICING: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
  "claude-opus-5": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-fable-5-1": { input: 10, output: 50, cacheRead: 0.25 },
};

/** Models that accept the server-side refusal fallback (`fallbacks: "default"`). */
export const MODELS_WITH_DEFAULT_FALLBACK = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-opus-5", "claude-fable-5-1"]);

export function estimateCostMicroUsd(
  model: string,
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number },
): number {
  const p = AI_PRICING[model] ?? AI_PRICING["claude-sonnet-5-5"]!;
  const dollars =
    (usage.inputTokens * p.input + usage.cacheWriteTokens * p.input * 1.25 + usage.cacheReadTokens * p.cacheRead + usage.outputTokens * p.output) / 1_000_000;
  return Math.round(dollars * 1_000_000);
}
