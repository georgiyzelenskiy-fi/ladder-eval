import { describe, expect, it } from "vitest";
import { HARD_SKILL_COMPETENCIES } from "./hard-skills-rubric";
import { MATRIX_COMPETENCIES } from "./matrix-competencies";
import {
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
} from "./skill-checkpoints";

describe("competencyCheckpointDisplayRows", () => {
  it("matches checkpoint id count and order for every matrix competency", () => {
    for (const c of MATRIX_COMPETENCIES) {
      const cps = competencyToCheckpoints(c);
      const rows = competencyCheckpointDisplayRows(c);
      expect(rows.length).toBe(cps.length);
      for (let i = 0; i < cps.length; i++) {
        expect(rows[i]!.id).toBe(cps[i]!.id);
        expect(rows[i]!.level).toBe(cps[i]!.level);
      }
    }
  });

  it("marks nested rows for subcriteria (code-reviews L1)", () => {
    const comp = HARD_SKILL_COMPETENCIES[0]!;
    const rows = competencyCheckpointDisplayRows(comp);
    const nestedUnderParent = rows.filter((r) => r.nested);
    expect(nestedUnderParent.length).toBeGreaterThan(0);
  });
});
