import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";
import { anthropic, fallbackParams, logAiUsage } from "./client";

export class AiCallError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
  ) {
    super(message);
  }
}

/**
 * One request whose reply must match a JSON schema (structured output),
 * validated again with Zod. Usage is logged per feature and user.
 */
export async function generateJson<T>(opts: {
  model: string;
  system: string;
  user: string;
  jsonSchema: object;
  schema: ZodType<T>;
  maxTokens: number;
  feature: string;
  userId: string | null;
  refId?: string;
}): Promise<T> {
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await anthropic()
      .beta.messages.stream({
        model: opts.model,
        max_tokens: opts.maxTokens,
        ...fallbackParams(opts.model),
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        output_config: { format: { type: "json_schema", schema: opts.jsonSchema as Record<string, unknown> } },
        messages: [{ role: "user", content: opts.user }],
      })
      .finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) {
      throw new AiCallError(`AI service unavailable: ${e.message}`, true);
    }
    if (e instanceof Anthropic.APIError) throw new AiCallError(`AI request failed (${e.status}): ${e.message}`, false);
    throw e;
  }
  await logAiUsage({ userId: opts.userId, feature: opts.feature, model: response.model, usage: response.usage, refId: opts.refId });

  if (response.stop_reason === "refusal") throw new AiCallError("The AI declined the request.", false);
  if (response.stop_reason === "max_tokens") throw new AiCallError("The reply was too long.", false);
  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")?.text;
  if (!text) throw new AiCallError("The AI returned no data.", true);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiCallError("The AI returned malformed data.", true);
  }
  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) throw new AiCallError(`The AI returned unexpected data: ${parsed.error.issues[0]?.message ?? ""}`, true);
  return parsed.data;
}
