import { NextResponse, type NextRequest } from "next/server";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { getServerEnvironment } from "@/lib/server-env";
import {
  describeOnboardingError,
  loadOnboardingState,
  runOnboarding,
  validateOnboardingInput,
} from "@/features/onboarding/service";

export const dynamic = "force-dynamic";

function configurationError() {
  return NextResponse.json(
    {
      error:
        "The frontend is not configured to reach Firefly. Set BACKEND_INTERNAL_API_URL, BACKEND_PUBLIC_URL and FRONTEND_PUBLIC_URL.",
    },
    { status: 503 },
  );
}

export async function GET() {
  let context;
  try {
    context = await getSessionApiContext();
  } catch {
    return configurationError();
  }
  if (!context) {
    return NextResponse.json(
      { error: "Connect a Firefly account to continue." },
      { status: 401 },
    );
  }
  if (context.compatibility.status !== "verified") {
    return NextResponse.json(
      {
        error:
          "Financial setup is blocked until this session verifies Firefly III 6.7.9. Reconnect to check compatibility.",
      },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json(await loadOnboardingState(context.client));
  } catch (error) {
    return NextResponse.json(
      { error: describeOnboardingError(error) },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  let environment;
  try {
    environment = getServerEnvironment();
  } catch {
    return configurationError();
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== environment.frontendPublicUrl.origin) {
    return NextResponse.json(
      { error: "Cross-origin setup requests are not allowed." },
      { status: 403 },
    );
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Setup requests must use JSON." },
      { status: 415 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The setup request was not valid JSON." },
      { status: 400 },
    );
  }

  const validation = validateOnboardingInput(payload);
  if (!validation.ok || !validation.input) {
    return NextResponse.json(
      { error: validation.errors[0] ?? "The setup request was not valid." },
      { status: 422 },
    );
  }

  let context;
  try {
    context = await getSessionApiContext();
  } catch {
    return configurationError();
  }
  if (!context) {
    return NextResponse.json(
      { error: "Connect a Firefly account to continue." },
      { status: 401 },
    );
  }
  if (context.compatibility.status !== "verified") {
    return NextResponse.json(
      {
        error:
          "Financial setup is blocked until this session verifies Firefly III 6.7.9. Reconnect to check compatibility.",
      },
      { status: 409 },
    );
  }

  try {
    const result = await runOnboarding(context.client, validation.input);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: describeOnboardingError(error) },
      { status: 502 },
    );
  }
}
