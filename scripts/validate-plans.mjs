import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkVersionContract } from "./check-version.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDirectory, "..");
const taskIdPattern = /\b(?:PLAN|FND|CORE|AUTO|ANA|SYS|QA)-\d+(?:-[a-z])?\b/gi;

export function parseCsv(text) {
  const input = text.replace(/^\uFEFF/, "");
  const records = [];
  let record = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      record.push(field);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = "";
      if (character === "\r" && input[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unterminated quoted field.");
  record.push(field);
  if (record.some((value) => value.length > 0)) records.push(record);
  if (records.length === 0) throw new Error("CSV is empty.");

  const [headers, ...data] = records;
  return {
    headers,
    rows: data.map((values, rowIndex) => {
      if (values.length !== headers.length) {
        throw new Error(
          `CSV row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`,
        );
      }
      return Object.fromEntries(
        headers.map((header, index) => [header, values[index]]),
      );
    }),
  };
}

export function validateInventory(kind, inventory, schema, taskIds) {
  const errors = [];
  const definition = schema.inventories[kind];
  const expectedHeaders = definition.headers;
  const actualHeaders = inventory.headers;

  if (new Set(actualHeaders).size !== actualHeaders.length) {
    errors.push(`${definition.file}: duplicate column names.`);
  }
  if (JSON.stringify(actualHeaders) !== JSON.stringify(expectedHeaders)) {
    errors.push(
      `${definition.file}: columns/order do not match inventory/schema.json.`,
    );
  }
  if (inventory.rows.length < schema.baselineCounts[definition.file]) {
    errors.push(
      `${definition.file}: ${inventory.rows.length} rows is below the preserved baseline of ${schema.baselineCounts[definition.file]}.`,
    );
  }

  const seenIds = new Set();
  const ids = new Set(inventory.rows.map((row) => row[definition.idField]));
  const apiPairs = new Map();

  for (const [index, row] of inventory.rows.entries()) {
    const label = `${definition.file} row ${index + 2}`;
    const id = row[definition.idField];
    if (!id) errors.push(`${label}: ${definition.idField} is required.`);
    else if (seenIds.has(id))
      errors.push(`${label}: duplicate ${definition.idField} ${id}.`);
    else seenIds.add(id);

    for (const field of [
      "task_id",
      "source",
      "status",
      "verification",
      "disposition",
      "disposition_reason",
      "evidence",
    ]) {
      if (!row[field]?.trim()) errors.push(`${label}: ${field} is required.`);
    }
    if (row.task_id && !taskIds.has(row.task_id.toUpperCase())) {
      errors.push(`${label}: unmapped task owner ${row.task_id}.`);
    }
    if (row.status && !schema.statuses.includes(row.status)) {
      errors.push(`${label}: invalid status ${row.status}.`);
    }
    if (
      row.verification &&
      !schema.verificationStates.includes(row.verification)
    ) {
      errors.push(`${label}: invalid verification state ${row.verification}.`);
    }
    if (row.disposition && !schema.dispositions.includes(row.disposition)) {
      errors.push(`${label}: invalid disposition ${row.disposition}.`);
    }
    if (row.status === "implemented" || row.status === "verified") {
      for (const field of ["screen_or_client", "test_references", "evidence"]) {
        if (!row[field]?.trim())
          errors.push(`${label}: ${field} is required for ${row.status} rows.`);
      }
    }
    if (
      row.status === "verified" &&
      row.verification === "static_not_runtime_verified"
    ) {
      errors.push(
        `${label}: static-only evidence cannot have verified status.`,
      );
    }
    if (
      row.status === "verified" &&
      row.disposition === "unsupported_source_defect"
    ) {
      errors.push(
        `${label}: an unsupported source defect cannot be verified as a client capability.`,
      );
    }

    const sourceLine = kind === "api" ? row.source_line : "";
    if (sourceLine && !/^\d+$/.test(sourceLine)) {
      errors.push(`${label}: source_line must be a positive integer.`);
    }
    if (kind === "api") {
      if (!["GET", "POST", "PUT", "DELETE"].includes(row.method)) {
        errors.push(`${label}: unsupported API method ${row.method}.`);
      }
      if (!row.path?.startsWith("/api/v1/")) {
        errors.push(`${label}: API path must remain under /api/v1/.`);
      }
      if (row.controller_line && !/^\d+$/.test(row.controller_line)) {
        errors.push(`${label}: controller_line must be an integer or empty.`);
      }
      const pair = `${row.method} ${row.path}`;
      const previous = apiPairs.get(pair);
      if (previous && row.alias_of !== previous && previous !== row.alias_of) {
        errors.push(
          `${label}: duplicate method/path without an alias declaration (${pair}).`,
        );
      }
      if (!previous) apiPairs.set(pair, id);
      if (row.alias_of && !ids.has(row.alias_of)) {
        errors.push(
          `${label}: alias_of references missing operation ${row.alias_of}.`,
        );
      }
      if (row.alias_of && row.alias_of === id) {
        errors.push(`${label}: alias_of cannot reference itself.`);
      }
    }
    if (kind === "ui" && !row.source.match(/:\d+(?:-\d+)?(?:;|$)/)) {
      errors.push(
        `${label}: source must include at least one source line reference.`,
      );
    }
  }

  if (kind === "api") {
    for (const row of inventory.rows) {
      if (!row.alias_of) continue;
      const canonical = inventory.rows.find(
        (candidate) => candidate[definition.idField] === row.alias_of,
      );
      if (canonical && canonical.method !== row.method) {
        errors.push(
          `${row.operation_id}: alias method differs from ${row.alias_of}.`,
        );
      }
    }
  }

  return errors;
}

function parseTaskBoards(root, errors) {
  const planDirectory = resolve(root, "plans");
  const files = readdirSync(planDirectory).filter((name) =>
    /^0[1-5]-.*\.md$/.test(name),
  );
  const tasks = new Map();
  const dependencies = new Map();

  for (const file of files) {
    const content = readFileSync(resolve(planDirectory, file), "utf8");
    for (const line of content.split(/\r?\n/)) {
      if (!/^\|/.test(line)) continue;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (
        cells.length < 6 ||
        !/^(?:ready|in_progress|in_review|done|blocked|cancelled)$/.test(
          cells[2],
        )
      )
        continue;
      const [sourceId, , status, dependencyText, owner, updated] = cells;
      const id = sourceId.toUpperCase();
      if (tasks.has(id))
        errors.push(
          `Task ${sourceId} appears in more than one canonical status table.`,
        );
      tasks.set(id, { status, owner, updated });
      const references = (dependencyText.match(taskIdPattern) ?? []).map(
        (value) => value.toUpperCase(),
      );
      if (dependencyText.includes("BASE")) references.push("BASE");
      dependencies.set(id, [...new Set(references)]);
      if (
        status === "in_progress" &&
        (!owner || owner === "—" || !updated || updated === "—")
      ) {
        errors.push(`In-progress task ${id} must have an owner and timestamp.`);
      }
    }
  }

  const baseDependencies = [
    "FND-04",
    "FND-05",
    "FND-06",
    "FND-07",
    "FND-08",
    "FND-10",
  ];
  for (const [id, refs] of dependencies) {
    const expanded = refs.flatMap((reference) =>
      reference === "BASE" ? baseDependencies : [reference],
    );
    for (const reference of expanded) {
      if (!tasks.has(reference))
        errors.push(
          `${id}: dependency ${reference} is not in a canonical task table.`,
        );
    }
    if (tasks.get(id).status === "ready") {
      const unmet = expanded.filter(
        (reference) => tasks.get(reference)?.status !== "done",
      );
      if (unmet.length)
        errors.push(
          `${id}: ready task has unmet dependencies: ${unmet.join(", ")}.`,
        );
    }
    dependencies.set(id, expanded);
  }

  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      errors.push(`Task dependency cycle includes ${id}.`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id) ?? []) {
      if (tasks.has(dependency)) visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of tasks.keys()) visit(id);
  return tasks;
}

function validateMarkdownLinks(root, errors) {
  const files = [];
  function collect(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (extname(entry.name).toLowerCase() === ".md") files.push(path);
    }
  }
  for (const directory of [resolve(root, "plans"), resolve(root, "docs")])
    collect(directory);
  files.push(resolve(root, "README.md"));

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const destination = match[1]
        .trim()
        .split(/\s+/, 1)[0]
        .replace(/^<|>$/g, "");
      if (!destination || /^(?:https?:|mailto:|#)/i.test(destination)) continue;
      const localPath = decodeURIComponent(destination.split("#", 1)[0]);
      if (!localPath) continue;
      if (!existsSync(resolve(dirname(file), localPath))) {
        errors.push(
          `${relative(root, file)}: broken Markdown link ${destination}.`,
        );
      }
    }
  }
}

