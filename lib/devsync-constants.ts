/** Canonical room slug for MVP single-session bootstrap (`session.ensureSession`). */
export const DEFAULT_SESSION_SLUG = "default" as const;

export const STORAGE_USER_ID_KEY = "devsync-convex-user-id";

/** Dispatched when evaluator localStorage keys change (same-tab; `storage` event is cross-tab only). */
export const DEVSYNC_STORAGE_NOTIFY_EVENT = "devsync-local-storage";

/** Bound Convex `users` id after join on `/eval/[slug]` (scoped by session). */
export function evaluatorUserIdStorageKey(
  sessionSlug: string,
  evaluatorSlug: string,
): string {
  return `${STORAGE_USER_ID_KEY}:${sessionSlug}:${evaluatorSlug}`;
}

/** Last joined `/eval/[slug]` segment for a session — drives sidebar from `/room/*`. */
export function lastEvalSlugStorageKey(sessionSlug: string): string {
  return `devsync-last-eval-slug:${sessionSlug}`;
}

/** Legacy key for the default session only (same as `lastEvalSlugStorageKey("default")`). */
export const LAST_EVAL_SLUG_STORAGE_KEY =
  lastEvalSlugStorageKey(DEFAULT_SESSION_SLUG);

/**
 * Persists `MANAGER_ACCESS_KEY` after one valid `?k=` visit so `/room/live-evaluation`
 * can unlock without repeating the query param (MVP convenience; XSS can read this).
 */
export const MANAGER_ACCESS_KEY_STORAGE_KEY =
  `devsync-manager-access-key:${DEFAULT_SESSION_SLUG}` as const;

/** Last non-`default` session slug visited on `/eval/*` — scopes `/room/*` links when `?session=` is omitted. */
export const LAST_VISITED_SESSION_SLUG_STORAGE_KEY =
  "devsync-last-visited-session-slug" as const;
