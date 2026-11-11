export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface AppError {
  code: string;
  message: string;
  retryable: boolean;
}

export type IdentityState =
  | { status: "anonymous" }
  | { status: "connected"; displayName: string }
  | { status: "verification-required"; reason: string };

export type Capability =
  | { status: "available" }
  | { status: "unsupported"; reason: string }
  | { status: "unverified"; reason: string };

export type FinancialAmount = {
  amount: string;
  currencyCode: string;
};

export type FinancialDate =
  | { kind: "date-only"; value: string }
  | { kind: "timestamp"; value: string; timeZone: string };
