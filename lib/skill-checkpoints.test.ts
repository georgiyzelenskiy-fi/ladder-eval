import { describe, expect, it } from "vitest";
import { HARD_SKILL_COMPETENCIES } from "./hard-skills-rubric";
import { MATRIX_COMPETENCIES } from "./matrix-competencies";
import {
  applyParentNestedCheckpointConsistency,
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
  groupCheckpointDisplayRows,
  parentCheckpointMet,
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

describe("groupCheckpointDisplayRows", () => {
  it("groups nested rows under their parent", () => {
    const rows = [
      { id: "a", level: 1 as const, text: "p", nested: false },
      { id: "b", level: 1 as const, text: "n1", nested: true },
      { id: "c", level: 1 as const, text: "n2", nested: true },
    ];
    const g = groupCheckpointDisplayRows(rows);
    expect(g).toHaveLength(1);
    expect(g[0]!.parent.id).toBe("a");
    expect(g[0]!.nested.map((x) => x.id)).toEqual(["b", "c"]);
  });
});

describe("parentCheckpointMet", () => {
  it("is true for leaf parent when parent id is checked", () => {
    const rows = [
      { id: "a", level: 1 as const, text: "p", nested: false },
    ];
    const groups = groupCheckpointDisplayRows(rows);
    expect(parentCheckpointMet(groups[0]!, new Set(["a"]))).toBe(true);
    expect(parentCheckpointMet(groups[0]!, new Set())).toBe(false);
  });

  it("is true for parent with nested only when every nested is checked", () => {
    const rows = [
      { id: "a", level: 1 as const, text: "p", nested: false },
      { id: "b", level: 1 as const, text: "n1", nested: true },
      { id: "c", level: 1 as const, text: "n2", nested: true },
    ];
    const groups = groupCheckpointDisplayRows(rows);
    const g = groups[0]!;
    expect(parentCheckpointMet(g, new Set(["b", "c"]))).toBe(true);
    expect(parentCheckpointMet(g, new Set(["b"]))).toBe(false);
  });
});

describe("applyParentNestedCheckpointConsistency", () => {
  it("infers parent met when every nested checkpoint is met", () => {
    const rows = [
      { id: "a", level: 1 as const, text: "p", nested: false },
      { id: "b", level: 1 as const, text: "n1", nested: true },
    ];
    const groups = groupCheckpointDisplayRows(rows);
    const effective = applyParentNestedCheckpointConsistency(
      new Set(["b"]),
      groups,
    );
    expect(effective.has("a")).toBe(true);
    expect(effective.has("b")).toBe(true);
  });

  it("clears parent when any nested is missing", () => {
    const rows = [
      { id: "a", level: 1 as const, text: "p", nested: false },
      { id: "b", level: 1 as const, text: "n1", nested: true },
      { id: "c", level: 1 as const, text: "n2", nested: true },
    ];
    const groups = groupCheckpointDisplayRows(rows);
    const effective = applyParentNestedCheckpointConsistency(
      new Set(["a", "b"]),
      groups,
    );
    expect(effective.has("a")).toBe(false);
    expect(effective.has("b")).toBe(true);
    expect(effective.has("c")).toBe(false);
  });
});
