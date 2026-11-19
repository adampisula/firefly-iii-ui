import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAuth } from "@/lib/auth/service";
import { getServerEnvironment } from "@/lib/server-env";
import {
  MAX_BACKGROUND_BYTES,
  deleteBackground,
  readBackground,
  writeBackground,
} from "@/lib/appearance/server-store";

export const runtime = "nodejs";
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
    const background = await readBackground(userId);
    if (!background)
      return NextResponse.json(
        { error: "No background image is stored." },
        { status: 404 },
      );
    return new Response(new Uint8Array(background.buffer), {
      headers: {
        "Content-Type": background.mime,
        "Content-Length": String(background.buffer.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Background could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_BACKGROUND_BYTES + 512 * 1024
    ) {
      return NextResponse.json(
        { error: "The background image must be 8 MB or smaller." },
        { status: 413 },
      );
    }
    const form = await request.formData();
    const file = form.get("background");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "Choose an image to upload." },
        { status: 400 },
      );
    if (file.size > MAX_BACKGROUND_BYTES)
      return NextResponse.json(
        { error: "The background image must be 8 MB or smaller." },
        { status: 413 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const settings = await writeBackground(userId, file.type, buffer);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Background could not be uploaded.",
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
    const settings = await deleteBackground(userId);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Background could not be removed." },
      { status: 500 },
    );
  }
}
