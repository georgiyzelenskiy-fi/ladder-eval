"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  evaluatorUserIdStorageKey,
  lastEvalSlugStorageKey,
} from "@/lib/devsync-constants";
import { useMemo, useSyncExternalStore } from "react";

function readStoredEvaluatorUserId(sessionSlug: string): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  try {
    const evalSlug = localStorage.getItem(lastEvalSlugStorageKey(sessionSlug));
    if (!evalSlug) return null;
    const raw = localStorage.getItem(
      evaluatorUserIdStorageKey(sessionSlug, evalSlug),
    );
    return raw ? (raw as Id<"users">) : null;
  } catch {
    return null;
  }
}

/**
 * Convex user id for this browser in `sessionSlug`, if it matches an evaluator on the roster.
 * Uses the same localStorage keys as `/eval/[slug]` join.
 */
export function useRegisteredEvaluatorId(
  sessionSlug: string,
  roster: Doc<"users">[] | undefined,
): Id<"users"> | null {
  const stored = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const h = () => onChange();
      window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
      window.addEventListener("storage", h);
      return () => {
        window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
        window.removeEventListener("storage", h);
      };
    },
    () => readStoredEvaluatorUserId(sessionSlug),
    () => null,
  );

  return useMemo(() => {
    if (!stored || !roster?.length) return null;
    const user = roster.find((u) => u._id === stored);
    if (!user || user.role !== "evaluator") return null;
    return stored;
  }, [stored, roster]);
}
