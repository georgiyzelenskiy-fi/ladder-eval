import {
  advanceLiveEvalRevealCursor,
  computePeerRevealOrder,
  filterRandomizeSubjectCandidates,
} from "../lib/live-eval-session";
import { normalizeSessionSlug } from "../lib/session-slug";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { assertManagerKey } from "../lib/convex-manager-auth";

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
    let normalized: string;
    try {
      normalized = normalizeSessionSlug(slug);
    } catch {
      return null;
    }
    return await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
  },
});

/**
 * Idempotent bootstrap: get or create a session by slug.
 * When `MANAGER_ACCESS_KEY` is set, non-`default` slugs require `managerKey` so evaluators
 * can still auto-create the canonical `default` room without the secret.
 */
export const ensureSession = mutation({
  args: {
    slug: v.optional(v.string()),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { slug = "default", managerKey }) => {
    const normalized = normalizeSessionSlug(slug);
    const gate = process.env.MANAGER_ACCESS_KEY;
    if (gate != null && gate !== "" && normalized !== "default") {
      assertManagerKey(managerKey);
    }
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("sessions", {
      slug: normalized,
      phase: "preparation",
    });
  },
});

/** Create a new session; fails if slug already exists. Requires manager key when env is set. */
export const createSession = mutation({
  args: {
    slug: v.string(),
    title: v.optional(v.string()),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { slug, title, managerKey }) => {
    assertManagerKey(managerKey);
    const normalized = normalizeSessionSlug(slug);
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", normalized))
      .unique();
    if (existing) {
      throw new Error(`Session slug already exists: ${normalized}`);
    }
    return await ctx.db.insert("sessions", {
      slug: normalized,
      title: title?.trim() || undefined,
      phase: "preparation",
    });
  },
});

export const updateSessionTitle = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, title, managerKey }) => {
    assertManagerKey(managerKey);
    const trimmed = title.trim();
    await ctx.db.patch(sessionId, {
      title: trimmed.length > 0 ? trimmed : undefined,
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
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, phase, managerKey }) => {
    assertManagerKey(managerKey);
    await ctx.db.patch(sessionId, { phase });
  },
});

/** Manager: choose which evaluator is “active” for live driving (technology.md). */
export const pickNextEvaluator = mutation({
  args: {
    sessionId: v.id("sessions"),
    evaluatorUserId: v.optional(v.id("users")),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, evaluatorUserId, managerKey }) => {
    assertManagerKey(managerKey);
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
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, skillId, managerKey }) => {
    assertManagerKey(managerKey);
    await ctx.db.patch(sessionId, {
      activeRevealSkillId: skillId === null ? undefined : skillId,
    });
  },
});

export const submitVerdict = mutation({
  args: {
    sessionId: v.id("sessions"),
    verdict: v.string(),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, verdict, managerKey }) => {
    assertManagerKey(managerKey);
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
