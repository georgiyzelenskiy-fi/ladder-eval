import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Prepare-then-reveal FSM: async prep, live reveal/calibration, closed session. */
const sessionPhase = v.union(
  v.literal("preparation"),
  v.literal("live"),
  v.literal("finished"),
);

const userRole = v.union(v.literal("manager"), v.literal("evaluator"));

export default defineSchema({
  sessions: defineTable({
    slug: v.string(),
    /** Display label e.g. team name (optional). */
    title: v.optional(v.string()),
    phase: sessionPhase,
    activeEvaluatorId: v.optional(v.id("users")),
    /** Sequential reveal stub: which competency row is “open” for live calibration. */
    activeRevealSkillId: v.optional(v.string()),
    managerVerdict: v.optional(v.string()),
    /** Live evaluation wizard (separate from activeRevealSkillId matrix highlight). */
    liveEvalSkillId: v.optional(v.string()),
    liveEvalSubjectId: v.optional(v.id("users")),
    liveEvalRevealOrder: v.optional(v.array(v.id("users"))),
    liveEvalRevealCursor: v.optional(v.number()),
  }).index("by_slug", ["slug"]),

  users: defineTable({
    sessionId: v.id("sessions"),
    slug: v.string(),
    name: v.string(),
    role: userRole,
  })
    .index("by_session", ["sessionId"])
    .index("by_session_slug", ["sessionId", "slug"]),

  /**
   * One row per (session, evaluator, subject, skill).
   * Checkpoints use stable IDs from `lib/skill-checkpoints.ts` (`competencyToCheckpoints`).
   */
  evaluations: defineTable({
    sessionId: v.id("sessions"),
    evaluatorId: v.id("users"),
    subjectId: v.id("users"),
    skillId: v.string(),
    checkpoints: v.record(v.string(), v.boolean()),
    manualMark: v.optional(v.number()),
    rationale: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_evaluator_subject_skill", [
      "sessionId",
      "evaluatorId",
      "subjectId",
      "skillId",
    ]),

  /**
   * Manager committed calibration mark for one (subject, skill) after live peer reveal.
   */
  calibrationMarks: defineTable({
    sessionId: v.id("sessions"),
    subjectId: v.id("users"),
    skillId: v.string(),
    mark: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_subject_skill", [
      "sessionId",
      "subjectId",
      "skillId",
    ]),
});
