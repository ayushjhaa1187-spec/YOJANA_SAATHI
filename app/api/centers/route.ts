import { NextRequest, NextResponse } from "next/server";
import { getCenters } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest | Request) {
  try {
    const url = new URL(request.url, "http://localhost");
    const district = url.searchParams.get("district");
    const centers = getCenters(district);

    return NextResponse.json({ centers }, { status: 200 });
  } catch (error) {
    console.error("Centers API Error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "Internal server error fetching centers",
        },
      },
      { status: 500 }
    );
  }
}
