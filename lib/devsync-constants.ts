/** Canonical room slug for MVP single-session bootstrap (`session.ensureSession`). */
export const DEFAULT_SESSION_SLUG = "default" as const;

export const STORAGE_USER_ID_KEY = "devsync-convex-user-id";

/** Dispatched when evaluator localStorage keys change (same-tab; `storage` event is cross-tab only). */
export const DEVSYNC_STORAGE_NOTIFY_EVENT = "devsync-local-storage";

/** Bound Convex `users` id after join on `/eval/[slug]`. */
export function evaluatorUserIdStorageKey(evaluatorSlug: string): string {
  return `${STORAGE_USER_ID_KEY}:${DEFAULT_SESSION_SLUG}:${evaluatorSlug}`;
}

/** Last joined `/eval/[slug]` segment — drives sidebar “Skill matrix” from `/room/*`. */
export const LAST_EVAL_SLUG_STORAGE_KEY =
  `devsync-last-eval-slug:${DEFAULT_SESSION_SLUG}` as const;

/**
 * Persists `MANAGER_ACCESS_KEY` after one valid `?k=` visit so `/room/live-evaluation`
 * can unlock without repeating the query param (MVP convenience; XSS can read this).
 */
export const MANAGER_ACCESS_KEY_STORAGE_KEY =
  `devsync-manager-access-key:${DEFAULT_SESSION_SLUG}` as const;
