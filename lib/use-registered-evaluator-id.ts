"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  evaluatorUserIdStorageKey,
  lastEvalSlugStorageKey,
} from "@/lib/devsync-constants";
import { useMemo, useSyncExternalStore } from "react";

function readStoredSessionConvexUserId(
  sessionSlug: string,
): Id<"users"> | null {
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

function useStoredSessionConvexUserId(
  sessionSlug: string,
): Id<"users"> | null {
  return useSyncExternalStore(
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
    () => readStoredSessionConvexUserId(sessionSlug),
    () => null,
  );
}

/**
 * Convex user id for this browser in `sessionSlug`, if that user is on the roster (any role).
 * Same localStorage keys as `/eval/[slug]` join — includes managers who signed in via their matrix link.
 */
export function useRegisteredRosterMemberId(
  sessionSlug: string,
  roster: Doc<"users">[] | undefined,
): Id<"users"> | null {
  const stored = useStoredSessionConvexUserId(sessionSlug);
  return useMemo(() => {
    if (!stored || !roster?.length) return null;
    return roster.some((u) => u._id === stored) ? stored : null;
  }, [stored, roster]);
}

/**
 * Convex user id for this browser in `sessionSlug`, if it matches an evaluator on the roster.
 * Uses the same localStorage keys as `/eval/[slug]` join.
 */
export function useRegisteredEvaluatorId(
  sessionSlug: string,
  roster: Doc<"users">[] | undefined,
): Id<"users"> | null {
  const stored = useStoredSessionConvexUserId(sessionSlug);
  return useMemo(() => {
    if (!stored || !roster?.length) return null;
    const user = roster.find((u) => u._id === stored);
    if (!user || user.role !== "evaluator") return null;
    return stored;
  }, [stored, roster]);
}
