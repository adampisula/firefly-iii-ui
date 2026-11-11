"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionApiContext } from "@/lib/auth/api-context";
import { ApiClientError } from "@/lib/api/client";
import {
  currencyPayload,
  validateCurrencyDraft,
  validateRate,
  type CurrencyDraft,
} from "./service";
export interface CurrencyActionState {
  ok: boolean;
  message: string;
  errors: Record<string, string>;
}
function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}
function checked(formData: FormData, key: string): boolean {
  const entry = formData.get(key);
  return entry === "on" || entry === "true";
}
function failure(error: unknown): CurrencyActionState {
  if (error instanceof ApiClientError)
    return {
      ok: false,
      message: error.message,
      errors: Object.fromEntries(
        error.fieldPaths.map((path) => [path, "Firefly rejected this field."]),
      ),
    };
  return {
    ok: false,
    message: "The currency operation could not be completed.",
    errors: {},
  };
}
async function contextOrError(): Promise<
  | {
      context: Awaited<ReturnType<typeof getSessionApiContext>>;
      error?: undefined;
    }
  | { context?: undefined; error: CurrencyActionState }
> {
  const context = await getSessionApiContext().catch(() => null);
  if (!context)
    return {
      error: {
        ok: false,
        message: "Connect a Firefly account first.",
        errors: {},
      },
    };
  if (context.compatibility.status !== "verified")
    return {
      error: {
        ok: false,
        message: "Writes are blocked until compatibility is verified.",
        errors: {},
      },
    };
  return { context };
}
export async function saveCurrencyAction(
  _previous: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const code = value(formData, "original_code");
  const draft: CurrencyDraft = {
    name: value(formData, "name"),
    code: value(formData, "code"),
    symbol: value(formData, "symbol"),
    decimalPlaces: value(formData, "decimal_places"),
    enabled: checked(formData, "enabled"),
    default: checked(formData, "default"),
  };
  const validation = validateCurrencyDraft(draft);
  if (!validation.ok)
    return {
      ok: false,
      message: "Check the currency fields.",
      errors: validation.errors,
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked.", errors: {} };
  try {
    if (code) {
      await context.client.request("currencies.update", {
        pathParameters: { currencyCode: code },
        body: currencyPayload(draft),
      });
      revalidatePath("/currencies");
      redirect(`/currencies/${draft.code.toUpperCase()}`);
    }
    await context.client.request("currencies.store", {
      body: currencyPayload(draft),
    });
    revalidatePath("/currencies");
    redirect("/currencies");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function currencyToggleAction(
  _previous: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const code = value(formData, "code");
  const action = value(formData, "action");
  if (!/^[A-Za-z]{3}$/.test(code))
    return { ok: false, message: "Invalid currency.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked.", errors: {} };
  try {
    if (action === "primary")
      await context.client.request("currencies.primary", {
        pathParameters: { currencyCode: code },
      });
    else if (action === "enable")
      await context.client.request("currencies.enable", {
        pathParameters: { currencyCode: code },
      });
    else if (action === "disable")
      await context.client.request("currencies.disable", {
        pathParameters: { currencyCode: code },
      });
    else return { ok: false, message: "Invalid action.", errors: {} };
    revalidatePath("/currencies");
    revalidatePath(`/currencies/${code}`);
    return { ok: true, message: "Currency updated.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function deleteCurrencyAction(
  _previous: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const code = value(formData, "code");
  if (!/^[A-Za-z]{3}$/.test(code))
    return { ok: false, message: "Invalid currency.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm currency deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked.", errors: {} };
  try {
    await context.client.request("currencies.delete", {
      pathParameters: { currencyCode: code },
    });
    revalidatePath("/currencies");
    redirect("/currencies");
  } catch (caught) {
    if (caught instanceof Error && caught.message === "NEXT_REDIRECT")
      throw caught;
    return failure(caught);
  }
}
export async function saveRateAction(
  _previous: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const from = value(formData, "from").toUpperCase();
  const to = value(formData, "to").toUpperCase();
  const date = value(formData, "date");
  const rate = value(formData, "rate").trim();
  const validation = validateRate(from, to, date, rate);
  if (!validation.ok)
    return {
      ok: false,
      message: "Check the exchange-rate fields.",
      errors: validation.errors,
    };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked.", errors: {} };
  try {
    await context.client.request("exchange-rates.store", {
      body: { from, to, date, rate },
    });
    revalidatePath("/exchange-rates");
    return { ok: true, message: "Exchange rate saved.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
export async function deleteRateAction(
  _previous: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const from = value(formData, "from").toUpperCase();
  const to = value(formData, "to").toUpperCase();
  const date = value(formData, "date");
  if (
    !/^[A-Za-z]{3}$/.test(from) ||
    !/^[A-Za-z]{3}$/.test(to) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  )
    return { ok: false, message: "Invalid rate identity.", errors: {} };
  if (value(formData, "confirm_delete") !== "yes")
    return { ok: false, message: "Confirm rate deletion.", errors: {} };
  const { context, error } = await contextOrError();
  if (!context) return error ?? { ok: false, message: "Blocked.", errors: {} };
  try {
    await context.client.request("exchange-rates.destroy.by-date", {
      pathParameters: { fromCurrencyCode: from, toCurrencyCode: to, date },
    });
    revalidatePath("/exchange-rates");
    return { ok: true, message: "Exchange rate deleted.", errors: {} };
  } catch (caught) {
    return failure(caught);
  }
}
