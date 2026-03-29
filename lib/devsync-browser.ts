"use client";

import {
  DEFAULT_SESSION_SLUG,
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  LAST_VISITED_SESSION_SLUG_STORAGE_KEY,
  MANAGER_ACCESS_KEY_STORAGE_KEY,
} from "@/lib/devsync-constants";
import { normalizeSessionSlug } from "@/lib/session-slug";
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
export function persistLastVisitedSessionSlug(sessionSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionSlug === DEFAULT_SESSION_SLUG) {
      localStorage.removeItem(LAST_VISITED_SESSION_SLUG_STORAGE_KEY);
    } else {
      localStorage.setItem(LAST_VISITED_SESSION_SLUG_STORAGE_KEY, sessionSlug);
    }
    window.dispatchEvent(new Event(DEVSYNC_STORAGE_NOTIFY_EVENT));
  } catch {
    /* quota / private mode */
  }
}

export function readLastVisitedSessionSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_VISITED_SESSION_SLUG_STORAGE_KEY);
    if (raw == null || raw === "") return null;
    try {
      return normalizeSessionSlug(raw);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/** Re-reads when `DEVSYNC_STORAGE_NOTIFY_EVENT` or `storage` fires (same-tab + cross-tab). */
export function useLastVisitedSessionSlug(): string | null {
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
    () => {
      try {
        const raw = localStorage.getItem(LAST_VISITED_SESSION_SLUG_STORAGE_KEY);
        if (raw == null || raw === "") return null;
        try {
          return normalizeSessionSlug(raw);
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    },
    () => null,
  );
}

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
