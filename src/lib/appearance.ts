export const APPEARANCE_STORAGE_KEY = "ff.appearance";
export const PRIVACY_STORAGE_KEY = "ff.privacy";
export const APPEARANCE_VERSION = 1;

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface AccentPreset {
  id: string;
  label: string;
  light: string;
  dark: string;
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "green", label: "Green", light: "#137a50", dark: "#6ee0a1" },
  { id: "teal", label: "Teal", light: "#0f766e", dark: "#5eead4" },
  { id: "blue", label: "Blue", light: "#1e40af", dark: "#93c5fd" },
  { id: "violet", label: "Violet", light: "#5b21b6", dark: "#c4b5fd" },
  { id: "amber", label: "Amber", light: "#92400e", dark: "#fcd34d" },
  { id: "rose", label: "Rose", light: "#9f1239", dark: "#fda4af" },
] as const;

export type AccentPresetId =
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "amber"
  | "rose";

export type AccentSetting =
  | { mode: "default" }
  | { mode: "preset"; value: AccentPresetId }
  | { mode: "custom"; value: string };

export interface BackgroundSetting {
  hasImage: boolean;
  updatedAt: string | null;
  url: string | null;
  mime: string | null;
}

export interface AppearanceSettings {
  version: number;
  theme: ThemePreference;
  frost: number;
  reducedTransparency: boolean;
  accent: AccentSetting;
  background: BackgroundSetting;
}

export const DEFAULT_BACKGROUND: BackgroundSetting = {
  hasImage: false,
  updatedAt: null,
  url: null,
  mime: null,
};

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  version: APPEARANCE_VERSION,
  theme: "system",
  frost: 0.5,
  reducedTransparency: false,
  accent: { mode: "default" },
  background: DEFAULT_BACKGROUND,
};

const THEMES: readonly ThemePreference[] = ["light", "dark", "system"];
const PRESET_IDS = new Set(ACCENT_PRESETS.map((preset) => preset.id));

