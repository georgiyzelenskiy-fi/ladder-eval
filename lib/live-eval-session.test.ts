import { describe, expect, it } from "vitest";
import {
  advanceLiveEvalRevealCursor,
  computePeerRevealOrder,
  filterRandomizeSubjectCandidates,
  type LiveEvalRosterEntry,
} from "./live-eval-session";

function roster(
  rows: Array<{ id: string; role: string; slug: string }>,
): LiveEvalRosterEntry[] {
  return rows.map((r) => ({
    userId: r.id,
    role: r.role,
    slug: r.slug,
  }));
}

describe("computePeerRevealOrder", () => {
  it("includes all evaluators (including any subject), excludes manager, sorts by slug", () => {
    const r = roster([
      { id: "m1", role: "manager", slug: "manager" },
      { id: "s1", role: "evaluator", slug: "zebra" },
      { id: "s2", role: "evaluator", slug: "alpha" },
      { id: "s3", role: "evaluator", slug: "beta" },
    ]);
    expect(computePeerRevealOrder(r)).toEqual(["s2", "s3", "s1"]);
  });

  it("returns single evaluator when they are the only one (self-only queue)", () => {
    const r = roster([
      { id: "m1", role: "manager", slug: "m" },
      { id: "only", role: "evaluator", slug: "only" },
    ]);
    expect(computePeerRevealOrder(r)).toEqual(["only"]);
  });

  it("uses localeCompare for slug ordering", () => {
    const r = roster([
      { id: "a", role: "evaluator", slug: "B" },
      { id: "b", role: "evaluator", slug: "a" },
    ]);
    expect(computePeerRevealOrder(r)).toEqual(["b", "a"]);
  });

  it("returns empty for empty roster", () => {
    expect(computePeerRevealOrder([])).toEqual([]);
  });

  it("returns empty when there are no evaluators (manager-only)", () => {
    const r = roster([{ id: "m1", role: "manager", slug: "mgr" }]);
    expect(computePeerRevealOrder(r)).toEqual([]);
  });
});

describe("filterRandomizeSubjectCandidates", () => {
  it("drops calibrated subjects and current subject when set", () => {
    const calibrated = new Set(["u1", "u3"]);
    expect(
      filterRandomizeSubjectCandidates(
        ["u1", "u2", "u3", "u4"],
        calibrated,
        "u2",
      ),
    ).toEqual(["u4"]);
  });

  it("allows current subject when undefined (first pick)", () => {
    expect(
      filterRandomizeSubjectCandidates(["u1", "u2"], new Set(), undefined),
    ).toEqual(["u1", "u2"]);
  });

  it("returns empty when everyone is calibrated", () => {
    expect(
      filterRandomizeSubjectCandidates(
        ["u1", "u2"],
        new Set(["u1", "u2"]),
        undefined,
      ),
    ).toEqual([]);
  });
});

describe("advanceLiveEvalRevealCursor", () => {
  it("increments when within range", () => {
    expect(advanceLiveEvalRevealCursor(0, 3)).toBe(1);
    expect(advanceLiveEvalRevealCursor(2, 3)).toBe(3);
  });

  it("does not advance when order empty", () => {
    expect(advanceLiveEvalRevealCursor(0, 0)).toBeUndefined();
  });

  it("does not advance when already at or past end", () => {
    expect(advanceLiveEvalRevealCursor(3, 3)).toBeUndefined();
    expect(advanceLiveEvalRevealCursor(4, 3)).toBeUndefined();
  });
});
