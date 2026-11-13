import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProfileSchema, Profile } from "./types";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import { extractJson, LLMExtractor, MissingApiKeyError, LLMTimeoutError } from "./llm";
import { mergeProfile, matchAll, nextQuestionField, createEmptyProfile } from "./rules";
import { getSchemes } from "./data";
import { getQuestionForField } from "./questions";
import { getClientIp, checkRateLimit, rateLimitResponse } from "./rateLimit";

export const MAX_TRANSCRIPT_LENGTH = 1000;

const VALID_PROFILE_KEYS = new Set([
  "age",
  "gender",
  "marital_status",
  "has_land",
  "income_category",
  "state",
  "district",
  "dependents",
  "has_ration_card",
  "has_pucca_house",
]);

const UnderstandRequestSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(1, "transcript is required")
    .max(
      MAX_TRANSCRIPT_LENGTH,
      `transcript exceeds maximum length of ${MAX_TRANSCRIPT_LENGTH} characters`
    ),
  language: z.enum(["hi", "en"]).default("hi"),
  currentProfile: z.record(z.string(), z.unknown()).optional(),
});

function sanitizeProfile(raw?: Record<string, unknown>): Partial<Profile> {
  if (!raw) return {};
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (VALID_PROFILE_KEYS.has(key)) {
      cleaned[key] = val;
    }
  }
  const parsed = ProfileSchema.partial().safeParse(cleaned);
  return parsed.success ? parsed.data : {};
}

export async function handleUnderstand(
  request: NextRequest | Request,
  customExtractor?: LLMExtractor
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const extractor = customExtractor || extractJson;

  // Rate Limiting Check
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(clientIp);
  if (!rateLimitResult.allowed) {
    console.error(`[${requestId}] ErrorCode: RATE_LIMITED`);
    return rateLimitResponse(rateLimitResult.resetTime);
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error(`[${requestId}] ErrorCode: INVALID_INPUT (Invalid JSON)`);
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
      console.error(`[${requestId}] ErrorCode: INVALID_INPUT (Validation Failed)`);
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message:
              parseBodyResult.error.issues?.[0]?.message ||
              parseBodyResult.error.message ||
              "Invalid input",
          },
        },
        { status: 400 }
      );
    }

    const { transcript, language, currentProfile } = parseBodyResult.data;
    const sanitizedCurrentProfile = sanitizeProfile(currentProfile);

    const baseProfile: Profile = {
      ...createEmptyProfile(),
      ...sanitizedCurrentProfile,
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
        console.error(`[${requestId}] ErrorCode: MISSING_API_KEY`);
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
      if (err instanceof LLMTimeoutError || err?.name === "LLMTimeoutError") {
        console.error(`[${requestId}] ErrorCode: LLM_TIMEOUT`);
        return NextResponse.json(
          {
            error: {
              code: "LLM_FAILED",
              message: "LLM extraction timed out",
            },
          },
          { status: 502 }
        );
      }
      console.error(`[${requestId}] ErrorCode: LLM_CALL_FAILED_ATTEMPT_1`);
    }

    let parsedProfile = rawExtracted ? ProfileSchema.safeParse(rawExtracted) : null;

    // Retry once if invalid
    if (!parsedProfile || !parsedProfile.success) {
      try {
        rawExtracted = await extractor(EXTRACTION_SYSTEM_PROMPT, userMessage);
        parsedProfile = rawExtracted ? ProfileSchema.safeParse(rawExtracted) : null;
      } catch (retryErr: any) {
        if (retryErr instanceof LLMTimeoutError || retryErr?.name === "LLMTimeoutError") {
          console.error(`[${requestId}] ErrorCode: LLM_TIMEOUT_ON_RETRY`);
          return NextResponse.json(
            {
              error: {
                code: "LLM_FAILED",
                message: "LLM extraction timed out on retry",
              },
            },
            { status: 502 }
          );
        }
        console.error(`[${requestId}] ErrorCode: LLM_CALL_FAILED_RETRY`);
      }
    }

    // If still invalid after retry -> 502 LLM_FAILED
    if (!parsedProfile || !parsedProfile.success) {
      console.error(`[${requestId}] ErrorCode: LLM_FAILED`);
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
    console.error(`[${requestId}] ErrorCode: INTERNAL_ERROR`);
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
