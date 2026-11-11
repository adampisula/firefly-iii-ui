import { readFile } from "node:fs/promises";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...data] = rows;
  return data
    .filter((item) => item.length > 1)
    .map((item) =>
      Object.fromEntries(header.map((key, index) => [key, item[index] ?? ""])),
    );
}

const api = await parseCsv(
  await readFile("plans/inventory/api-operations.csv", "utf8"),
);
const ui = await parseCsv(
  await readFile("plans/inventory/ui-workflows.csv", "utf8"),
);
const errors = [];
const ids = new Set();
for (const [label, rows, idField, expected] of [
  ["api", api, "operation_id", 247],
  ["ui", ui, "workflow_id", 119],
]) {
  if (rows.length !== expected)
    errors.push(`${label}: expected ${expected} rows, got ${rows.length}`);
  for (const row of rows) {
    if (ids.has(row[idField]))
      errors.push(`${label}: duplicate ${row[idField]}`);
    ids.add(row[idField]);
    for (const field of [
      idField,
      "task_id",
      "status",
      "disposition",
      "disposition_reason",
    ]) {
      if (!row[field] || !row[field].trim())
        errors.push(`${label} ${row[idField]}: missing ${field}`);
    }
    if (
      row.status === "verified" &&
      row.disposition === "api_supported" &&
      !row.evidence?.trim()
    ) {
      errors.push(
        `${label} ${row[idField]}: verified api_supported without evidence`,
      );
    }
    if (row.status === "verified" && !row.test_references?.trim()) {
      errors.push(`${label} ${row[idField]}: verified without test references`);
    }
    if (row.status === "unsupported" && row.disposition === "api_supported") {
      errors.push(
        `${label} ${row[idField]}: unsupported cannot be api_supported`,
      );
    }
    if (row.verification === "runtime_verified" && row.status === "blocked") {
      errors.push(`${label} ${row[idField]}: runtime_verified while blocked`);
    }
  }
}
const statusCounts = (rows) =>
  rows.reduce(
    (map, row) => ((map[row.status] = (map[row.status] ?? 0) + 1), map),
    {},
  );
const dispositionCounts = (rows) =>
  rows.reduce(
    (map, row) => (
      (map[row.disposition] = (map[row.disposition] ?? 0) + 1),
      map
    ),
    {},
  );
console.log(
  JSON.stringify(
    {
      api: {
        rows: api.length,
        statuses: statusCounts(api),
        dispositions: dispositionCounts(api),
      },
      ui: {
        rows: ui.length,
        statuses: statusCounts(ui),
        dispositions: dispositionCounts(ui),
      },
      errors,
    },
    null,
    2,
  ),
);
if (errors.length > 0) process.exitCode = 1;
