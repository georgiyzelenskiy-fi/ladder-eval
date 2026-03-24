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

/** Parent row plus following nested rows (same level), aligned with checkpoint ID order. */
export type CheckpointDisplayGroup = {
  parent: CheckpointDisplayRow;
  nested: CheckpointDisplayRow[];
};

export function groupCheckpointDisplayRows(
  rows: readonly CheckpointDisplayRow[],
): CheckpointDisplayGroup[] {
  const groups: CheckpointDisplayGroup[] = [];
  for (const r of rows) {
    if (!r.nested) {
      groups.push({ parent: r, nested: [] });
    } else {
      const last = groups[groups.length - 1];
      if (last) last.nested.push(r);
    }
  }
  return groups;
}

/**
 * For each parent with subcriteria: parent counts as checked iff every nested row is checked.
 * Used so scoring matches nested-first semantics even if legacy rows only toggled children.
 */
export function applyParentNestedCheckpointConsistency(
  checked: ReadonlySet<string>,
  groups: readonly CheckpointDisplayGroup[],
): Set<string> {
  const s = new Set(checked);
  for (const g of groups) {
    if (g.nested.length === 0) continue;
    const allNested = g.nested.every((n) => s.has(n.id));
    if (allNested) s.add(g.parent.id);
    else s.delete(g.parent.id);
  }
  return s;
}