function validateSourcePaths(root, inventory, kind, errors) {
  const sourceRoot = resolve(root, "..");
  const paths = new Set();
  for (const row of inventory.rows) {
    const candidates =
      kind === "api"
        ? [row.source, row.controller_source]
        : [...row.source.split(/;\s*/)].map((source) =>
            source.replace(/:\d+(?:-\d+)?$/, ""),
          );
    for (const source of candidates.filter(Boolean)) {
      if (!/^(?:firefly\/)?[A-Za-z0-9_./-]+\.[A-Za-z0-9_-]+$/.test(source)) {
        errors.push(
          `${row[kind === "api" ? "operation_id" : "workflow_id"]}: malformed source path ${source}.`,
        );
        continue;
      }
      paths.add(source);
    }
  }
  const availableRoots = ["firefly-iii", "docs", "design"].some((name) =>
    existsSync(resolve(sourceRoot, name)),
  );
  if (!availableRoots) return;
  for (const source of paths) {
    const workspaceRelative = source.startsWith("firefly/")
      ? source.slice("firefly/".length)
      : source;
    if (!existsSync(resolve(sourceRoot, workspaceRelative))) {
      errors.push(
        `Source reference does not exist in available reference checkouts: ${source}.`,
      );
    }
  }
}

export function validateVersion(packageJson, compatibility) {
  const errors = [];
  try {
    checkVersionContract(packageJson.version, compatibility);
  } catch (error) {
    errors.push(error.message);
  }
  if (compatibility.backend?.supportedVersion !== "6.7.9") {
    errors.push(
      "Compatibility target must remain the exact supported Firefly III 6.7.9 version.",
    );
  }
  if (compatibility.backend?.apiPath !== "/api/v1") {
    errors.push("Compatibility API path must remain /api/v1.");
  }
  if (compatibility.backend?.modificationsAllowed !== false) {
    errors.push(
      "Backend modifications must remain forbidden in the compatibility manifest.",
    );
  }
  return errors;
}

