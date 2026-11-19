import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  PRIVACY_STORAGE_KEY,
  backgroundCssValue,
  clampFrost,
  parseAppearance,
  parsePrivacy,
  readableInk,
  resolveAccent,
  resolveTheme,
  serializeAppearance,
  type AppearanceSettings,
} from "./appearance";

const listeners = new Set<() => void>();
let appearanceRaw: string | null | undefined;
let appearanceCache: AppearanceSettings = DEFAULT_APPEARANCE;
let privacyRaw: string | null | undefined;
let privacyCache = false;
let syncError: string | null = null;
let hydrating: Promise<void> | null = null;

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeDisplayPreferences(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === APPEARANCE_STORAGE_KEY ||
      event.key === PRIVACY_STORAGE_KEY
    ) {
      appearanceRaw = undefined;
      privacyRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getAppearanceSnapshot(): AppearanceSettings {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (raw !== appearanceRaw) {
    appearanceRaw = raw;
    appearanceCache = parseAppearance(raw);
  }
  return appearanceCache;
}

export function getAppearanceServerSnapshot(): AppearanceSettings {
  return DEFAULT_APPEARANCE;
}

export function getPrivacySnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(PRIVACY_STORAGE_KEY);
  if (raw !== privacyRaw) {
    privacyRaw = raw;
    privacyCache = parsePrivacy(raw);
  }
  return privacyCache;
}

export function getPrivacyServerSnapshot(): boolean {
  return false;
}

export function getAppearanceSyncError(): string | null {
  return syncError;
}

export function applyAppearance(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = resolveTheme(settings.theme, prefersDark);
  root.dataset.theme = theme;
  root.style.setProperty("--frost", String(clampFrost(settings.frost)));
  if (settings.reducedTransparency) {
    root.dataset.reducedTransparency = "true";
  } else {
    delete root.dataset.reducedTransparency;
  }

  const accent = resolveAccent(settings.accent, theme);
  if (accent) {
    root.style.setProperty("--accent-base", accent);
    root.style.setProperty("--on-accent", readableInk(accent));
  } else {
    root.style.removeProperty("--accent-base");
    root.style.removeProperty("--on-accent");
  }

  const background = backgroundCssValue(settings.background);
  if (background) {
    root.style.setProperty("--app-bg-image", background);
    root.dataset.customBackground = "true";
  } else {
    root.style.removeProperty("--app-bg-image");
    delete root.dataset.customBackground;
  }
}

function cacheAppearance(settings: AppearanceSettings) {
  const normalized = { ...settings, frost: clampFrost(settings.frost) };
  const serialized = serializeAppearance(normalized);
  appearanceRaw = serialized;
  appearanceCache = normalized;
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, serialized);
  } catch {
    // Display preferences are non-critical; keep the in-memory value.
  }
  applyAppearance(normalized);
  notify();
  return normalized;
}

export function writeAppearance(settings: AppearanceSettings) {
  cacheAppearance(settings);
}

function isDefaultAppearance(settings: AppearanceSettings): boolean {
  return (
    settings.theme === DEFAULT_APPEARANCE.theme &&
    settings.frost === DEFAULT_APPEARANCE.frost &&
    settings.reducedTransparency === DEFAULT_APPEARANCE.reducedTransparency &&
    settings.accent.mode === "default" &&
    !settings.background.hasImage
  );
}

async function persistAppearance(
  settings: AppearanceSettings,
): Promise<string | null> {
  try {
    const response = await fetch("/api/appearance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Appearance could not be saved.");
    }
    const payload = (await response.json()) as {
      settings?: AppearanceSettings;
    };
    if (payload.settings) {
      cacheAppearance(parseAppearance(JSON.stringify(payload.settings)));
    }
    syncError = null;
    notify();
    return null;
  } catch (error) {
    syncError =
      error instanceof Error ? error.message : "Appearance could not be saved.";
    notify();
    return syncError;
  }
}

export async function saveAppearance(
  settings: AppearanceSettings,
): Promise<string | null> {
  cacheAppearance(settings);
  return persistAppearance(appearanceCache);
}

export async function removeBackground(): Promise<string | null> {
  cacheAppearance({
    ...appearanceCache,
    background: {
      hasImage: false,
      updatedAt: null,
      url: null,
      mime: null,
    },
  });
  try {
    const response = await fetch("/api/appearance/background", {
      method: "DELETE",
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      settings?: AppearanceSettings;
    } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? "Background could not be removed.");
    }
    if (payload?.settings) {
      cacheAppearance(parseAppearance(JSON.stringify(payload.settings)));
    }
    syncError = null;
    notify();
    return null;
  } catch (error) {
    syncError =
      error instanceof Error
        ? error.message
        : "Background could not be removed.";
    notify();
    return syncError;
  }
}

export async function uploadBackground(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("background", file);
    const response = await fetch("/api/appearance/background", {
      method: "POST",
      body: form,
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      settings?: AppearanceSettings;
    } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? "Background could not be uploaded.");
    }
    if (payload?.settings) {
      cacheAppearance(parseAppearance(JSON.stringify(payload.settings)));
    }
    syncError = null;
    notify();
    return null;
  } catch (error) {
    syncError =
      error instanceof Error
        ? error.message
        : "Background could not be uploaded.";
    notify();
    return syncError;
  }
}

export async function hydrateAppearanceFromServer(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const response = await fetch("/api/appearance", { cache: "no-store" });
      if (response.status === 401) {
        const current = getAppearanceSnapshot();
        if (current.background.hasImage) {
          cacheAppearance({
            ...current,
            background: DEFAULT_APPEARANCE.background,
          });
        }
        syncError = null;
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as {
        exists?: boolean;
        settings?: unknown;
      };
      const serverSettings = parseAppearance(
        payload.settings ? JSON.stringify(payload.settings) : null,
      );
      if (payload.exists === false && !isDefaultAppearance(appearanceCache)) {
        await persistAppearance(appearanceCache);
        return;
      }
      cacheAppearance(serverSettings);
      syncError = null;
      notify();
    } catch {
      // The local cache remains usable when the appearance service is offline.
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
}

export function clearAppearanceCache() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
      window.localStorage.removeItem(PRIVACY_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }
  appearanceRaw = undefined;
  privacyRaw = undefined;
  appearanceCache = DEFAULT_APPEARANCE;
  privacyCache = false;
  syncError = null;
  applyAppearance(DEFAULT_APPEARANCE);
  if (typeof document !== "undefined") {
    delete document.documentElement.dataset.privacy;
  }
  notify();
}

export function writePrivacy(privacy: boolean) {
  privacyRaw = String(privacy);
  privacyCache = privacy;
  try {
    window.localStorage.setItem(PRIVACY_STORAGE_KEY, String(privacy));
  } catch {
    // Display preferences are non-critical; keep the in-memory value.
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.privacy = String(privacy);
  }
  notify();
}
