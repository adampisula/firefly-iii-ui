import { decimalToUnits, unitsToDecimal } from "../finance/decimal.ts";

export function adjustPiggyAmount(
  current: string,
  amount: string,
  decimalPlaces: number,
  direction: "add" | "remove",
): string {
  const currentUnits = decimalToUnits(current, decimalPlaces);
  const amountUnits = decimalToUnits(amount, decimalPlaces);
  if (amountUnits <= 0n) throw new Error("amount must be positive.");
  const next =
    direction === "add"
      ? currentUnits + amountUnits
      : currentUnits - amountUnits;
  if (next < 0n)
    throw new Error(
      "The savings goal does not have enough reserved money for that removal.",
    );
  return unitsToDecimal(next, decimalPlaces);
}
