import { GoogleGenAI } from "@google/genai";
import type { Category } from "@/lib/agents/schemas";

export const GEMINI_MODEL = "gemini-flash-latest";

// Optional per-category API keys let each agent draw from a separate Gemini
// project's quota instead of sharing one pool (free tier: 20 requests/day
// PER PROJECT -- confirmed during setup testing). A key only helps here if
// it belongs to a genuinely different Google Cloud/AI Studio project; five
// keys from the same project still share one 20/day pool. Falls back to
// GEMINI_API_KEY when a category-specific key isn't set.
const clients = new Map<string, GoogleGenAI>();

function getClient(category: Category): GoogleGenAI {
  const envVar = `GEMINI_API_KEY_${category.toUpperCase()}`;
  const apiKey = process.env[envVar] || process.env.GEMINI_API_KEY;
  const cacheKey = apiKey ?? "default";

  let client = clients.get(cacheKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(cacheKey, client);
  }
  return client;
}

const RETRYABLE_STATUS = new Set([503, 429]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 429 responses include an exact RetryInfo.retryDelay in the error body.
// Honor it instead of guessing.
function retryDelayMs(err: unknown): number | null {
  try {
    const parsed = JSON.parse((err as Error).message);
    const detail = parsed?.error?.details?.find((d: { "@type"?: string }) =>
      d["@type"]?.includes("RetryInfo")
    );
    const seconds = parseFloat(detail?.retryDelay ?? "");
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  } catch {
    return null;
  }
}

// The model is also prone to transient 503 (overloaded) responses -- also
// confirmed during setup testing, not hypothetical.
export async function generateStructuredJson<T>(params: {
  category: Category;
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<T> {
  const { category, systemPrompt, prompt, schema } = params;
  const ai = getClient(category);
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      });
      return JSON.parse(response.text ?? "");
    } catch (err) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (!RETRYABLE_STATUS.has(status ?? 0) || attempt === 2) throw err;
      await sleep(retryDelayMs(err) ?? 500 * 2 ** attempt);
    }
  }
  throw lastError;
}
