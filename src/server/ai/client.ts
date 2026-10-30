import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { estimateCostMicroUsd, MODELS_WITH_DEFAULT_FALLBACK } from "@/config/ai-pricing";

let client: Anthropic | undefined;

export function aiAvailable(): boolean {
  return !!env().ANTHROPIC_API_KEY;
}

/** Anthropic client (server-side only). Retries rate limits and server errors with backoff. */
export function anthropic(): Anthropic {
  if (!client) {
    const key = env().ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey: key, maxRetries: 4, timeout: 10 * 60 * 1000 });
  }
  return client;
}

export function models() {
  const e = env();
  return { fast: e.AI_MODEL_FAST, smart: e.AI_MODEL_SMART };
}

/**
 * Server-side refusal fallback: if the model declines a request, the API
 * re-runs it on Anthropic's recommended fallback model in the same call.
 * Only sent for models that accept it.
 */
export function fallbackParams(model: string): { betas?: ["server-side-fallback-2026-07-01"]; fallbacks?: "default" } {
  return MODELS_WITH_DEFAULT_FALLBACK.has(model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {};
}

export interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Record tokens and estimated cost of one call (Admin → AI usage, per-user quotas later). */
export async function logAiUsage(entry: { userId: string | null; feature: string; model: string; usage: UsageLike; refId?: string }) {
  const u = {
    inputTokens: entry.usage.input_tokens,
    outputTokens: entry.usage.output_tokens,
    cacheReadTokens: entry.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: entry.usage.cache_creation_input_tokens ?? 0,
  };
  await db.aiUsage.create({
    data: {
      userId: entry.userId,
      feature: entry.feature,
      model: entry.model,
      ...u,
      costMicroUsd: estimateCostMicroUsd(entry.model, u),
      refId: entry.refId ?? null,
    },
  });
}
