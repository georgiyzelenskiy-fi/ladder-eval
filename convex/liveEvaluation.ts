import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertManagerKey } from "../lib/convex-manager-auth";

/** Manager live-eval UI: roster, all evaluations, calibration marks, session wizard fields. */
export const getLiveEvalBundle = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;

    const [roster, evaluations, marks] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("evaluations")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
      ctx.db
        .query("calibrationMarks")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .collect(),
    ]);

    return {
      session: {
        _id: session._id,
        phase: session.phase,
        liveEvalSkillId: session.liveEvalSkillId,
        liveEvalSubjectId: session.liveEvalSubjectId,
        liveEvalRevealOrder: session.liveEvalRevealOrder,
        liveEvalRevealCursor: session.liveEvalRevealCursor,
      },
      roster,
      evaluations,
      calibrationMarks: marks,
    };
  },
});

export const upsertCalibrationMark = mutation({
  args: {
    sessionId: v.id("sessions"),
    subjectId: v.id("users"),
    skillId: v.string(),
    mark: v.number(),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, subjectId, skillId, mark, managerKey }) => {
    assertManagerKey(managerKey);
    const now = Date.now();
    const existing = await ctx.db
      .query("calibrationMarks")
      .withIndex("by_session_subject_skill", (q) =>
        q
          .eq("sessionId", sessionId)
          .eq("subjectId", subjectId)
          .eq("skillId", skillId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { mark, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("calibrationMarks", {
      sessionId,
      subjectId,
      skillId,
      mark,
      updatedAt: now,
    });
  },
});
