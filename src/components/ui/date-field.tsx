"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  displayDateValue as displayFromIso,
  isoDateValue as isoFromDisplay,
} from "@/lib/finance/date-input";
import styles from "./date-field.module.css";

export function DateInput({
  id,
  name,
  defaultValue = "",
  value,
  onChange,
  required,
  disabled,
  ariaInvalid,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  ariaInvalid?: boolean;
}) {
  const controlled = value !== undefined;
  const [internalIso, setInternalIso] = useState(() =>
    defaultValue.slice(0, 10),
  );
  const currentIso = controlled ? value.slice(0, 10) : internalIso;
  const [text, setText] = useState(() =>
    displayFromIso(controlled ? (value ?? "") : defaultValue),
  );
  const [lastControlledValue, setLastControlledValue] = useState(currentIso);
  const pickerRef = useRef<HTMLInputElement>(null);

  if (controlled && currentIso !== lastControlledValue) {
    setLastControlledValue(currentIso);
    setText(displayFromIso(currentIso));
  }

  const setIso = (next: string) => {
    if (!controlled) setInternalIso(next);
    onChange?.(next);
  };

  return (
    <div className={styles.wrap}>
      <input
        className={`select ${styles.input}`}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        pattern="\d{1,2}/\d{1,2}/\d{4}"
        title="Enter a date as dd/mm/yyyy"
        value={text}
        required={required}
        disabled={disabled}
        aria-invalid={ariaInvalid ? true : undefined}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          const nextIso = isoFromDisplay(nextText);
          if (nextIso || nextText.trim() === "") setIso(nextIso);
        }}
      />
      <button
        className={styles.picker}
        type="button"
        disabled={disabled}
        aria-label="Choose date from calendar"
        onClick={() => {
          const input = pickerRef.current;
          if (!input) return;
          try {
            input.showPicker();
          } catch {
            input.focus();
          }
        }}
      >
        <Icon name="calendar" size={17} />
      </button>
      <input
        ref={pickerRef}
        className={styles.native}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={currentIso}
        onChange={(event) => {
          const next = event.target.value.slice(0, 10);
          setText(displayFromIso(next));
          setIso(next);
        }}
      />
      {name ? (
        <input type="hidden" name={name} value={currentIso} readOnly />
      ) : null}
    </div>
  );
}
