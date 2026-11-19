"use client";

import { useSyncExternalStore } from "react";
import {
  getAppearanceServerSnapshot,
  getAppearanceSnapshot,
  saveAppearance,
  subscribeDisplayPreferences,
} from "@/lib/appearance-store";
import { AppearanceControls } from "./appearance-controls";

export function SettingsAppearance() {
  const settings = useSyncExternalStore(
    subscribeDisplayPreferences,
    getAppearanceSnapshot,
    getAppearanceServerSnapshot,
  );
  return (
    <AppearanceControls
      settings={settings}
      onChange={(next) => void saveAppearance(next)}
    />
  );
}
