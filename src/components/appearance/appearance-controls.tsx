"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  ACCENT_PRESETS,
  DEFAULT_APPEARANCE,
  isHexColor,
  type AppearanceSettings,
  type AccentPresetId,
  validateAccent,
} from "@/lib/appearance";
import {
  getAppearanceSyncError,
  removeBackground,
  saveAppearance,
  uploadBackground,
} from "@/lib/appearance-store";
import { Button, Status } from "@/components/ui/primitives";

const MAX_DIMENSION = 2560;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (typeof createImageBitmap !== "function")
    throw new Error(
      "This browser cannot prepare the image. Use a JPEG or PNG.",
    );
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the image.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) throw new Error("The image could not be compressed.");
  return new File([blob], "background.jpg", { type: "image/jpeg" });
}

export function AppearanceControls({
  settings,
  onChange,
  compact = false,
}: {
  settings: AppearanceSettings;
  onChange: (settings: AppearanceSettings) => void;
  compact?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [custom, setCustom] = useState(
    settings.accent.mode === "custom" ? settings.accent.value : "",
  );
  const [customError, setCustomError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const applyCustom = () => {
    const value = custom.trim().toLowerCase();
    if (!isHexColor(value)) {
      setCustomError("Enter a six-digit hex color, for example #1e40af.");
      return;
    }
    const validation = validateAccent({ mode: "custom", value });
    if (validation) {
      setCustomError(validation);
      return;
    }
    setCustomError(null);
    onChange({ ...settings, accent: { mode: "custom", value } });
  };

  const choosePreset = (preset: AccentPresetId) => {
    setCustomError(null);
    onChange({ ...settings, accent: { mode: "preset", value: preset } });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setWorking(true);
    setMessage("Preparing image...");
    try {
      const prepared = await compressImage(file);
      const error = await uploadBackground(prepared);
      setMessage(error ?? "Background saved for this account.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Background upload failed.",
      );
    } finally {
      setWorking(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setWorking(true);
    setMessage("Removing background...");
    const error = await removeBackground();
    setMessage(error ?? "Default background restored.");
    setWorking(false);
  };

  const resetAll = async () => {
    setWorking(true);
    setMessage("Resetting appearance...");
    await removeBackground();
    const error = await saveAppearance(DEFAULT_APPEARANCE);
    setCustom("");
    setCustomError(null);
    setMessage(error ?? "Appearance reset to the default scene and accent.");
    setWorking(false);
  };

  const syncError = getAppearanceSyncError();

  return (
    <div
      className={
        compact ? "appearance-controls compact" : "appearance-controls"
      }
    >
      <div className="appearance-field">
        <label className="field-label" htmlFor={`${id}-theme`}>
          Theme
        </label>
        <select
          className="select"
          id={`${id}-theme`}
          value={settings.theme}
          onChange={(event) =>
            onChange({
              ...settings,
              theme: event.target.value as AppearanceSettings["theme"],
            })
          }
        >
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <fieldset className="appearance-field">
        <legend className="field-label">Accent color</legend>
        <div className="accent-grid">
          <button
            type="button"
            className="accent-swatch"
            data-active={settings.accent.mode === "default" || undefined}
            onClick={() =>
              onChange({ ...settings, accent: { mode: "default" } })
            }
          >
            <span className="accent-dot default" aria-hidden="true" />
            Default
          </button>
          {ACCENT_PRESETS.map((preset) => (
            <button
              type="button"
              className="accent-swatch"
              key={preset.id}
              data-active={
                settings.accent.mode === "preset" &&
                settings.accent.value === preset.id
                  ? true
                  : undefined
              }
              onClick={() => choosePreset(preset.id as AccentPresetId)}
            >
              <span
                className="accent-dot"
                style={{ background: preset.light }}
                aria-hidden="true"
              />
              {preset.label}
            </button>
          ))}
        </div>
        <div className="accent-custom">
          <label className="field-label" htmlFor={`${id}-custom`}>
            Custom hex
          </label>
          <div className="accent-custom-row">
            <input
              className="select"
              id={`${id}-custom`}
              value={custom}
              placeholder="#1e40af"
              onChange={(event) => {
                setCustom(event.target.value);
                setCustomError(null);
              }}
              onBlur={applyCustom}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyCustom();
                }
              }}
            />
            <Button type="button" tone="quiet" onClick={applyCustom}>
              Apply
            </Button>
          </div>
          {customError ? <p className="field-error">{customError}</p> : null}
        </div>
      </fieldset>

      <div className="appearance-field">
        <label className="field-label" htmlFor={`${id}-frost`}>
          Glass frost: {Math.round(settings.frost * 100)}%
        </label>
        <input
          className="range"
          id={`${id}-frost`}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.frost}
          onChange={(event) =>
            onChange({ ...settings, frost: Number(event.target.value) })
          }
        />
        <p className="muted-note">
          Frost changes how strongly the scene is blurred behind glass surfaces.
          Text contrast is preserved at both extremes.
        </p>
      </div>

      <div className="appearance-field">
        <label className="field-label" htmlFor={`${id}-surface-opacity`}>
          Background opacity: {Math.round(settings.surfaceOpacity * 100)}%
        </label>
        <input
          className="range"
          id={`${id}-surface-opacity`}
          type="range"
          min={0.5}
          max={1}
          step={0.02}
          value={settings.surfaceOpacity}
          onChange={(event) =>
            onChange({
              ...settings,
              surfaceOpacity: Number(event.target.value),
            })
          }
        />
        <p className="muted-note">
          Raise this when the scene behind the main window distracts you. At
          100% the main window is fully opaque.
        </p>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={settings.frostMain}
          onChange={(event) =>
            onChange({ ...settings, frostMain: event.target.checked })
          }
        />
        <span>Frost the main window</span>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={settings.reducedTransparency}
          onChange={(event) =>
            onChange({
              ...settings,
              reducedTransparency: event.target.checked,
            })
          }
        />
        <span>Use opaque surfaces (reduced transparency)</span>
      </label>

      <div className="appearance-field">
        <span className="field-label">Background</span>
        {settings.background.hasImage ? (
          <div
            className="background-preview"
            style={{
              backgroundImage: settings.background.url
                ? `url("${settings.background.url}")`
                : undefined,
            }}
            role="img"
            aria-label="Current custom background"
          />
        ) : (
          <p className="muted-note">
            The default room scene is in use. Upload a JPEG, PNG or WebP image
            to use your own background.
          </p>
        )}
        <div className="button-row">
          <input
            ref={inputRef}
            id={`${id}-background`}
            className="visually-hidden"
            type="file"
            aria-label="Background image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          <Button
            type="button"
            tone="quiet"
            disabled={working}
            onClick={() => inputRef.current?.click()}
          >
            {settings.background.hasImage ? "Replace image" : "Upload image"}
          </Button>
          {settings.background.hasImage ? (
            <Button
              type="button"
              tone="quiet"
              disabled={working}
              onClick={() => void remove()}
            >
              Remove image
            </Button>
          ) : null}
        </div>
        <p className="muted-note">
          Images are compressed in the browser and saved to this user profile.
          Maximum 8 MB after compression.
        </p>
      </div>

      <div className="button-row">
        <Button
          type="button"
          tone="quiet"
          disabled={working}
          onClick={() => void resetAll()}
        >
          Reset appearance
        </Button>
        <Link className="text-link" href="/settings#appearance">
          Full appearance settings
        </Link>
      </div>

      {message ? (
        <p className="muted-note" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      {syncError ? <Status kind="warning">{syncError}</Status> : null}
    </div>
  );
}
