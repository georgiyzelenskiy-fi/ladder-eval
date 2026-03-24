import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function shuffleIds(ids: Id<"users">[]): Id<"users">[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function defaultPeerRevealOrder(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  subjectId: Id<"users">,
): Promise<Id<"users">[]> {
  const roster = await ctx.db
    .query("users")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  return roster
    .filter((u) => u.role === "evaluator" && u._id !== subjectId)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((u) => u._id);
}

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

/** Manager: which competency row is “in focus” during live reveal (sequential calibration). */
export const setActiveRevealSkill = mutation({
  args: {
    sessionId: v.id("sessions"),
    /** Pass `null` to clear focus. */
    skillId: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { sessionId, skillId }) => {
    await ctx.db.patch(sessionId, {
      activeRevealSkillId: skillId === null ? undefined : skillId,
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

// --- Live evaluation wizard (separate from activeRevealSkillId) ---

export const setLiveEvalSkill = mutation({
  args: {
    sessionId: v.id("sessions"),
    skillId: v.string(),
  },
  handler: async (ctx, { sessionId, skillId }) => {
    await ctx.db.patch(sessionId, {
      liveEvalSkillId: skillId,
      liveEvalRevealCursor: 0,
    });
  },
});

export const setLiveEvalSubject = mutation({
  args: {
    sessionId: v.id("sessions"),
    subjectId: v.id("users"),
  },
  handler: async (ctx, { sessionId, subjectId }) => {
    const order = await defaultPeerRevealOrder(ctx, sessionId, subjectId);
    await ctx.db.patch(sessionId, {
      liveEvalSubjectId: subjectId,
      liveEvalRevealOrder: order,
      liveEvalRevealCursor: 0,
    });
  },
});

export const shuffleLiveEvalOrder = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.liveEvalRevealOrder?.length) return;
    await ctx.db.patch(sessionId, {
      liveEvalRevealOrder: shuffleIds([...session.liveEvalRevealOrder]),
      liveEvalRevealCursor: 0,
    });
  },
});

export const randomizeLiveEvalSubject = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const roster = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const candidates = roster.filter((u) => u.role === "evaluator");
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const order = await defaultPeerRevealOrder(ctx, sessionId, pick._id);
    await ctx.db.patch(sessionId, {
      liveEvalSubjectId: pick._id,
      liveEvalRevealOrder: order,
      liveEvalRevealCursor: 0,
    });
  },
});

export const liveEvalRevealNext = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session?.liveEvalRevealOrder?.length) return;
    const cur = session.liveEvalRevealCursor ?? 0;
    const max = session.liveEvalRevealOrder.length;
    if (cur >= max) return;
    await ctx.db.patch(sessionId, {
      liveEvalRevealCursor: cur + 1,
    });
  },
});

export const resetLiveEvalReveal = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, {
      liveEvalRevealCursor: 0,
    });
  },
});