export function validatePlans(root = defaultRoot) {
  const errors = [];
  const warnings = [];
  const schema = JSON.parse(
    readFileSync(resolve(root, "plans/inventory/schema.json"), "utf8"),
  );
  const taskIds = new Set(parseTaskBoards(root, errors).keys());
  const inventories = {};

  for (const kind of ["api", "ui"]) {
    const definition = schema.inventories[kind];
    const inventory = parseCsv(
      readFileSync(resolve(root, "plans/inventory", definition.file), "utf8"),
    );
    inventories[kind] = inventory;
    errors.push(...validateInventory(kind, inventory, schema, taskIds));
    validateSourcePaths(root, inventory, kind, errors);
  }
  validateMarkdownLinks(root, errors);

  const packageJson = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  );
  const compatibility = JSON.parse(
    readFileSync(resolve(root, "backend-compatibility.json"), "utf8"),
  );
  errors.push(...validateVersion(packageJson, compatibility));

  const source = JSON.parse(
    readFileSync(
      resolve(root, "plans/inventory/source-provenance.json"),
      "utf8",
    ),
  );
  const sourceRoot = resolve(root, source.checkoutPathFromFrontendRoot);
  if (existsSync(sourceRoot)) {
    try {
      const sourceRevision = execFileSync(
        "git",
        ["-C", sourceRoot, "rev-parse", "HEAD"],
        { encoding: "utf8" },
      ).trim();
      if (sourceRevision !== source.sourceRevision) {
        errors.push(
          `Read-only source checkout revision drifted: expected ${source.sourceRevision}, found ${sourceRevision}. Review and regenerate the inventory before accepting this source.`,
        );
      }
      const routeSource = readFileSync(
        resolve(sourceRoot, source.routeInventorySource),
      );
      const routeHash = createHash("sha256").update(routeSource).digest("hex");
      if (routeHash !== source.routeInventorySha256) {
        errors.push(
          `API route source hash drifted: expected ${source.routeInventorySha256}, found ${routeHash}. Review the API inventory delta.`,
        );
      }
    } catch (error) {
      errors.push(
        `Unable to verify the read-only source snapshot: ${error.message}`,
      );
    }
  } else {
    warnings.push(
      "Optional ../firefly-iii source checkout is absent; source snapshot hash was not checked.",
    );
  }

  const spec = JSON.parse(
    readFileSync(resolve(root, "plans/inventory/spec-provenance.json"), "utf8"),
  );
  if (spec.targetBackendVersion !== compatibility.backend.supportedVersion) {
    errors.push(
      "API-spec target version is stale relative to backend-compatibility.json.",
    );
  }
  if (spec.status === "pinned") {
    if (
      !spec.artifactUrl ||
      !spec.sourceRevision ||
      !/^[a-f0-9]{64}$/i.test(spec.sha256 ?? "") ||
      !spec.license
    ) {
      errors.push(
        "A pinned API spec requires artifact URL, immutable revision, SHA-256, and license.",
      );
    }
  } else if (!spec.reason) {
    errors.push(
      "Unpinned API spec provenance requires an explicit reason/blocker.",
    );
  }

  for (const [kind, inventory] of Object.entries(inventories)) {
    const file = schema.inventories[kind].file;
    const delta = inventory.rows.length - schema.baselineCounts[file];
    if (delta > 0)
      warnings.push(
        `${file}: ${delta} reviewed additive row(s) above the preserved baseline.`,
      );
  }
  if (spec.status !== "pinned")
    warnings.push(
      "No exact-version official API spec is pinned; spec drift comparison remains blocked.",
    );
  if (
    compatibility.backend.image?.verified !== true ||
    !compatibility.backend.image?.digest
  ) {
    warnings.push(
      "Official image digest/runtime provenance is not verified; this validator does not certify runtime compatibility.",
    );
  }

  return {
    errors,
    warnings,
    counts: Object.fromEntries(
      Object.entries(inventories).map(([kind, inventory]) => [
        kind,
        inventory.rows.length,
      ]),
    ),
  };
}

function main() {
  const result = validatePlans();
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  if (result.errors.length) {
    for (const error of result.errors) console.error(`ERROR: ${error}`);
    console.error(
      `Planning validation failed with ${result.errors.length} error(s).`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `Planning validation passed: ${result.counts.api} API operations; ${result.counts.ui} UI workflows.`,
  );
  console.log(
    "This validates planning artifacts only; it does not certify application or backend runtime behavior.",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
