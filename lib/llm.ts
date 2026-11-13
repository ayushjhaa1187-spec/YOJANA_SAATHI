import { GoogleGenAI } from "@google/genai";

export class MissingApiKeyError extends Error {
  constructor(message = "GEMINI_API_KEY environment variable is missing") {
    super(message);
    this.name = "MissingApiKeyError";
  }
}

export type LLMExtractor = (system: string, user: string) => Promise<unknown>;

export async function extractJson(
  system: string,
  user: string
): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new MissingApiKeyError();
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  try {
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
  } catch (error: any) {
    if (error instanceof MissingApiKeyError) {
      throw error;
    }
    // Never leak API key in error message
    throw new Error(`LLM_EXTRACTION_ERROR: ${error?.message || "Unknown error"}`);
  }
}
