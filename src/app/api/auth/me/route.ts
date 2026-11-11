import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth/service";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth.session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.session.user,
    authType: auth.session.authType,
  });
}
