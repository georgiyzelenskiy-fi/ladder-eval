/**
 * Shared types and level scale for hard- and soft-skills rubrics (Emplifi skill evaluation).
 */

export const SKILL_LEVEL_KEYS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
  "leadingExpert",
] as const;

export type SkillLevelKey = (typeof SKILL_LEVEL_KEYS)[number];

export type SkillLevelNumber = 1 | 2 | 3 | 4 | 5;

export type SkillCriterion = {
  text: string;
  /** Nested bullets (e.g. examples, clarifications). */
  subcriteria?: string[];
};

export type SkillLevelRubric = {
  number: SkillLevelNumber;
  key: SkillLevelKey;
  label: string;
  /** Short self-summary line shown per competency. */
  tagline: string;
  criteria: SkillCriterion[];
};

export type SkillCompetency = {
  id: string;
  name: string;
  /** Dimensions from the source doc, normalized to a list. */
  dimensions: string[];
  levels: SkillLevelRubric[];
};

export type SkillLevelDefinition = {
  number: SkillLevelNumber;
  key: SkillLevelKey;
  label: string;
  description: string;
};

/** Global meaning of numeric levels (same for hard and soft skills). */
export const SKILL_LEVEL_DEFINITIONS = [
  {
    number: 1,
    key: "beginner",
    label: "Beginner",
    description:
      "Possessing basics of the competency, still rather junior, a lot of guidance is needed.",
  },
  {
    number: 2,
    key: "intermediate",
    label: "Intermediate",
    description:
      "Progressing further within the competency, mid-level, guidance is required sometimes.",
  },
  {
    number: 3,
    key: "advanced",
    label: "Advanced",
    description:
      "Having more advanced skills, senior in the role, being able to guide others and has cross team impact.",
  },
  {
    number: 4,
    key: "expert",
    label: "Expert",
    description:
      "Being able to pass on the knowledge and have an impact on other teams and departments.",
  },
  {
    number: 5,
    key: "leadingExpert",
    label: "Leading Expert",
    description:
      "Proven impact within and outside of the company, advancing the industry forward, thought leader.",
  },
] as const satisfies readonly SkillLevelDefinition[];

export function getSkillCompetencyById(
  competencies: readonly SkillCompetency[],
  id: string,
): SkillCompetency | undefined {
  return competencies.find((c) => c.id === id);
}

/** Flatten criteria to parent + nested strings (search, simple UI). */
export function flattenSkillCriteriaStrings(
  criteria: readonly SkillCriterion[],
): string[] {
  const out: string[] = [];
  for (const c of criteria) {
    out.push(c.text);
    if (c.subcriteria?.length) out.push(...c.subcriteria);
  }
  return out;
}
