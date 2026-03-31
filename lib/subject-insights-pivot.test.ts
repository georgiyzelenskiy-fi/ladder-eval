import type { Doc, Id } from "@/convex/_generated/dataModel";
import { describe, expect, it } from "vitest";
import {
  buildRadarData,
  findEvaluation,
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
});
