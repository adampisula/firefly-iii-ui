# Deterministic Firefly fixtures

Every amount, date, account name, user email, and identifier here is synthetic. These fixtures test representation and safety behavior; they are not captured production data and do not prove live 6.7.9 response behavior. The fixture schemas follow inspected 6.7.9 source contracts:

- `firefly-iii/app/Transformers/UserTransformer.php` emits `email`, `blocked`, `blocked_code`, and `role`; `database/seeders/PermissionSeeder.php` defines `owner` and `demo` roles.
- `firefly-iii/app/Transformers/AccountTransformer.php` emits account `active`/`type`, currency and primary-currency precision, decimal-string balances, liability fields, and `include_net_worth`.
- `firefly-iii/app/Transformers/TransactionGroupTransformer.php` emits a group ID separately from each `transaction_journal_id`, split amounts, foreign/primary currency fields, and `reconciled` state.
- `firefly-iii/app/Transformers/RecurrenceTransformer.php` emits schedule dates, `apply_rules`, lifecycle flags, and repetition fields.

The large-page records, multi-user variations, long English description, exact amounts, and selected combinations are synthetic test cases. Exact endpoint envelopes, pagination behavior, role permissions, and conditional fields remain subject to official-image verification in FND-08. Unknown mock paths and every mock write return `501 unsupported_mock_operation`, never fabricated success.
