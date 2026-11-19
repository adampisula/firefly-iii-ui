import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled } from "@/lib/assistant/config";
import { currentAssistantUser, sameOrigin } from "@/lib/assistant/http";
import { decideApproval } from "@/lib/assistant/approval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const body = (await request.json().catch(() => null)) as {
    approvalId?: unknown;
    conversationId?: unknown;
    decision?: unknown;
  } | null;
  if (
    typeof body?.approvalId !== "string" ||
    typeof body.conversationId !== "string" ||
    (body.decision !== "approve" && body.decision !== "deny")
  )
    return NextResponse.json(
      { error: "approvalId, conversationId and decision are required." },
      { status: 400 },
    );
  const decision = decideApproval(
    user.ownerKey,
    body.conversationId,
    body.approvalId,
    body.decision === "approve",
  );
  if (!decision)
    return NextResponse.json(
      { error: "Approval request not found, expired or already decided." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true, decision });
}
