import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled, ASSISTANT_DEFAULTS } from "@/lib/assistant/config";
import { currentAssistantUser, sameOrigin } from "@/lib/assistant/http";
import {
  createConversation,
  getProviderSettings,
  listConversations,
} from "@/lib/assistant/store";

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
  const settings = getProviderSettings(user.ownerKey);
  const retention =
    settings?.historyRetentionDays ?? ASSISTANT_DEFAULTS.historyRetentionDays;
  return NextResponse.json({
    conversations: listConversations(user.ownerKey, retention),
  });
}

export async function POST(request: NextRequest) {
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
  const settings = getProviderSettings(user.ownerKey);
  const body = (await request.json().catch(() => ({}))) as {
    title?: unknown;
  };
  const conversation = createConversation(
    user.ownerKey,
    settings?.model ?? ASSISTANT_DEFAULTS.model,
    settings?.reasoningEffort ?? ASSISTANT_DEFAULTS.reasoningEffort,
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "New conversation",
  );
  return NextResponse.json({ conversation });
}
