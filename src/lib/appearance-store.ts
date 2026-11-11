import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  PRIVACY_STORAGE_KEY,
  clampFrost,
  parseAppearance,
  parsePrivacy,
  resolveTheme,
  serializeAppearance,
  type AppearanceSettings,
} from "./appearance";

const listeners = new Set<() => void>();
let appearanceRaw: string | null | undefined;
let appearanceCache: AppearanceSettings = DEFAULT_APPEARANCE;
let privacyRaw: string | null | undefined;
let privacyCache = false;

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

export function applyAppearance(settings: AppearanceSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = resolveTheme(settings.theme, prefersDark);
  root.style.setProperty("--frost", String(clampFrost(settings.frost)));
  if (settings.reducedTransparency) {
    root.dataset.reducedTransparency = "true";
  } else {
    delete root.dataset.reducedTransparency;
  }
}

export function writeAppearance(settings: AppearanceSettings) {
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
