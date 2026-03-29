"use client";

import {
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  evaluatorUserIdStorageKey,
  LAST_EVAL_SLUG_STORAGE_KEY,
  MANAGER_ACCESS_KEY_STORAGE_KEY,
} from "@/lib/devsync-constants";
import { useSyncExternalStore } from "react";

export function persistManagerAccessKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MANAGER_ACCESS_KEY_STORAGE_KEY, key);
    window.dispatchEvent(new Event(DEVSYNC_STORAGE_NOTIFY_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function readManagerAccessKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(MANAGER_ACCESS_KEY_STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Subscribes to manager-key changes (same-tab notify + cross-tab `storage`). */
export function useStoredManagerAccessKey(): string | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const h = () => onStoreChange();
      window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
      window.addEventListener("storage", h);
      return () => {
        window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
        window.removeEventListener("storage", h);
      };
    },
    readManagerAccessKey,
    () => null,
  );
}

function subscribeLocalStorageKeys(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = () => onStoreChange();
  window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, h);
    window.removeEventListener("storage", h);
  };
}

/** Last `/eval/[slug]` joined in this browser (see `EvalJoinClient`). */
export function useLastJoinedEvalSlug(): string | null {
  return useSyncExternalStore(
    subscribeLocalStorageKeys,
    () => {
      try {
        const v = localStorage.getItem(LAST_EVAL_SLUG_STORAGE_KEY);
        return v && v.length > 0 ? v : null;
      } catch {
        return null;
      }
    },
    () => null,
  );
}

/**
 * Slug + Convex `users` id from the last matrix join — for “your turn” hints on room pages.
 * Snapshot is a string so `useSyncExternalStore` stays referentially stable.
 */
export function useJoinedEvaluatorSessionHints(): {
  evalSlug: string | null;
  convexUserId: string | null;
} {
  const snap = useSyncExternalStore(
    subscribeLocalStorageKeys,
    () => {
      try {
        const slug = localStorage.getItem(LAST_EVAL_SLUG_STORAGE_KEY);
        if (!slug || slug.length === 0) return "\x1e";
        const id =
          localStorage.getItem(evaluatorUserIdStorageKey(slug)) ?? "";
        return `${slug}\x1e${id}`;
      } catch {
        return "\x1e";
      }
    },
    () => "\x1e",
  );
  const sep = snap.indexOf("\x1e");
  if (sep < 0) return { evalSlug: null, convexUserId: null };
  const evalSlug = snap.slice(0, sep) || null;
  const convexUserId = snap.slice(sep + 1) || null;
  return { evalSlug, convexUserId };
}
