import { NextResponse, type NextRequest } from "next/server";
import { assistantEnabled } from "@/lib/assistant/config";
import { currentAssistantUser, sameOrigin } from "@/lib/assistant/http";
import { getProviderApiKey, getProviderSettings } from "@/lib/assistant/store";
import {
  defaultAssistantSettings,
  parseAssistantSettings,
  validateProviderBaseUrl,
} from "@/lib/assistant/provider-config";
import { listModels } from "@/lib/assistant/openrouter";

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
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const stored = getProviderSettings(user.ownerKey);
    const key =
      typeof body.apiKey === "string" && body.apiKey.trim()
        ? body.apiKey.trim()
        : stored
          ? getProviderApiKey(user.ownerKey, stored)
          : null;
    if (!key)
      return NextResponse.json(
        { error: "Enter an API key before testing the provider." },
        { status: 400 },
      );
    const baseUrl = validateProviderBaseUrl(
      typeof body.baseUrl === "string"
        ? body.baseUrl
        : (stored?.baseUrl ?? defaultAssistantSettings().baseUrl),
    );
    const settings = parseAssistantSettings(
      { ...body, baseUrl },
      stored ?? defaultAssistantSettings(),
    );
    const models = await listModels(baseUrl, key);
    const selected = models.find((model) => model.id === settings.model);
    return NextResponse.json({
      models,
      selected: selected ?? null,
      message: selected
        ? selected.supportsTools
          ? "Provider reachable. The selected model advertises tool calling."
          : "Provider reachable, but the selected model does not advertise tool calling."
        : "Provider reachable. The selected model was not listed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Provider connection test failed.",
      },
      { status: 400 },
    );
  }
}
