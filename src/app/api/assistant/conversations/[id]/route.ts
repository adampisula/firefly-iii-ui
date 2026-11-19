import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled } from "@/lib/assistant/config";
import { currentAssistantUser, sameOrigin } from "@/lib/assistant/http";
import {
  deleteConversation,
  getConversation,
  updateConversationTitle,
} from "@/lib/assistant/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params;
  const conversation = getConversation(user.ownerKey, id);
  if (!conversation)
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  return NextResponse.json({ conversation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { title?: unknown };
  if (typeof body.title !== "string" || !body.title.trim())
    return NextResponse.json(
      { error: "A title is required." },
      { status: 400 },
    );
  if (!getConversation(user.ownerKey, id))
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  updateConversationTitle(user.ownerKey, id, body.title.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
  const { id } = await params;
  if (!deleteConversation(user.ownerKey, id))
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
