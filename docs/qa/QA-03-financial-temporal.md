# QA-03 — Financial precision, English formatting and temporal audit

Date: 2026-11-11.

- `tests/qa-financial.test.mjs` verifies zero, three-decimal KWD, huge, negative and zero-decimal JPY money formatting; amounts are passed as decimal strings and are not Number-coerced.
- Transaction payload tests assert split amounts remain exact decimal strings; live split PUT tests retain every `transaction_journal_id` and backend returns 12-decimal amounts.
- Clone strips journal IDs/reconciled state; conversion preserves IDs and rejects unsafe account directions; reconciled rows are protected from generic edits.
- Temporal ranges are date-only (`YYYY-MM-DD`), inclusive in the backend request, and tested for this-month, last-30-days, year-to-date and all-time.
- English-only labels/messages; currency-aware number formatting remains independent from interface language. No translation/RTL pipeline is shipped.
- Live tests cover budget period duplicate rejection, recurrence boundaries, liabilities/opening balances, subscription amounts, piggy reads/events and category/tag Unicode.

## Limits

- Reconciliation invariants and report before/after balances are unverified residuals (no API).
- Positive piggy allocation mutation returned an undisclosed backend `bcsub()` error in the fixture; it is not claimed as verified.
- No DST/leap-day fixture with a non-UTC user timezone was available; date-only handling and backend boundaries are tested, physical-timezone behavior is disclosed as residual.
