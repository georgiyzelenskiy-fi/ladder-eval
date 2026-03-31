import type { Doc, Id } from "@/convex/_generated/dataModel";
import { HARD_SKILL_COMPETENCIES } from "@/lib/hard-skills-rubric";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import {
  applyParentNestedCheckpointConsistency,
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
  groupCheckpointDisplayRows,
} from "@/lib/skill-checkpoints";
import { getSkillCompetencyById } from "@/lib/skill-rubric-common";
import { SOFT_SKILL_COMPETENCIES } from "@/lib/soft-skills-rubric";
import type { FoundationFirstResult } from "@/lib/scoring";
import { computeFoundationFirstUiEstimate } from "@/lib/scoring";

/** Radar axis order — matches matrix (hard then soft, five per group). */
export const INSIGHTS_HARD_SKILL_IDS: readonly string[] =
  HARD_SKILL_COMPETENCIES.map((c) => c.id);

export const INSIGHTS_SOFT_SKILL_IDS: readonly string[] =
  SOFT_SKILL_COMPETENCIES.map((c) => c.id);

export const INSIGHTS_ALL_SKILL_IDS: readonly string[] =
  MATRIX_COMPETENCIES.map((c) => c.id);

export type SkillRubricGroup = "hard" | "soft";

export function radarSkillIdsForGroup(group: SkillRubricGroup): readonly string[] {
  return group === "hard" ? INSIGHTS_HARD_SKILL_IDS : INSIGHTS_SOFT_SKILL_IDS;
}

function competencyBySkillId(skillId: string) {
  return getSkillCompetencyById(MATRIX_COMPETENCIES, skillId);
}

/** Foundation-first result + row presence for one evaluator × skill. */
export type CellInsight = {
  evaluation: Doc<"evaluations"> | undefined;
  foundation: FoundationFirstResult;
  /** True when base level is 0 (incomplete L1). */
  foundationGap: boolean;
};

export function insightForEvaluationRow(
  row: Doc<"evaluations"> | undefined,
  skillId: string,
): CellInsight | null {
  const competency = competencyBySkillId(skillId);
  if (!competency) return null;

  const checkpoints = competencyToCheckpoints(competency);
  const displayRows = competencyCheckpointDisplayRows(competency);
  const groupsAll = groupCheckpointDisplayRows(displayRows);

  const checked = new Set<string>();
  const map = row?.checkpoints ?? {};
  for (const [k, v] of Object.entries(map)) {
    if (v) checked.add(k);
  }
  const effectiveChecked = applyParentNestedCheckpointConsistency(
    checked,
    groupsAll,
  );

  const foundation = computeFoundationFirstUiEstimate(
    checkpoints,
    effectiveChecked,
  );
  const foundationGap = foundation.baseLevel === 0;

  return { evaluation: row, foundation, foundationGap };
}

export type EvaluatorRow = Doc<"users"> & { role: "evaluator" };

/** Evaluators sorted by slug (stable heatmap / legend order). */
export function evaluatorsSorted(roster: Doc<"users">[]): EvaluatorRow[] {
  return roster
    .filter((u): u is EvaluatorRow => u.role === "evaluator")
    .slice()
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function evaluationKey(
  evaluatorId: Id<"users">,
  subjectId: Id<"users">,
  skillId: string,
): string {
  return `${evaluatorId}:${subjectId}:${skillId}`;
}

/** Find evaluation for (evaluator, subject, skill). */
export function findEvaluation(
  rows: Doc<"evaluations">[],
  evaluatorId: Id<"users">,
  subjectId: Id<"users">,
  skillId: string,
): Doc<"evaluations"> | undefined {
  return rows.find(
    (r) =>
      r.evaluatorId === evaluatorId &&
      r.subjectId === subjectId &&
      r.skillId === skillId,
  );
}

/** One row per radar axis (skill); dynamic keys `ui:${evaluatorId}` / `manual:${evaluatorId}`. */
export type RadarDatum = Record<string, string | number | null>;

/**
 * Build Recharts-friendly rows: one object per axis skill, keys `ui:${evaluatorId}`, `manual:${evaluatorId}`.
 */
export function buildRadarData(params: {
  subjectId: Id<"users">;
  evaluations: Doc<"evaluations">[];
  evaluatorIds: Id<"users">[];
  skillIds: readonly string[];
}): RadarDatum[] {
  const { subjectId, evaluations, evaluatorIds, skillIds } = params;

  return skillIds.map((skillId) => {
    const competency = competencyBySkillId(skillId);
    const row: RadarDatum = {
      skillId,
      skillLabel: competency?.name ?? skillId,
    };

    for (const evId of evaluatorIds) {
      const evRow = findEvaluation(evaluations, evId, subjectId, skillId);
      const insight = insightForEvaluationRow(evRow, skillId);
      const uiVal = insight?.foundation.uiEstimate ?? null;
      row[`ui:${evId}`] = uiVal;
      const m = evRow?.manualMark;
      row[`manual:${evId}`] =
        m !== undefined && m !== null && Number.isFinite(m) ? m : null;
    }

    return row;
  });
}

export function calibrationMarkFor(
  marks: Doc<"calibrationMarks">[],
  subjectId: Id<"users">,
  skillId: string,
): number | undefined {
  const m = marks.find(
    (x) => x.subjectId === subjectId && x.skillId === skillId,
  );
  return m?.mark;
}

/**
 * Heatmap baseline per skill column: calibration mark if present; else mean of
 * evaluators’ manual marks for that skill; else mean of UI estimates.
 */
export function heatmapSkillBaseline(params: {
  subjectId: Id<"users">;
  skillId: string;
  evaluations: Doc<"evaluations">[];
  evaluatorIds: readonly Id<"users">[];
  calibrationMark?: number;
}): number | null {
  const cal = params.calibrationMark;
  if (cal !== undefined && cal !== null && Number.isFinite(cal)) {
    return cal;
  }

  const manuals: number[] = [];
  const uis: number[] = [];

  for (const evId of params.evaluatorIds) {
    const row = findEvaluation(
      params.evaluations,
      evId,
      params.subjectId,
      params.skillId,
    );
    const insight = insightForEvaluationRow(row, params.skillId);
    const m = row?.manualMark;
    if (m !== undefined && m !== null && Number.isFinite(m)) {
      manuals.push(m);
    }
    if (insight) {
      uis.push(insight.foundation.uiEstimate);
    }
  }

  if (manuals.length > 0) {
    return manuals.reduce((a, b) => a + b, 0) / manuals.length;
  }
  if (uis.length > 0) {
    return uis.reduce((a, b) => a + b, 0) / uis.length;
  }
  return null;
}

/** Value compared to baseline: manual mark when set, otherwise UI estimate. */
export function heatmapCellCompareValue(
  row: Doc<"evaluations"> | undefined,
  insight: CellInsight | null,
): number | null {
  const m = row?.manualMark;
  if (m !== undefined && m !== null && Number.isFinite(m)) {
    return m;
  }
  if (insight) {
    return insight.foundation.uiEstimate;
  }
  return null;
}
