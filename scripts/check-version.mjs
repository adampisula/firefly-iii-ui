import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export function checkVersionContract(packageVersion, compatibility) {
  const backendVersion = compatibility.backend.supportedVersion;
  const plannedVersion = compatibility.frontend.initialPlannedVersion;
  const versionPattern = new RegExp(
    `^${backendVersion.replaceAll(".", "\\.")}-frontend\\.\\d+\\.\\d+\\.\\d+$`,
  );

  if (packageVersion !== plannedVersion) {
    throw new Error(
      `package.json version ${packageVersion} must match frontend.initialPlannedVersion ${plannedVersion}.`,
    );
  }

  if (!versionPattern.test(packageVersion)) {
    throw new Error(
      `package.json version must use the exact ${backendVersion}-frontend.<major>.<minor>.<patch> format.`,
    );
  }

  return true;
}

async function main() {
  const root = new URL("../", import.meta.url);
  const [packageJson, compatibilityJson] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("backend-compatibility.json", root), "utf8"),
  ]);
  const { version } = JSON.parse(packageJson);
  const compatibility = JSON.parse(compatibilityJson);

  checkVersionContract(version, compatibility);
  console.log(`Version contract valid: ${version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
