import { GoogleGenAI } from "@google/genai";

export class MissingApiKeyError extends Error {
  constructor(message = "GEMINI_API_KEY environment variable is missing") {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

export class LLMTimeoutError extends Error {
  constructor(message = "LLM call timed out after 12 seconds") {
    super(message);
    this.name = "LLMTimeoutError";
  }
}

export type LLMExtractor = (system: string, user: string) => Promise<unknown>;

export const LLM_TIMEOUT_MS = 12000; // 12 seconds

export async function extractJson(
  system: string,
  user: string,
  timeoutMs: number = LLM_TIMEOUT_MS
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new MissingApiKeyError();
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new LLMTimeoutError());
    }, timeoutMs);
  });

  const apiCallPromise = (async () => {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("EMPTY_LLM_RESPONSE");
    }

    return JSON.parse(text);
  })();

  try {
    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof MissingApiKeyError || error instanceof LLMTimeoutError) {
      throw error;
    }
    // Never leak API key in error message
    throw new Error("LLM_EXTRACTION_ERROR");
  }
}
