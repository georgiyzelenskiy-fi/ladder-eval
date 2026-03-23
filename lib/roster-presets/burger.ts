/**
 * Preset roster: team “Burger” (Emplifi). Slugs are URL segments for `/eval/[slug]`.
 * Emails are for humans only; Convex stores slug + display name + role.
 */
export const BURGER_TEAM_TITLE = "Burger";

export type RosterSeedRole = "manager" | "evaluator";

export type RosterSeedEntry = {
  slug: string;
  name: string;
  role: RosterSeedRole;
  /** Not persisted — documentation / copy-paste for invites */
  email: string;
};

export const BURGER_ROSTER: RosterSeedEntry[] = [
  {
    slug: "honza-sroubek",
    name: "Honza Šroubek",
    role: "manager",
    email: "jan.sroubek@emplifi.io",
  },
  {
    slug: "adrien-rouaix",
    name: "Adrien Rouaix",
    role: "evaluator",
    email: "adrien.rouaix@emplifi.io",
  },
  {
    slug: "daniil-belov",
    name: "Dan Belov",
    role: "evaluator",
    email: "daniil.belov@emplifi.io",
  },
  {
    slug: "david-veltzer",
    name: "David Veltzer",
    role: "evaluator",
    email: "david.veltzer@emplifi.io",
  },
  {
    slug: "georgiy-zelenskiy",
    name: "Georgiy Zelenskiy",
    role: "evaluator",
    email: "georgiy.zelenskiy@emplifi.io",
  },
  {
    slug: "julien-baron",
    name: "Julien Baron",
    role: "evaluator",
    email: "julien.baron@emplifi.io",
  },
];

/** Evaluator invite paths (manager shares full URL with origin). */
export const BURGER_EVALUATOR_SLUGS = BURGER_ROSTER.filter(
  (r) => r.role === "evaluator",
).map((r) => r.slug);
