import { NextResponse, type NextRequest } from "next/server";
import { clearSession, verifyAndCreatePatSession } from "@/lib/auth/service";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { pat?: string };
    const pat = body.pat?.trim();

    if (!pat) {
      return NextResponse.json(
        { error: "Personal Access Token is required." },
        { status: 400 },
      );
    }

    const result = await verifyAndCreatePatSession(pat);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: result.session.user,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error during connection." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
