import { NextResponse } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid attachment." }, { status: 400 });
  }
  const context = await getSessionApiContext().catch(() => null);
  if (!context) {
    return NextResponse.json({ error: "Not connected." }, { status: 401 });
  }
  if (context.compatibility.status !== "verified") {
    return NextResponse.json(
      { error: "Compatibility is not verified." },
      { status: 409 },
    );
  }
  try {
    const response = await context.client.request<Blob>(
      "attachments.download",
      {
        pathParameters: { attachment: id },
        responseType: "binary",
      },
    );
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";
    const disposition =
      response.headers.get("content-disposition") ?? "attachment";
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Attachment could not be downloaded." },
      { status: 404 },
    );
  }
}
