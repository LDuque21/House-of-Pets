import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-flash-latest";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const RETRYABLE_STATUS = new Set([503, 429]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 429 responses (free-tier quota: 5 req/min/model, confirmed during setup
// testing -- 4 parallel category calls sit right at that ceiling) include an
// exact RetryInfo.retryDelay in the error body. Honor it instead of guessing.
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
  systemPrompt: string;
  prompt: string;
  schema: object;
}): Promise<T> {
  const { systemPrompt, prompt, schema } = params;
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