export function clampFrost(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_APPEARANCE.frost;
  return Math.min(1, Math.max(0, value));
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (!isHexColor(hex)) return null;
  const value = normalizeHex(hex).slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (
    0.2126 * channelLuminance(rgb[0]) +
    0.7152 * channelLuminance(rgb[1]) +
    0.0722 * channelLuminance(rgb[2])
  );
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

export function readableInk(background: string): "#000000" | "#ffffff" {
  return contrastRatio(background, "#000000") >=
    contrastRatio(background, "#ffffff")
    ? "#000000"
    : "#ffffff";
}

function mixHex(first: string, second: string, weight: number): string {
  const a = hexToRgb(first);
  const b = hexToRgb(second);
  if (!a || !b) return first;
  const ratio = Math.min(1, Math.max(0, weight));
  const channels = a.map((channel, index) =>
    Math.round(channel * (1 - ratio) + b[index] * ratio)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("")}`;
}

export function accentPreset(id: string): AccentPreset | undefined {
  return ACCENT_PRESETS.find((preset) => preset.id === id);
}

export function resolveAccent(
  accent: AccentSetting,
  theme: ResolvedTheme,
): string | null {
  if (accent.mode === "default") return null;
  if (accent.mode === "preset") {
    const preset = accentPreset(accent.value);
    if (!preset) return null;
    return theme === "dark" ? preset.dark : preset.light;
  }
  const value = normalizeHex(accent.value);
  if (!isHexColor(value)) return null;
  return theme === "dark" ? mixHex(value, "#ffffff", 0.38) : value;
}

export function validateAccent(accent: AccentSetting): string | null {
  if (accent.mode === "default") return null;
  if (accent.mode === "preset")
    return PRESET_IDS.has(accent.value)
      ? null
      : "Choose one of the available accent presets.";
  const value = normalizeHex(accent.value);
  if (!isHexColor(value))
    return "Enter a six-digit hex color, for example #1e40af.";
  const light = value;
  const dark = mixHex(value, "#ffffff", 0.38);
  if (contrastRatio(light, "#ffffff") < 4.5) {
    return "This accent is too light for link text on light surfaces. Choose a darker color.";
  }
  if (contrastRatio(dark, "#000000") < 4.5) {
    return "This accent is too dark for the dark theme. Choose a lighter color.";
  }
  if (contrastRatio(light, readableInk(light)) < 4.5) {
    return "This accent does not provide enough contrast for action labels.";
  }
  if (contrastRatio(dark, readableInk(dark)) < 4.5) {
    return "This accent does not provide enough contrast in the dark theme.";
  }
  return null;
}

export function parseAccent(raw: unknown): AccentSetting {
  if (typeof raw === "object" && raw !== null) {
    const record = raw as Record<string, unknown>;
    if (record.mode === "preset" && typeof record.value === "string") {
      return PRESET_IDS.has(record.value)
        ? { mode: "preset", value: record.value as AccentPresetId }
        : DEFAULT_APPEARANCE.accent;
    }
    if (record.mode === "custom" && typeof record.value === "string") {
      const value = normalizeHex(record.value);
      return isHexColor(value)
        ? { mode: "custom", value }
        : DEFAULT_APPEARANCE.accent;
    }
  }
  return DEFAULT_APPEARANCE.accent;
}

export function parseBackground(raw: unknown): BackgroundSetting {
  if (typeof raw !== "object" || raw === null) return DEFAULT_BACKGROUND;
  const record = raw as Record<string, unknown>;
  const url =
    typeof record.url === "string" &&
    record.url.startsWith("/api/appearance/background")
      ? record.url
      : null;
  return {
    hasImage: record.hasImage === true && url !== null,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
    url,
    mime: typeof record.mime === "string" ? record.mime : null,
  };
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
    return {
      version: APPEARANCE_VERSION,
      theme,
      frost,
      reducedTransparency,
      accent: parseAccent(record.accent),
      background: parseBackground(record.background),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function serializeAppearance(settings: AppearanceSettings): string {
  return JSON.stringify({
    version: APPEARANCE_VERSION,
    theme: settings.theme,
    frost: clampFrost(settings.frost),
    reducedTransparency: settings.reducedTransparency,
    accent: settings.accent,
    background: settings.background,
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

export function backgroundCssValue(background: BackgroundSetting): string {
  return background.hasImage && background.url
    ? `url("${background.url}")`
    : "";
}

const PRESETS_JSON = JSON.stringify(ACCENT_PRESETS);

export const APPEARANCE_BOOTSTRAP_SCRIPT = `(function(){try{var presets=${PRESETS_JSON};var raw=localStorage.getItem("${APPEARANCE_STORAGE_KEY}");var settings={theme:"system",frost:0.5,reducedTransparency:false,accent:{mode:"default"},background:{hasImage:false,url:null}};if(raw){try{var parsed=JSON.parse(raw);if(parsed&&typeof parsed==="object"){if(parsed.theme==="light"||parsed.theme==="dark"||parsed.theme==="system"){settings.theme=parsed.theme;}if(typeof parsed.frost==="number"&&isFinite(parsed.frost)){settings.frost=Math.min(1,Math.max(0,parsed.frost));}if(typeof parsed.reducedTransparency==="boolean"){settings.reducedTransparency=parsed.reducedTransparency;}if(parsed.accent&&typeof parsed.accent==="object"){settings.accent=parsed.accent;}if(parsed.background&&typeof parsed.background==="object"){settings.background=parsed.background;}}}catch(e){}}var dark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;var resolved=settings.theme==="system"?(dark?"dark":"light"):settings.theme;var root=document.documentElement;root.dataset.theme=resolved;root.style.setProperty("--frost",String(settings.frost));if(settings.reducedTransparency){root.dataset.reducedTransparency="true";}var accent=settings.accent;var color=null;if(accent&&accent.mode==="preset"){for(var i=0;i<presets.length;i++){if(presets[i].id===accent.value){color=resolved==="dark"?presets[i].dark:presets[i].light;break;}}}else if(accent&&accent.mode==="custom"&&typeof accent.value==="string"&&/^#[0-9a-fA-F]{6}$/.test(accent.value)){color=accent.value;}if(color){root.style.setProperty("--accent-base",color);var rgb=[parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16)];var toLinear=function(channel){var value=channel/255;return value<=0.04045?value/12.92:Math.pow((value+0.055)/1.055,2.4)};var luminance=0.2126*toLinear(rgb[0])+0.7152*toLinear(rgb[1])+0.0722*toLinear(rgb[2]);root.style.setProperty("--on-accent",luminance>0.45?"#000000":"#ffffff");}if(settings.background&&settings.background.hasImage&&typeof settings.background.url==="string"&&settings.background.url.indexOf("/api/appearance/background")===0){root.style.setProperty("--app-bg-image",'url("'+settings.background.url.replace(/"/g,"%22")+'")');}if(localStorage.getItem("${PRIVACY_STORAGE_KEY}")==="true"){root.dataset.privacy="true";}}catch(e){}})();`;
