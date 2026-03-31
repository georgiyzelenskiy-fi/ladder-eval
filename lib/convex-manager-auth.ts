/** Shared Convex-side check for manager-only mutations when `MANAGER_ACCESS_KEY` is set. */
export function assertManagerKey(provided: string | undefined): void {
  const required = process.env.MANAGER_ACCESS_KEY;
  if (required == null || required === "") return;
  if (provided !== required) {
    throw new Error("Manager access required");
  }
}

/** True when env requires a key and the provided key matches (for read-side gates). */
export function isManagerKeyValid(provided: string | undefined): boolean {
  const required = process.env.MANAGER_ACCESS_KEY;
  if (required == null || required === "") return false;
  return provided === required;
}

/** Whether deploy uses a manager access key (stricter read paths can key off this). */
export function isManagerAccessKeyConfigured(): boolean {
  const required = process.env.MANAGER_ACCESS_KEY;
  return required != null && required !== "";
}
