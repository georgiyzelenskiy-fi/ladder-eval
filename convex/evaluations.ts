import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listEvaluationsForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("evaluations")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

/** Prep-safe: only this evaluator’s rows (no peer checkpoint leakage). */
export const listEvaluationsForEvaluator = query({
  args: {
    sessionId: v.id("sessions"),
    evaluatorId: v.id("users"),
  },
  handler: async (ctx, { sessionId, evaluatorId }) => {
    const rows = await ctx.db
      .query("evaluations")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    return rows.filter((r) => r.evaluatorId === evaluatorId);
  },
});

/**
 * Aggregated prep/reveal signal: raw rows plus simple per-subject checkpoint coverage.
 * UI can refine into “progress bars” and manager views.
 */
export const getLiveScores = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const rows = await ctx.db
      .query("evaluations")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();

    const bySubject = new Map<
      string,
      { totalCheckpoints: number; checkedCount: number; rowCount: number }
    >();
    for (const row of rows) {
      const key = row.subjectId;
      const prev = bySubject.get(key) ?? {
        totalCheckpoints: 0,
        checkedCount: 0,
        rowCount: 0,
      };
      const cps = row.checkpoints;
      const n = Object.keys(cps).length;
      const checked = Object.values(cps).filter(Boolean).length;
      bySubject.set(key, {
        totalCheckpoints: prev.totalCheckpoints + n,
        checkedCount: prev.checkedCount + checked,
        rowCount: prev.rowCount + 1,
      });
    }

    return {
      evaluations: rows,
      summaryBySubjectId: Object.fromEntries(bySubject),
    };
  },
});

export const updateCheckboxes = mutation({
  args: {
    sessionId: v.id("sessions"),
    evaluatorId: v.id("users"),
    subjectId: v.id("users"),
    skillId: v.string(),
    checkpoints: v.optional(v.record(v.string(), v.boolean())),
    manualMark: v.optional(v.number()),
    rationale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_evaluator_subject_skill", (q) =>
        q
          .eq("sessionId", args.sessionId)
          .eq("evaluatorId", args.evaluatorId)
          .eq("subjectId", args.subjectId)
          .eq("skillId", args.skillId),
      )
      .unique();

    const nextCheckpoints =
      args.checkpoints !== undefined
        ? existing
          ? { ...existing.checkpoints, ...args.checkpoints }
          : { ...args.checkpoints }
        : (existing?.checkpoints ?? {});

    const patch = {
      checkpoints: nextCheckpoints,
      updatedAt: now,
      ...(args.manualMark !== undefined ? { manualMark: args.manualMark } : {}),
      ...(args.rationale !== undefined ? { rationale: args.rationale } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return await ctx.db.insert("evaluations", {
      sessionId: args.sessionId,
      evaluatorId: args.evaluatorId,
      subjectId: args.subjectId,
      skillId: args.skillId,
      checkpoints: nextCheckpoints,
      manualMark: args.manualMark,
      rationale: args.rationale,
      updatedAt: now,
    });
  },
});
