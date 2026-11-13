import { NextRequest, NextResponse } from "next/server";
import { getScheme, getDocumentsForScheme } from "@/lib/data";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  _request: NextRequest | Request,
  context: RouteContext
) {
  try {
    const schemeId = context?.params?.id;
    if (!schemeId) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Scheme ID is required",
          },
        },
        { status: 400 }
      );
    }

    const scheme = getScheme(schemeId);
    if (!scheme) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Scheme with ID '${schemeId}' not found`,
          },
        },
        { status: 404 }
      );
    }

    const documents = getDocumentsForScheme(scheme.id);

    return NextResponse.json(
      {
        scheme: {
          id: scheme.id,
          name_hi: scheme.name_hi,
          name_en: scheme.name_en,
          apply_url: scheme.apply_url,
        },
        documents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Documents API Error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "Internal server error fetching documents",
        },
      },
      { status: 500 }
    );
  }
}
