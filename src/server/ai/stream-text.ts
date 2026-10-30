import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "./client";
import type { UsageLike } from "./client";

export type TextContent = Anthropic.Beta.BetaContentBlockParam;

export interface StreamTextArgs {
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string | TextContent[] }[];
  maxTokens: number;
}

export interface TextStream {
  /** Text as it is generated (thinking is not included). */
  text: AsyncIterable<string>;
  /** Resolves when the reply is complete (or rejects if aborted/failed). */
  done: Promise<{ model: string; usage: UsageLike; stopReason: string | null }>;
  abort(): void;
}

/** Stream a plain-text reply. The system prompt is cached between requests. */
export function streamText(args: StreamTextArgs): TextStream {
  const stream = anthropic().beta.messages.stream({
    model: args.model,
    max_tokens: args.maxTokens,
    system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
    messages: args.messages,
  });
  async function* text() {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
  }
  const done = stream.finalMessage().then((m) => ({ model: m.model, usage: m.usage, stopReason: m.stop_reason }));
  done.catch(() => {}); // the caller awaits it; avoid an unhandled rejection after abort
  return { text: text(), done, abort: () => stream.abort() };
}
