import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProfileSchema, Profile } from "./types";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import { extractJson, LLMExtractor, MissingApiKeyError } from "./llm";
import { mergeProfile, matchAll, nextQuestionField, createEmptyProfile } from "./rules";
import { getSchemes } from "./data";
import { getQuestionForField } from "./questions";

const UnderstandRequestSchema = z.object({
  transcript: z.string().trim().min(1, "transcript is required"),
  language: z.enum(["hi", "en"]).default("hi"),
  currentProfile: ProfileSchema.partial().optional(),
});

export async function handleUnderstand(
  request: NextRequest | Request,
  customExtractor?: LLMExtractor
) {
  const extractor = customExtractor || extractJson;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Request body must be valid JSON",
          },
        },
        { status: 400 }
      );
    }

    const parseBodyResult = UnderstandRequestSchema.safeParse(body);
    if (!parseBodyResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: parseBodyResult.error.issues?.[0]?.message || parseBodyResult.error.message || "Invalid input",
          },
        },
        { status: 400 }
      );
    }

    const { transcript, language, currentProfile } = parseBodyResult.data;

    const baseProfile = {
      ...createEmptyProfile(),
      ...(currentProfile || {}),
    };

    const userMessage = JSON.stringify({
      transcript,
      currentProfile: baseProfile,
    });

    let rawExtracted: unknown;
    try {
      rawExtracted = await extractor(EXTRACTION_SYSTEM_PROMPT, userMessage);
    } catch (err: any) {
      if (err instanceof MissingApiKeyError || err?.name === "MissingApiKeyError") {
        console.error("Understand API Error: Missing GEMINI_API_KEY");
        return NextResponse.json(
          {
            error: {
              code: "LLM_FAILED",
              message: "LLM extraction service not configured",
            },
          },
          { status: 502 }
        );
      }
      console.error("Understand API Error on initial extraction:", err?.message || err);
    }

    let parsedProfile = rawExtracted ? ProfileSchema.safeParse(rawExtracted) : null;

    // Retry once if invalid
    if (!parsedProfile || !parsedProfile.success) {
      try {
        rawExtracted = await extractor(EXTRACTION_SYSTEM_PROMPT, userMessage);
        parsedProfile = rawExtracted ? ProfileSchema.safeParse(rawExtracted) : null;
      } catch (retryErr: any) {
        console.error("Understand API Error on extraction retry:", retryErr?.message || retryErr);
      }
    }

    // If still invalid after retry -> 502 LLM_FAILED
    if (!parsedProfile || !parsedProfile.success) {
      return NextResponse.json(
        {
          error: {
            code: "LLM_FAILED",
            message: "Failed to extract valid profile from speech",
          },
        },
        { status: 502 }
      );
    }

    // Merge: new non-null values overwrite old ones; null never erases known values
    const mergedProfile: Profile = mergeProfile(baseProfile, parsedProfile.data);

    const schemes = getSchemes();
    const matches = matchAll(mergedProfile, schemes);
    const nextField = nextQuestionField(matches);

    const missingFields: (keyof Profile)[] = Array.from(
      new Set(matches.filter((m) => m.status === "maybe").flatMap((m) => m.missing))
    );

    const nextQuestion = nextField
      ? getQuestionForField(nextField, language)
      : null;

    return NextResponse.json(
      {
        profile: mergedProfile,
        missingFields,
        nextQuestion,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Understand API Internal Error:", error?.message || error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "Internal server error during speech understanding",
        },
      },
      { status: 500 }
    );
  }
}
