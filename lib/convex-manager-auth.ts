/** Shared Convex-side check for manager-only mutations when `MANAGER_ACCESS_KEY` is set. */
export function assertManagerKey(provided: string | undefined): void {
  const required = process.env.MANAGER_ACCESS_KEY;
  if (required == null || required === "") return;
  if (provided !== required) {
    throw new Error("Manager access required");
  }
}
