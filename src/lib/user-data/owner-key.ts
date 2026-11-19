import { createHash } from "node:crypto";
import path from "node:path";
import { getServerEnvironment } from "../server-env.ts";

export function getDataRoot(): string {
  return process.env.FRONTEND_DATA_DIR ?? path.join(process.cwd(), ".data");
}

export function getOwnerKey(userId: string): string {
  const environment = getServerEnvironment();
  return createHash("sha256")
    .update(`${environment.backendInternalApiUrl.toString()}|${userId}`)
    .digest("hex");
}
