import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";
import { parseAppearance } from "@/lib/appearance";
import {
  deleteAppearance,
  readAppearance,
  writeAppearance,
} from "@/lib/appearance/server-store";

export const dynamic = "force-dynamic";

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return origin === getServerEnvironment().frontendPublicUrl.origin;
  } catch {
    return false;
  }
}

async function currentUser() {
  const auth = await getCurrentAuth();
  return auth.session?.user.id ?? null;
}

export async function GET() {
  const userId = await currentUser();
  if (!userId)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  try {
    const result = await readAppearance(userId);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Appearance could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const userId = await currentUser();
  if (!userId)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  try {
    const body = (await request.json()) as unknown;
    if (typeof body !== "object" || body === null)
      return NextResponse.json(
        { error: "Appearance settings are required." },
        { status: 400 },
      );
    const settings = parseAppearance(JSON.stringify(body));
    const saved = await writeAppearance(userId, settings);
    return NextResponse.json({ settings: saved });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Appearance could not be saved.",
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
  const userId = await currentUser();
  if (!userId)
    return NextResponse.json(
      { error: "Connect an account first." },
      { status: 401 },
    );
  try {
    await deleteAppearance(userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Appearance could not be reset." },
      { status: 500 },
    );
  }
}
