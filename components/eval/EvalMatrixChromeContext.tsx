"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type EvalMatrixChromeRegistration = {
  roster: Doc<"users">[];
  selectedSubjectId: Id<"users">;
  onSubjectChange: (id: Id<"users">) => void;
  signedInName: string;
};

type EvalMatrixChromeContextValue = {
  chrome: EvalMatrixChromeRegistration | null;
  setChrome: (next: EvalMatrixChromeRegistration | null) => void;
};

const EvalMatrixChromeContext =
  createContext<EvalMatrixChromeContextValue | null>(null);

export function EvalMatrixChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<EvalMatrixChromeRegistration | null>(
    null,
  );
  const value = useMemo(
    () => ({ chrome, setChrome }),
    [chrome],
  );
  return (
    <EvalMatrixChromeContext.Provider value={value}>
      {children}
    </EvalMatrixChromeContext.Provider>
  );
}

export function useEvalMatrixChrome(): EvalMatrixChromeRegistration | null {
  const ctx = useContext(EvalMatrixChromeContext);
  return ctx?.chrome ?? null;
}

export function useEvalMatrixChromeSetter(): (
  next: EvalMatrixChromeRegistration | null,
) => void {
  const ctx = useContext(EvalMatrixChromeContext);
  if (!ctx) {
    throw new Error(
      "useEvalMatrixChromeSetter must be used under EvalMatrixChromeProvider",
    );
  }
  return ctx.setChrome;
}
