import { NextResponse } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";

export const dynamic = "force-dynamic";
const RESOURCES = [
  "accounts",
  "bills",
  "subscriptions",
  "budgets",
  "categories",
  "piggy-banks",
  "recurring",
  "rules",
  "tags",
  "transactions",
] as const;
type Resource = (typeof RESOURCES)[number];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  if (!RESOURCES.includes(resource as Resource))
    return NextResponse.json({ error: "Unsupported export." }, { status: 404 });
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return NextResponse.json({ error: "Not connected." }, { status: 401 });
  if (context.compatibility.status !== "verified")
    return NextResponse.json(
      { error: "Compatibility is not verified." },
      { status: 409 },
    );
  try {
    const response = await context.client.request<Blob>(
      `data.export.${resource}` as Resource extends never
        ? never
        : `data.export.${Resource}`,
      { responseType: "binary" },
    );
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "text/csv",
        "Content-Disposition": `attachment; filename="${resource}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Export could not be generated." },
      { status: 500 },
    );
  }
}
