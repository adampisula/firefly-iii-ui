import {
  mkdir,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  APPEARANCE_VERSION,
  DEFAULT_APPEARANCE,
  clampFrost,
  clampSurfaceOpacity,
  parseAccent,
  validateAccent,
  type AppearanceSettings,
  type BackgroundSetting,
} from "../appearance.ts";
import { getDataRoot, getOwnerKey } from "../user-data/owner-key.ts";

export const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AllowedMime = keyof typeof ALLOWED_TYPES;

interface StoredBackground {
  filename: string;
  mime: AllowedMime;
  size: number;
  updatedAt: string;
}

interface StoredAppearance {
  version: number;
  theme: AppearanceSettings["theme"];
  frost: number;
  surfaceOpacity: number;
  frostMain: boolean;
  reducedTransparency: boolean;
  accent: AppearanceSettings["accent"];
  background: StoredBackground | null;
}

function ownerDirectory(userId: string): string {
  return path.join(getDataRoot(), "appearance", getOwnerKey(userId));
}

function settingsPath(userId: string): string {
  return path.join(ownerDirectory(userId), "settings.json");
}

async function ensureOwnerDirectory(userId: string): Promise<string> {
  const directory = ownerDirectory(userId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  return directory;
}

function emptyStored(): StoredAppearance {
  return {
    version: APPEARANCE_VERSION,
    theme: DEFAULT_APPEARANCE.theme,
    frost: DEFAULT_APPEARANCE.frost,
    surfaceOpacity: DEFAULT_APPEARANCE.surfaceOpacity,
    frostMain: DEFAULT_APPEARANCE.frostMain,
    reducedTransparency: DEFAULT_APPEARANCE.reducedTransparency,
    accent: DEFAULT_APPEARANCE.accent,
    background: null,
  };
}

function parseStored(raw: string): StoredAppearance {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return emptyStored();
    const record = value as Record<string, unknown>;
    const theme =
      record.theme === "light" ||
      record.theme === "dark" ||
      record.theme === "system"
        ? record.theme
        : DEFAULT_APPEARANCE.theme;
    const frost =
      typeof record.frost === "number"
        ? clampFrost(record.frost)
        : DEFAULT_APPEARANCE.frost;
    const surfaceOpacity =
      typeof record.surfaceOpacity === "number"
        ? clampSurfaceOpacity(record.surfaceOpacity)
        : DEFAULT_APPEARANCE.surfaceOpacity;
    const frostMain =
      typeof record.frostMain === "boolean"
        ? record.frostMain
        : DEFAULT_APPEARANCE.frostMain;
    const reducedTransparency =
      typeof record.reducedTransparency === "boolean"
        ? record.reducedTransparency
        : DEFAULT_APPEARANCE.reducedTransparency;
    const accent = parseAccent(record.accent);
    let background: StoredBackground | null = null;
    if (typeof record.background === "object" && record.background !== null) {
      const stored = record.background as Record<string, unknown>;
      if (
        typeof stored.filename === "string" &&
        /^background\.(jpg|png|webp)$/.test(stored.filename) &&
        typeof stored.mime === "string" &&
        stored.mime in ALLOWED_TYPES &&
        typeof stored.size === "number" &&
        typeof stored.updatedAt === "string"
      ) {
        background = {
          filename: stored.filename,
          mime: stored.mime as AllowedMime,
          size: stored.size,
          updatedAt: stored.updatedAt,
        };
      }
    }
    return {
      version: APPEARANCE_VERSION,
      theme,
      frost,
      surfaceOpacity,
      frostMain,
      reducedTransparency,
      accent,
      background,
    };
  } catch {
    return emptyStored();
  }
}

function backgroundSetting(
  background: StoredBackground | null,
): BackgroundSetting {
  if (!background) return DEFAULT_APPEARANCE.background;
  return {
    hasImage: true,
    updatedAt: background.updatedAt,
    url: `/api/appearance/background?v=${encodeURIComponent(background.updatedAt)}`,
    mime: background.mime,
  };
}

function toSettings(stored: StoredAppearance): AppearanceSettings {
  return {
    version: APPEARANCE_VERSION,
    theme: stored.theme,
    frost: stored.frost,
    surfaceOpacity: stored.surfaceOpacity,
    frostMain: stored.frostMain,
    reducedTransparency: stored.reducedTransparency,
    accent: stored.accent,
    background: backgroundSetting(stored.background),
  };
}

