import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSession = query({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, { slug = "default" }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

/** Idempotent bootstrap for local/dev: one canonical room keyed by `slug`. */
export const ensureSession = mutation({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, { slug = "default" }) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("sessions", {
      slug,
      phase: "preparation",
    });
  },
});

export const setSessionPhase = mutation({
  args: {
    sessionId: v.id("sessions"),
    phase: v.union(
      v.literal("preparation"),
      v.literal("live"),
      v.literal("finished"),
    ),
  },
  handler: async (ctx, { sessionId, phase }) => {
    await ctx.db.patch(sessionId, { phase });
  },
});

/** Manager: choose which evaluator is “active” for live driving (technology.md). */
export const pickNextEvaluator = mutation({
  args: {
    sessionId: v.id("sessions"),
    evaluatorUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, { sessionId, evaluatorUserId }) => {
    await ctx.db.patch(sessionId, {
      activeEvaluatorId: evaluatorUserId,
    });
  },
});

export const submitVerdict = mutation({
  args: {
    sessionId: v.id("sessions"),
    verdict: v.string(),
  },
  handler: async (ctx, { sessionId, verdict }) => {
    await ctx.db.patch(sessionId, {
      managerVerdict: verdict,
      phase: "finished",
    });
  },
});
