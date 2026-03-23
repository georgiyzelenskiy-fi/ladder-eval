import type { SkillCompetency } from "./skill-rubric-common";
import { HARD_SKILL_COMPETENCIES } from "./hard-skills-rubric";
import { SOFT_SKILL_COMPETENCIES } from "./soft-skills-rubric";

/** Full evaluator matrix: hard then soft skills (distinct competency ids). */
export const MATRIX_COMPETENCIES: readonly SkillCompetency[] = [
  ...HARD_SKILL_COMPETENCIES,
  ...SOFT_SKILL_COMPETENCIES,
];
