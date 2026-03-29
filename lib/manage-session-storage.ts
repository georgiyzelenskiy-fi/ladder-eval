const KEY = "devsync-manage-active-session-slug";

export function readManageSessionSlug(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function writeManageSessionSlug(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, slug);
  } catch {
    /* quota / private mode */
  }
}
