import { DEFAULT_SESSION_SLUG } from "./devsync-constants";

/** Shareable per-subject insights URL (see `/insights/[subjectSlug]`). */
export function buildInsightsHref(
  subjectSlug: string,
  sessionSlug: string,
): string {
  const params = new URLSearchParams();
  if (sessionSlug !== DEFAULT_SESSION_SLUG) {
    params.set("session", sessionSlug);
  }
  const q = params.toString();
  return q ? `/insights/${subjectSlug}?${q}` : `/insights/${subjectSlug}`;
}

/** Build `/eval/[slug]` href with optional `session` (non-default rounds). */
export function buildEvalHref(evaluatorSlug: string, sessionSlug: string): string {
  const params = new URLSearchParams();
  if (sessionSlug !== DEFAULT_SESSION_SLUG) {
    params.set("session", sessionSlug);
  }
  const q = params.toString();
  return q ? `/eval/${evaluatorSlug}?${q}` : `/eval/${evaluatorSlug}`;
}

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
