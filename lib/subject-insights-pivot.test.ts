import type { Doc, Id } from "@/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  buildRadarData,
  findEvaluation,
  heatmapCellCompareValue,
  heatmapSkillBaseline,
  INSIGHTS_HARD_SKILL_IDS,
  insightForEvaluationRow,
} from "./subject-insights-pivot";

const fakeSubjectId = "n9k2" as Id<"users">;
const fakeEvaluatorId = "n9k3" as Id<"users">;

describe("subject-insights-pivot", () => {
  it("findEvaluation matches triple", () => {
    const rows = [
      {
        evaluatorId: fakeEvaluatorId,
        subjectId: fakeSubjectId,
        skillId: "code-reviews",
      },
    ] as Doc<"evaluations">[];
    expect(
      findEvaluation(rows, fakeEvaluatorId, fakeSubjectId, "code-reviews"),
    ).toBeDefined();
    expect(findEvaluation(rows, fakeEvaluatorId, fakeSubjectId, "mentoring")).toBeUndefined();
  });

  it("insightForEvaluationRow returns gap when no row", () => {
    const r = insightForEvaluationRow(undefined, "code-reviews");
    expect(r).not.toBeNull();
    expect(r!.foundation.baseLevel).toBe(0);
    expect(r!.foundationGap).toBe(true);
  });

  it("buildRadarData includes skillLabel and ui key", () => {
    const skillIds = INSIGHTS_HARD_SKILL_IDS.slice(0, 2);
    const data = buildRadarData({
      subjectId: fakeSubjectId,
      evaluations: [],
      evaluatorIds: [fakeEvaluatorId],
      skillIds,
    });
    expect(data).toHaveLength(2);
    expect(data[0].skillLabel).toBeTruthy();
    expect(data[0][`ui:${fakeEvaluatorId}`]).toBe(0);
  });

  it("heatmapSkillBaseline prefers calibration", () => {
    const skillId = INSIGHTS_HARD_SKILL_IDS[0]!;
    const b = heatmapSkillBaseline({
      subjectId: fakeSubjectId,
      skillId,
      evaluations: [],
      evaluatorIds: [fakeEvaluatorId],
      calibrationMark: 4.2,
    });
    expect(b).toBe(4.2);
  });

  it("heatmapSkillBaseline averages manual marks when no calibration", () => {
    const skillId = INSIGHTS_HARD_SKILL_IDS[0]!;
    const ev2 = "n9k4" as Id<"users">;
    const evaluations = [
      {
        evaluatorId: fakeEvaluatorId,
        subjectId: fakeSubjectId,
        skillId,
        checkpoints: {},
        manualMark: 3,
      },
      {
        evaluatorId: ev2,
        subjectId: fakeSubjectId,
        skillId,
        checkpoints: {},
        manualMark: 5,
      },
    ] as Doc<"evaluations">[];
    const b = heatmapSkillBaseline({
      subjectId: fakeSubjectId,
      skillId,
      evaluations,
      evaluatorIds: [fakeEvaluatorId, ev2],
    });
    expect(b).toBe(4);
  });

  it("heatmapCellCompareValue uses manual when present", () => {
    const skillId = INSIGHTS_HARD_SKILL_IDS[0]!;
    const row = {
      evaluatorId: fakeEvaluatorId,
      subjectId: fakeSubjectId,
      skillId,
      checkpoints: {},
      manualMark: 4,
    } as Doc<"evaluations">;
    const insight = insightForEvaluationRow(row, skillId);
    expect(heatmapCellCompareValue(row, insight)).toBe(4);
  });

  it("heatmapCellCompareValue falls back to UI estimate without manual", () => {
    const skillId = INSIGHTS_HARD_SKILL_IDS[0]!;
    const row = {
      evaluatorId: fakeEvaluatorId,
      subjectId: fakeSubjectId,
      skillId,
      checkpoints: {},
    } as Doc<"evaluations">;
    const insight = insightForEvaluationRow(row, skillId);
    expect(heatmapCellCompareValue(row, insight)).toBe(
      insight!.foundation.uiEstimate,
    );
  });
});
