"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getPrivacyServerSnapshot,
  getPrivacySnapshot,
  subscribeDisplayPreferences,
  writePrivacy,
} from "@/lib/appearance-store";

interface PrivacyContextValue {
  privacy: boolean;
  setPrivacy: (privacy: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const privacy = useSyncExternalStore(
    subscribeDisplayPreferences,
    getPrivacySnapshot,
    getPrivacyServerSnapshot,
  );

  const setPrivacy = useCallback((next: boolean) => {
    writePrivacy(next);
  }, []);

  const value = useMemo(() => ({ privacy, setPrivacy }), [privacy, setPrivacy]);

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  );
}

export function useOptionalPrivacy(): PrivacyContextValue {
  return (
    useContext(PrivacyContext) ?? {
      privacy: false,
      setPrivacy: () => undefined,
    }
  );
}

export function usePrivacy(): PrivacyContextValue {
  const value = useContext(PrivacyContext);
  if (!value) {
    throw new Error("usePrivacy must be used inside PrivacyProvider.");
  }
  return value;
}
