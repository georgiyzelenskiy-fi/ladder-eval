import type { SkillCompetency, SkillLevelNumber } from "./skill-rubric-common";

/** One scored checkbox, aligned with `flattenSkillCriteriaStrings` (parent line then each subcriterion). */
export type SkillCheckpoint = {
  id: string;
  level: SkillLevelNumber;
};

/**
 * Stable IDs for persistence: `${competencyId}-L${level}-p${index}` within that competency+level.
 * Index order matches evaluation UI rows (criterion text, then nested sub-bullets).
 */
export function competencyToCheckpoints(
  competency: SkillCompetency,
): SkillCheckpoint[] {
  const out: SkillCheckpoint[] = [];
  for (const levelRubric of competency.levels) {
    const L = levelRubric.number;
    let p = 0;
    for (const c of levelRubric.criteria) {
      out.push({ id: `${competency.id}-L${L}-p${p}`, level: L });
      p += 1;
      if (c.subcriteria?.length) {
        for (let s = 0; s < c.subcriteria.length; s++) {
          out.push({ id: `${competency.id}-L${L}-p${p}`, level: L });
          p += 1;
        }
      }
    }
  }
  return out;
}

export function competenciesToCheckpoints(
  competencies: readonly SkillCompetency[],
): SkillCheckpoint[] {
  return competencies.flatMap((c) => competencyToCheckpoints(c));
}
