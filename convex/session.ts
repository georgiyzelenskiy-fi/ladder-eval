import {
  advanceLiveEvalRevealCursor,
  computePeerRevealOrder,
  filterRandomizeSubjectCandidates,
} from "../lib/live-eval-session";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
function assertManagerKey(provided: string | undefined): void {
  const required = process.env.MANAGER_ACCESS_KEY;
  if (required == null || required === "") return;
  if (provided !== required) {
    throw new Error("Manager access required");
  }
}

function shuffleIds(ids: Id<"users">[]): Id<"users">[] {
  const copy = [...ids];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function defaultLiveEvalRevealOrder(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<Id<"users">[]> {
  const roster = await ctx.db
    .query("users")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();
  const order = computePeerRevealOrder(
    roster.map((u) => ({
      userId: u._id,
      role: u.role,
      slug: u.slug,
    })),
  );
  return order as Id<"users">[];
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
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, skillId, managerKey }) => {
    assertManagerKey(managerKey);
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
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, subjectId, managerKey }) => {
    assertManagerKey(managerKey);
    const order = await defaultLiveEvalRevealOrder(ctx, sessionId);
    await ctx.db.patch(sessionId, {
      liveEvalSubjectId: subjectId,
      liveEvalRevealOrder: order,
      liveEvalRevealCursor: 0,
    });
  },
});

export const shuffleLiveEvalOrder = mutation({
  args: {
    sessionId: v.id("sessions"),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, managerKey }) => {
    assertManagerKey(managerKey);
    const session = await ctx.db.get(sessionId);
    if (!session?.liveEvalRevealOrder?.length) return;
    await ctx.db.patch(sessionId, {
      liveEvalRevealOrder: shuffleIds([...session.liveEvalRevealOrder]),
      liveEvalRevealCursor: 0,
    });
  },
});

export const randomizeLiveEvalSubject = mutation({
  args: {
    sessionId: v.id("sessions"),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, managerKey }) => {
    assertManagerKey(managerKey);
    const session = await ctx.db.get(sessionId);
    const skillId = session?.liveEvalSkillId;
    if (!skillId) return;

    const roster = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const evaluators = roster.filter((u) => u.role === "evaluator");
    if (evaluators.length === 0) return;

    const marks = await ctx.db
      .query("calibrationMarks")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    const calibratedSubjectIds = new Set(
      marks.filter((m) => m.skillId === skillId).map((m) => m.subjectId),
    );
    const currentSubjectId = session.liveEvalSubjectId;
    const candidateIds = filterRandomizeSubjectCandidates(
      evaluators.map((u) => u._id),
      calibratedSubjectIds,
      currentSubjectId,
    );
    if (candidateIds.length === 0) return;

    const pickId =
      candidateIds[Math.floor(Math.random() * candidateIds.length)]!;
    const pick = evaluators.find((u) => u._id === pickId);
    if (!pick) return;
    const order = await defaultLiveEvalRevealOrder(ctx, sessionId);
    await ctx.db.patch(sessionId, {
      liveEvalSubjectId: pick._id,
      liveEvalRevealOrder: order,
      liveEvalRevealCursor: 0,
    });
  },
});

export const liveEvalRevealNext = mutation({
  args: {
    sessionId: v.id("sessions"),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, managerKey }) => {
    assertManagerKey(managerKey);
    const session = await ctx.db.get(sessionId);
    if (!session) return;
    const order = session.liveEvalRevealOrder;
    if (!order?.length) return;
    const cur = session.liveEvalRevealCursor ?? 0;
    const next = advanceLiveEvalRevealCursor(cur, order.length);
    if (next === undefined) return;
    await ctx.db.patch(sessionId, {
      liveEvalRevealCursor: next,
    });
  },
});

export const resetLiveEvalReveal = mutation({
  args: {
    sessionId: v.id("sessions"),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, managerKey }) => {
    assertManagerKey(managerKey);
    await ctx.db.patch(sessionId, {
      liveEvalRevealCursor: 0,
    });
  },
});
