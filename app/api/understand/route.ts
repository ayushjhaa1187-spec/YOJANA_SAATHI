import { NextRequest } from "next/server";
import { handleUnderstand } from "@/lib/understand";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest | Request) {
  return handleUnderstand(request);
}
