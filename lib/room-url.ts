import { DEFAULT_SESSION_SLUG } from "./devsync-constants";

/** Build `/room/*` href with optional `session` and manager `k` query params. */
export function buildRoomHref(
  path: string,
  sessionSlug: string,
  managerKey?: string | null,
): string {
  const params = new URLSearchParams();
  if (sessionSlug !== DEFAULT_SESSION_SLUG) {
    params.set("session", sessionSlug);
  }
  if (managerKey) {
    params.set("k", managerKey);
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
