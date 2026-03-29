"use client";

import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import { useLastVisitedSessionSlug } from "@/lib/devsync-browser";
import { parseSessionSlugParam } from "@/lib/session-slug-param";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Session slug for `/room/*` sidebar links: explicit `?session=` wins; otherwise last visited
 * non-default from `/eval/*` (localStorage), then `default`.
 */
export function useRoomLinkSessionSlug(): string {
  const sp = useSearchParams();
  const lastVisited = useLastVisitedSessionSlug();
  const rawSession = sp.get("session");

  return useMemo(() => {
    if (rawSession != null && rawSession !== "") {
      return parseSessionSlugParam(rawSession);
    }
    return lastVisited ?? DEFAULT_SESSION_SLUG;
  }, [rawSession, lastVisited]);
}
