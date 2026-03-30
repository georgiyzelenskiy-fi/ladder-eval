"use client";

import {
  DEVSYNC_STORAGE_NOTIFY_EVENT,
  lastEvalSlugStorageKey,
} from "@/lib/devsync-constants";
import { useSyncExternalStore } from "react";

/** Last `/eval/[slug]` segment this browser used for the given session (localStorage). */
export function useLastJoinedEvalSlug(sessionSlug: string): string | null {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const onNotify = () => onChange();
      window.addEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, onNotify);
      window.addEventListener("storage", onNotify);
      return () => {
        window.removeEventListener(DEVSYNC_STORAGE_NOTIFY_EVENT, onNotify);
        window.removeEventListener("storage", onNotify);
      };
    },
    () => {
      try {
        const v = localStorage.getItem(lastEvalSlugStorageKey(sessionSlug));
        return v && v.length > 0 ? v : null;
      } catch {
        return null;
      }
    },
    () => null,
  );
}
