const MAX_SESSION_SLUG_LEN = 64;
/** Lowercase session URL segment: `a`, `a-b`, `team-2026-q1`. */
const SESSION_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Normalizes and validates a session slug for `sessions.slug`.
 * @throws Error if empty, too long, or contains invalid characters.
 */
export function normalizeSessionSlug(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.length === 0) {
    throw new Error("Session slug is required");
  }
  if (s.length > MAX_SESSION_SLUG_LEN) {
    throw new Error("Session slug is too long");
  }
  if (!SESSION_SLUG_RE.test(s)) {
    throw new Error(
      "Session slug must be lowercase letters, digits, and single hyphens between segments",
    );
  }
  return s;
}
