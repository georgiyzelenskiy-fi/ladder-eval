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

/** UI rows aligned 1:1 with `competencyToCheckpoints` checkpoint IDs. */
export type CheckpointDisplayRow = {
  id: string;
  level: SkillLevelNumber;
  text: string;
  /** Sub-criterion line under a parent bullet. */
  nested: boolean;
};

export function competencyCheckpointDisplayRows(
  competency: SkillCompetency,
): CheckpointDisplayRow[] {
  const checkpoints = competencyToCheckpoints(competency);
  const rows: CheckpointDisplayRow[] = [];
  let i = 0;
  for (const levelRubric of competency.levels) {
    const L = levelRubric.number;
    for (const c of levelRubric.criteria) {
      rows.push({
        id: checkpoints[i].id,
        level: L,
        text: c.text,
        nested: false,
      });
      i += 1;
      if (c.subcriteria?.length) {
        for (const sub of c.subcriteria) {
          rows.push({
            id: checkpoints[i].id,
            level: L,
            text: sub,
            nested: true,
          });
          i += 1;
        }
      }
    }
  }
  return rows;
}
