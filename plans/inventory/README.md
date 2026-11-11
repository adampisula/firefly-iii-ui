# Inventory schema and evidence policy

`api-operations.csv` and `ui-workflows.csv` retain their original stable IDs and source snapshot. Their required column order and baseline counts are recorded in `schema.json`; additive rows are allowed, but none of the initial 247 API operations or 119 UI workflows may be deleted or silently renumbered. Status fields describe frontend implementation evidence, not whether an upstream declaration exists.

## Evidence fields

Both inventories include `screen_or_client`, `test_references`, `evidence`, and `verification`. The API inventory additionally records `disposition` and `disposition_reason`; the UI inventory already had those columns. Blank screen/test references are intentional while a row is only planned. An `implemented` row must identify its actual frontend surface, test reference, and evidence. A `verified` row also needs runtime/interaction proof appropriate to its disposition; source inspection and mocks alone never qualify as runtime verification. Unsupported backend discrepancies and approved identity handoffs remain separate dispositions and do not count as API conformance.

`api_supported` and `requires_contract_verification` are candidate API classifications, not proof of working frontend behavior. The `api.v1.currencies.cer` row retains the source-declared route and is classified `unsupported_source_defect`; its missing handler remains a source/runtime verification issue, not permission to modify Firefly III. UI `residual_unsupported_scope_choice` rows remain visible pending an explicit user scope decision.

## Specification provenance

`spec-provenance.json` records the exact backend target and the current absence of a verified, exact-version OpenAPI artifact. The official API documentation source is <https://github.com/firefly-iii/api-docs>, which is licensed AGPL-3.0; the public documentation index surfaced a v6.7.8 branch during planning, not an exact 6.7.9 spec artifact. No spec file is vendored or treated as a client contract. When an exact-version artifact is available, record its immutable source revision, direct artifact URL, SHA-256, and license, then review normalized method/path changes against the source inventory. Do not upgrade the manifest or use a neighboring-version specification to clear this gate.

`source-provenance.json` pins the read-only 6.7.9 source revision and API route-file SHA-256 used for the baseline. When the sibling source checkout is available, the validator checks its HEAD and route hash; drift requires reviewed regeneration rather than silently accepting new declarations. The parser is deliberately not represented as a general PHP AST or Laravel route-registry replacement.

The inventory validator checks schema, duplicate IDs, references, alias relationships, task owners, source-reference shape, task dependencies, Markdown links, source snapshot, and package/manifest version agreement. It is a planning-ledger check only; it does not prove backend runtime compatibility or application capability.
