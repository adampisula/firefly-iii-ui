import { NextResponse, type NextRequest } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";
import {
  findAutocompleteFamily,
  normalizeAutocomplete,
} from "@/features/search/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ family: string }> },
) {
  const { family: familyId } = await params;
  const family = findAutocompleteFamily(familyId);
  if (!family) {
    return NextResponse.json(
      { error: "Unknown autocomplete family." },
      { status: 404 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const query = (searchParams.get("query") ?? "").slice(0, 200);
  const rawLimit = Number(searchParams.get("limit") ?? 15);
  const limit = Number.isInteger(rawLimit)
    ? Math.min(50, Math.max(1, rawLimit))
    : 15;
  const types = family.supportsTypes
    ? (searchParams.get("types") ?? "").slice(0, 200)
    : "";
  const date = family.supportsDate ? (searchParams.get("date") ?? "") : "";

  if (types && !/^[a-z_,]+$/.test(types)) {
    return NextResponse.json(
      { error: "Invalid account types." },
      { status: 422 },
    );
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 422 });
  }

  let context;
  try {
    context = await getSessionApiContext();
  } catch {
    return NextResponse.json(
      { error: "The frontend is not configured to reach Firefly." },
      { status: 503 },
    );
  }
  if (!context) {
    return NextResponse.json(
      { error: "Connect a Firefly account to search." },
      { status: 401 },
    );
  }
  if (context.compatibility.status !== "verified") {
    return NextResponse.json(
      { error: "Financial search is blocked until compatibility is verified." },
      { status: 409 },
    );
  }

  try {
    const response = await context.client.request(family.operation, {
      query: {
        query,
        limit,
        ...(types ? { types } : {}),
        ...(date ? { date } : {}),
      },
    });
    return NextResponse.json({ options: normalizeAutocomplete(response.data) });
  } catch {
    return NextResponse.json(
      { error: "Firefly could not complete this lookup." },
      { status: 502 },
    );
  }
}
