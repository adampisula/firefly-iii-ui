import { NextResponse, type NextRequest } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { searchAccounts } from "@/features/search/service";

export const dynamic = "force-dynamic";

const FIELDS = new Set(["all", "id", "name", "iban", "number"]);
const TYPES = new Set([
  "all",
  "asset",
  "expense",
  "revenue",
  "liability",
  "liabilities",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("query") ?? "").trim().slice(0, 200);
  const field = params.get("field") ?? "all";
  const type = params.get("type") ?? "all";
  if (!query) {
    return NextResponse.json(
      { error: "Enter an account search." },
      { status: 422 },
    );
  }
  if (!FIELDS.has(field) || !TYPES.has(type)) {
    return NextResponse.json(
      { error: "Unsupported account search field or type." },
      { status: 422 },
    );
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
    return NextResponse.json({
      accounts: await searchAccounts(context.client, query, field, type),
    });
  } catch {
    return NextResponse.json(
      { error: "Firefly could not complete this account search." },
      { status: 502 },
    );
  }
}
