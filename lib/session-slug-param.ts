import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import { normalizeSessionSlug } from "@/lib/session-slug";

/** Parse `?session=` for room/eval routes; invalid values fall back to `default`. */
export function parseSessionSlugParam(raw: string | undefined | null): string {
  if (raw == null || raw === "") return DEFAULT_SESSION_SLUG;
  try {
    return normalizeSessionSlug(raw);
  } catch {
    return DEFAULT_SESSION_SLUG;
  }
}
