export const APPEARANCE_STORAGE_KEY = "ff.appearance";
export const PRIVACY_STORAGE_KEY = "ff.privacy";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface AppearanceSettings {
  theme: ThemePreference;
  frost: number;
  reducedTransparency: boolean;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  frost: 0.5,
  reducedTransparency: false,
};

const THEMES: readonly ThemePreference[] = ["light", "dark", "system"];

export function clampFrost(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_APPEARANCE.frost;
  return Math.min(1, Math.max(0, value));
}

export function parseAppearance(raw: string | null): AppearanceSettings {
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null)
      return DEFAULT_APPEARANCE;
    const record = parsed as Record<string, unknown>;
    const theme = THEMES.includes(record.theme as ThemePreference)
      ? (record.theme as ThemePreference)
      : DEFAULT_APPEARANCE.theme;
    const frost =
      typeof record.frost === "number"
        ? clampFrost(record.frost)
        : DEFAULT_APPEARANCE.frost;
    const reducedTransparency =
      typeof record.reducedTransparency === "boolean"
        ? record.reducedTransparency
        : DEFAULT_APPEARANCE.reducedTransparency;
    return { theme, frost, reducedTransparency };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function serializeAppearance(settings: AppearanceSettings): string {
  return JSON.stringify({
    theme: settings.theme,
    frost: clampFrost(settings.frost),
    reducedTransparency: settings.reducedTransparency,
  });
}

export function resolveTheme(
  theme: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme {
  if (theme === "system") return prefersDark ? "dark" : "light";
  return theme;
}

export function parsePrivacy(raw: string | null): boolean {
  return raw === "true";
}

export const APPEARANCE_BOOTSTRAP_SCRIPT = `(function(){try{var raw=localStorage.getItem("${APPEARANCE_STORAGE_KEY}");var settings={theme:"system",frost:0.5,reducedTransparency:false};if(raw){try{var parsed=JSON.parse(raw);if(parsed&&typeof parsed==="object"){if(parsed.theme==="light"||parsed.theme==="dark"||parsed.theme==="system"){settings.theme=parsed.theme;}if(typeof parsed.frost==="number"&&isFinite(parsed.frost)){settings.frost=Math.min(1,Math.max(0,parsed.frost));}if(typeof parsed.reducedTransparency==="boolean"){settings.reducedTransparency=parsed.reducedTransparency;}}}catch(e){}}var dark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=settings.theme==="system"?(dark?"dark":"light"):settings.theme;var root=document.documentElement;root.dataset.theme=resolved;root.style.setProperty("--frost",String(settings.frost));if(settings.reducedTransparency){root.dataset.reducedTransparency="true";}if(localStorage.getItem("${PRIVACY_STORAGE_KEY}")==="true"){root.dataset.privacy="true";}}catch(e){}})();`;
