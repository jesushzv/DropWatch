import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { ZodType } from "zod";

/**
 * Anthropic direct (ADR-4) — replaces the Manus forge gateway. The app's two
 * LLM paths (alert parsing, deal verdicts) are single short calls, so this
 * module exposes exactly two operations rather than a general chat surface.
 * The SDK handles retries/backoff itself (2 retries on 429/5xx by default).
 */
export const DEFAULT_LLM_MODEL = "claude-opus-5";

export function llmModel() {
  return process.env.ANTHROPIC_MODEL || DEFAULT_LLM_MODEL;
}

let _client: Anthropic | null = null;

function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

export type GenerateInput = {
  system: string;
  user: string;
  maxTokens?: number;
};

/** One prompt in, plain text out. Throws on refusal or an empty response. */
export async function generateText(input: GenerateInput): Promise<string> {
  const response = await client().messages.create({
    model: llmModel(),
    max_tokens: input.maxTokens ?? 1024,
    system: input.system,
    messages: [{ role: "user", content: input.user }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();
  if (!text) throw new Error("The model returned no text.");
  return text;
}

/** One prompt in, schema-validated JSON out. Throws when parsing fails. */
export async function generateStructured<T>(input: GenerateInput & { schema: ZodType<T> }): Promise<T> {
  const response = await client().messages.parse({
    model: llmModel(),
    max_tokens: input.maxTokens ?? 1024,
    system: input.system,
    messages: [{ role: "user", content: input.user }],
    output_config: {
      format: zodOutputFormat(input.schema),
    },
  });
  if (response.stop_reason === "refusal" || response.parsed_output == null) {
    throw new Error("The model returned no structured result.");
  }
  return response.parsed_output;
}
