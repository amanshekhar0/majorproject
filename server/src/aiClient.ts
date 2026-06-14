import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";

/**
 * Shared AI client factory with automatic provider fallback.
 *
 * Providers, in priority order:
 *  1. GROQ_API_KEY  → Groq (llama-3.3-70b-versatile)
 *  2. XAI_API_KEY   → xAI (grok-3-mini)
 *
 * `createChatCompletion` tries each configured provider in order and falls
 * through to the next one on ANY failure (rate limits, quota exhaustion,
 * network errors, etc.) so a single provider hitting its daily cap never
 * silently degrades the product to fallback/sample data.
 */

function isRealKey(key: string | undefined): key is string {
  if (!key) return false;
  const lower = key.trim().toLowerCase();
  if (
    lower.startsWith("your_") ||
    lower === "" ||
    lower === "placeholder" ||
    lower === "change_me"
  ) {
    return false;
  }
  return true;
}

interface AIProvider {
  label: string;
  client: OpenAI;
  model: string;
}

let cachedProviders: AIProvider[] | null = null;

export function getAIProviders(): AIProvider[] {
  if (cachedProviders) return cachedProviders;

  const providers: AIProvider[] = [];
  const groqKey = process.env.GROQ_API_KEY;
  const xaiKey = process.env.XAI_API_KEY;

  if (isRealKey(groqKey)) {
    const groqClient = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    // Two Groq models — each has its OWN daily token quota, so if the larger
    // model hits its cap we transparently fall back to the fast 8B model.
    providers.push({
      label: "Groq (llama-3.3-70b-versatile)",
      client: groqClient,
      model: "llama-3.3-70b-versatile",
    });
    providers.push({
      label: "Groq (llama-3.1-8b-instant)",
      client: groqClient,
      model: "llama-3.1-8b-instant",
    });
  }
  if (isRealKey(xaiKey)) {
    providers.push({
      label: "xAI (grok-3-mini)",
      client: new OpenAI({ apiKey: xaiKey, baseURL: "https://api.x.ai/v1" }),
      model: "grok-3-mini",
    });
  }

  cachedProviders = providers;
  return providers;
}

/** Backwards-compatible single-client accessor (first available provider). */
export function getAIClient(): { client: OpenAI; model: string } {
  const providers = getAIProviders();
  if (!providers.length) {
    throw new Error(
      "No valid AI API key found. Set GROQ_API_KEY or XAI_API_KEY in server/.env",
    );
  }
  const [{ client, model }] = providers;
  return { client, model };
}

type ChatParams = Omit<
  OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  "model"
>;

/**
 * Run a chat completion against the first provider that succeeds.
 * Returns the assistant message content as a string.
 */
export async function createChatCompletion(params: ChatParams): Promise<string> {
  const providers = getAIProviders();
  if (!providers.length) {
    throw new Error(
      "No valid AI API key found. Set GROQ_API_KEY or XAI_API_KEY in server/.env",
    );
  }

  let lastError: unknown;
  for (const provider of providers) {
    try {
      const result = await provider.client.chat.completions.create({
        ...params,
        model: provider.model,
      });
      return result.choices[0]?.message?.content ?? "";
    } catch (err) {
      lastError = err;
      console.warn(
        `[AI] Provider "${provider.label}" failed: ${
          (err as Error).message
        }. Falling back to next provider…`,
      );
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("All AI providers failed");
}
