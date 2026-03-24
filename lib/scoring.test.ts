import { describe, expect, it } from "vitest";
import type { SkillCheckpoint } from "./skill-checkpoints";
import { computeFoundationFirstUiEstimate } from "./scoring";

function ids(cps: SkillCheckpoint[], pick: number[]) {
  return new Set(pick.map((i) => cps[i]!.id));
}

describe("computeFoundationFirstUiEstimate", () => {
  it("matches design doc worked example (L1 full, L2 partial, L4 full)", () => {
    const checkpoints: SkillCheckpoint[] = [
      ...[0, 1, 2, 3].map((i) => ({
        id: `x-L1-p${i}`,
        level: 1 as const,
      })),
      ...[0, 1, 2, 3].map((i) => ({
        id: `x-L2-p${i}`,
        level: 2 as const,
      })),
      ...[0, 1, 2, 3].map((i) => ({
        id: `x-L4-p${i}`,
        level: 4 as const,
      })),
    ];

    const checked = ids(checkpoints, [
      0, 1, 2, 3,
      4, 5,
      8, 9, 10, 11,
    ]);

    const r = computeFoundationFirstUiEstimate(checkpoints, checked, {
      spikeStep: 0.1,
    });

    expect(r.baseLevel).toBe(1);
    expect(r.baseNumeric).toBe(1);
    expect(r.spikeCount).toBe(6);
    expect(r.uiEstimate).toBeCloseTo(1.6, 5);
    expect(r.prematurePeakLevels).toEqual([4]);
  });

  it("does not flag the rung immediately above base as premature (L1 full, L2 partial only)", () => {
    const checkpoints: SkillCheckpoint[] = [
      { id: "l1a", level: 1 },
      { id: "l1b", level: 1 },
      { id: "l2a", level: 2 },
      { id: "l2b", level: 2 },
    ];
    const checked = new Set(["l1a", "l1b", "l2a"]);
    const r = computeFoundationFirstUiEstimate(checkpoints, checked);
    expect(r.baseLevel).toBe(1);
    expect(r.prematurePeakLevels).toEqual([]);
  });

  it("returns base 0 when level 1 is incomplete", () => {
    const checkpoints: SkillCheckpoint[] = [
      { id: "a", level: 1 },
      { id: "b", level: 1 },
      { id: "c", level: 2 },
    ];
    const checked = new Set<string>(["c"]);
    const r = computeFoundationFirstUiEstimate(checkpoints, checked);
    expect(r.baseLevel).toBe(0);
    expect(r.spikeCount).toBe(1);
    expect(r.uiEstimate).toBeCloseTo(0.1, 5);
  });

  it("caps at maxScore", () => {
    const checkpoints: SkillCheckpoint[] = [
      { id: "l1", level: 1 },
      { id: "l2-gap", level: 2 },
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `p${i}`,
        level: 5 as const,
      })),
    ];
    const checked = new Set<string>(["l1", ...checkpoints.slice(2).map((c) => c.id)]);
    const r = computeFoundationFirstUiEstimate(checkpoints, checked, {
      spikeStep: 0.1,
      maxScore: 5,
    });
    expect(r.baseLevel).toBe(1);
    expect(r.spikeCount).toBe(50);
    expect(r.uiEstimate).toBe(5);
  });

  it("vacuous levels (no checkpoints) do not break the prefix", () => {
    const checkpoints: SkillCheckpoint[] = [
      { id: "l2a", level: 2 },
      { id: "l2b", level: 2 },
    ];
    const checked = new Set(["l2a", "l2b"]);
    const r = computeFoundationFirstUiEstimate(checkpoints, checked);
    expect(r.baseLevel).toBe(2);
    expect(r.spikeCount).toBe(0);
    expect(r.uiEstimate).toBe(2);
  });
});
