declare const transactionGroupBrand: unique symbol;
declare const transactionJournalBrand: unique symbol;

export type TransactionGroupId = string & {
  readonly [transactionGroupBrand]: true;
};
export type TransactionJournalId = string & {
  readonly [transactionJournalBrand]: true;
};

function numericId(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new TypeError(
      "Firefly transaction identifiers must be numeric strings.",
    );
  }
  return value;
}

export function transactionGroupId(value: string): TransactionGroupId {
  return numericId(value) as TransactionGroupId;
}

export function transactionJournalId(value: string): TransactionJournalId {
  return numericId(value) as TransactionJournalId;
}

export interface TransactionIdentity {
  groupId: TransactionGroupId;
  journalIds: readonly TransactionJournalId[];
}

export function transactionIdentity(
  groupId: TransactionGroupId,
  journalIds: readonly TransactionJournalId[],
): TransactionIdentity {
  return { groupId, journalIds: [...journalIds] };
}