async function readStored(
  userId: string,
): Promise<{ exists: boolean; stored: StoredAppearance }> {
  try {
    const raw = await readFile(settingsPath(userId), "utf8");
    return { exists: true, stored: parseStored(raw) };
  } catch {
    return { exists: false, stored: emptyStored() };
  }
}

export async function readAppearance(
  userId: string,
): Promise<{ exists: boolean; settings: AppearanceSettings }> {
  const result = await readStored(userId);
  if (!result.exists) {
    return { exists: false, settings: DEFAULT_APPEARANCE };
  }
  if (result.stored.background) {
    try {
      await stat(
        path.join(ownerDirectory(userId), result.stored.background.filename),
      );
    } catch {
      result.stored.background = null;
    }
  }
  return { exists: true, settings: toSettings(result.stored) };
}

async function writeStored(
  userId: string,
  stored: StoredAppearance,
): Promise<void> {
  const directory = await ensureOwnerDirectory(userId);
  const target = settingsPath(userId);
  const temporary = path.join(directory, `settings.${process.pid}.tmp`);
  await writeFile(temporary, JSON.stringify(stored), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporary, target);
}

export async function writeAppearance(
  userId: string,
  settings: AppearanceSettings,
): Promise<AppearanceSettings> {
  const validation = validateAccent(settings.accent);
  if (validation) throw new Error(validation);
  const current = await readStored(userId);
  const next: StoredAppearance = {
    version: APPEARANCE_VERSION,
    theme: settings.theme,
    frost: clampFrost(settings.frost),
    surfaceOpacity: clampSurfaceOpacity(settings.surfaceOpacity),
    frostMain: settings.frostMain,
    reducedTransparency: settings.reducedTransparency,
    accent: settings.accent,
    background: current.stored.background,
  };
  await writeStored(userId, next);
  return toSettings(next);
}

export async function deleteAppearance(userId: string): Promise<void> {
  const directory = ownerDirectory(userId);
  await unlink(settingsPath(userId)).catch(() => undefined);
  await unlink(path.join(directory, "background.jpg")).catch(() => undefined);
  await unlink(path.join(directory, "background.png")).catch(() => undefined);
  await unlink(path.join(directory, "background.webp")).catch(() => undefined);
}

function detectMime(buffer: Buffer): AllowedMime | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return "image/png";
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function writeBackground(
  userId: string,
  declaredType: string,
  buffer: Buffer,
): Promise<AppearanceSettings> {
  if (!(declaredType in ALLOWED_TYPES))
    throw new Error("Use a JPEG, PNG or WebP image.");
  if (buffer.length > MAX_BACKGROUND_BYTES)
    throw new Error("The background image must be 8 MB or smaller.");
  const detected = detectMime(buffer);
  if (!detected || detected !== declaredType)
    throw new Error(
      "The uploaded file is not a valid JPEG, PNG or WebP image.",
    );

  const directory = await ensureOwnerDirectory(userId);
  const extension = ALLOWED_TYPES[detected];
  const filename = `background.${extension}`;
  const target = path.join(directory, filename);
  const temporary = path.join(directory, `background.${process.pid}.tmp`);
  await writeFile(temporary, buffer, { mode: 0o600 });
  await rename(temporary, target);

  for (const oldExtension of Object.values(ALLOWED_TYPES)) {
    if (oldExtension !== extension)
      await unlink(path.join(directory, `background.${oldExtension}`)).catch(
        () => undefined,
      );
  }

  const current = await readStored(userId);
  const stored = current.stored;
  stored.background = {
    filename,
    mime: detected,
    size: buffer.length,
    updatedAt: new Date().toISOString(),
  };
  await writeStored(userId, stored);
  return toSettings(stored);
}

export async function readBackground(
  userId: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const existing = await readStored(userId);
  const stored = existing.stored;
  if (!stored.background) return null;
  const target = path.join(ownerDirectory(userId), stored.background.filename);
  try {
    const info = await stat(target);
    if (info.size > MAX_BACKGROUND_BYTES) return null;
    const buffer = await readFile(target);
    return { buffer, mime: stored.background.mime };
  } catch {
    return null;
  }
}

export async function deleteBackground(
  userId: string,
): Promise<AppearanceSettings> {
  const current = await readStored(userId);
  const stored = current.stored;
  stored.background = null;
  const directory = ownerDirectory(userId);
  for (const extension of Object.values(ALLOWED_TYPES)) {
    await unlink(path.join(directory, `background.${extension}`)).catch(
      () => undefined,
    );
  }
  if (current.exists) await writeStored(userId, stored);
  return toSettings(stored);
}
