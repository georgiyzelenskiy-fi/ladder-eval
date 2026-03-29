/**
 * Pure helpers for live evaluation session state (peer order, randomize candidates,
 * reveal cursor). Convex `session.ts` calls these; behavior is covered by Vitest.
 */

export type LiveEvalRosterEntry = {
  userId: string;
  role: string;
  slug: string;
};

/**
 * Live reveal queue: every **evaluator** (including the current subject’s self row),
 * stable order by slug (`localeCompare`). Peers and self all get a reveal turn for calibration.
 */
export function computePeerRevealOrder(
  roster: readonly LiveEvalRosterEntry[],
): string[] {
  return roster
    .filter((u) => u.role === "evaluator")
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((u) => u.userId);
}

/**
 * Evaluator user IDs eligible for randomize-subject: not yet calibrated for the active skill,
 * and not the current subject (when set) so the manager rotates to someone else.
 */
export function filterRandomizeSubjectCandidates(
  evaluatorUserIds: readonly string[],
  calibratedSubjectIds: ReadonlySet<string>,
  currentSubjectId: string | undefined,
): string[] {
  return evaluatorUserIds.filter(
    (id) =>
      !calibratedSubjectIds.has(id) &&
      (currentSubjectId === undefined || id !== currentSubjectId),
  );
}

/**
 * Next cursor after "reveal next". Undefined means no patch (empty order or already past end).
 */
export function advanceLiveEvalRevealCursor(
  cursor: number,
  orderLength: number,
): number | undefined {
  if (orderLength <= 0) return undefined;
  if (cursor >= orderLength) return undefined;
  return cursor + 1;
}
