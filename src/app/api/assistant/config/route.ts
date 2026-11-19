import { NextResponse } from "next/server";
import { assistantEnabled } from "@/lib/assistant/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    enabled: assistantEnabled(),
    provider: "openrouter",
  });
}
