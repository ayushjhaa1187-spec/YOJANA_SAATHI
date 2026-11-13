import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProfileSchema, Profile } from "@/lib/types";
import { matchAll, createEmptyProfile } from "@/lib/rules";
import { getSchemes, getScheme } from "@/lib/data";

const MatchRequestBodySchema = z.object({
  profile: ProfileSchema.partial(),
});

export async function POST(request: NextRequest | Request) {
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

    const parseResult = MatchRequestBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: parseResult.error.message,
          },
        },
        { status: 400 }
      );
    }

    const empty = createEmptyProfile();
    const fullProfile: Profile = {
      ...empty,
      ...parseResult.data.profile,
    };

    const schemes = getSchemes();
    const evaluatedMatches = matchAll(fullProfile, schemes);

    const formattedMatches = evaluatedMatches.map((m) => {
      const scheme = getScheme(m.schemeId);
      return {
        schemeId: m.schemeId,
        name_hi: m.name_hi || scheme?.name_hi || "",
        name_en: m.name_en || scheme?.name_en || "",
        category: m.category || scheme?.category || "",
        status: m.status,
        benefit_text_hi: m.benefit_text_hi || scheme?.benefit_text_hi || "",
        benefit_text_en: scheme?.benefit_text_en || "",
        reason_hi: m.reason_hi,
        missing: m.missing,
      };
    });

    return NextResponse.json({ matches: formattedMatches }, { status: 200 });
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "Internal server error during scheme matching",
        },
      },
      { status: 500 }
    );
  }
}
