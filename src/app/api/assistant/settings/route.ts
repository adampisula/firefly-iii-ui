import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled } from "@/lib/assistant/config";
import { currentAssistantUser, sameOrigin } from "@/lib/assistant/http";
import {
  deleteProviderSettings,
  getProviderSettings,
  saveProviderSettings,
} from "@/lib/assistant/store";
import { publicAssistantSettings } from "@/lib/assistant/provider-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!assistantEnabled())
    return NextResponse.json(
      { error: "The assistant is disabled by AI_ASSISTANT_ENABLED." },
      { status: 404 },
    );
  const user = await currentAssistantUser();
  if (!user)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  return NextResponse.json({
    settings: publicAssistantSettings(getProviderSettings(user.ownerKey)),
  });
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  if (!assistantEnabled())
    return NextResponse.json(
      { error: "The assistant is disabled by AI_ASSISTANT_ENABLED." },
      { status: 404 },
    );
  const user = await currentAssistantUser();
  if (!user)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const apiKey =
      typeof body.apiKey === "string" ? body.apiKey.trim() : undefined;
    const settings = saveProviderSettings(user.ownerKey, body, apiKey);
    return NextResponse.json({ settings: publicAssistantSettings(settings) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Assistant settings could not be saved.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const user = await currentAssistantUser();
  if (!user)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  deleteProviderSettings(user.ownerKey);
  return NextResponse.json({ ok: true });
}
