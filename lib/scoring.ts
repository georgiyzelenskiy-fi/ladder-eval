import type { SkillLevelNumber } from "./skill-rubric-common";
import type { SkillCheckpoint } from "./skill-checkpoints";

const ORDERED_LEVELS: readonly SkillLevelNumber[] = [1, 2, 3, 4, 5];

export type FoundationFirstResult = {
  /** Highest fully satisfied rung (0 = no complete rung, including L1 incomplete). */
  baseLevel: SkillLevelNumber | 0;
  /** Same as baseLevel as a numeric score contribution (0–5). */
  baseNumeric: number;
  /** Checkpoints with level > baseLevel that are checked. */
  spikeCount: number;
  uiEstimate: number;
  /** Levels > baseLevel with at least one checked checkpoint (out-of-sequence strength). */
  prematurePeakLevels: SkillLevelNumber[];
};

export type FoundationFirstOptions = {
  /** Marginal weight per checkpoint above base (design default 0.1). */
  spikeStep?: number;
  maxScore?: number;
};

/**
 * Foundation-first (Guttman-style) UI estimate: highest fully complete level as base,
 * plus spike bonus for any satisfied checkpoints above that base, capped at maxScore.
 */
export function computeFoundationFirstUiEstimate(
  checkpoints: readonly SkillCheckpoint[],
  checked: ReadonlySet<string>,
  options?: FoundationFirstOptions,
): FoundationFirstResult {
  const spikeStep = options?.spikeStep ?? 0.1;
  const maxScore = options?.maxScore ?? 5;

  const byLevel = new Map<SkillLevelNumber, string[]>();
  for (const cp of checkpoints) {
    const list = byLevel.get(cp.level) ?? [];
    list.push(cp.id);
    byLevel.set(cp.level, list);
  }

  let baseLevel: SkillLevelNumber | 0 = 0;
  for (const L of ORDERED_LEVELS) {
    const ids = byLevel.get(L);
    if (!ids || ids.length === 0) continue;
    const allMet = ids.every((id) => checked.has(id));
    if (allMet) baseLevel = L;
    else break;
  }

  const baseNumeric = baseLevel;

  let spikeCount = 0;
  const premature = new Set<SkillLevelNumber>();
  for (const cp of checkpoints) {
    if (cp.level > baseLevel && checked.has(cp.id)) {
      spikeCount += 1;
      premature.add(cp.level);
    }
  }

  const uiEstimate = Math.min(
    maxScore,
    baseNumeric + spikeCount * spikeStep,
  );

  const prematurePeakLevels = [...premature].sort((a, b) => a - b);

  return {
    baseLevel,
    baseNumeric,
    spikeCount,
    uiEstimate,
    prematurePeakLevels,
  };
}
