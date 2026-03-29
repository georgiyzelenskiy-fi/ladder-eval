import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { assertManagerKey } from "../lib/convex-manager-auth";

const userRole = v.union(v.literal("manager"), v.literal("evaluator"));

const rosterSeedEntry = v.object({
  slug: v.string(),
  name: v.string(),
  role: userRole,
});

export const getUserBySessionSlug = query({
  args: { sessionId: v.id("sessions"), slug: v.string() },
  handler: async (ctx, { sessionId, slug }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_session_slug", (q) =>
        q.eq("sessionId", sessionId).eq("slug", slug),
      )
      .unique();
  },
});

export const listUsers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

/** First visit: bind display name (and role) to a stable slug within a session. */
export const joinSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    slug: v.string(),
    name: v.string(),
    role: v.union(v.literal("manager"), v.literal("evaluator")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session_slug", (q) =>
        q.eq("sessionId", args.sessionId).eq("slug", args.slug),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        role: args.role,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      sessionId: args.sessionId,
      slug: args.slug,
      name: args.name,
      role: args.role,
    });
  },
});

/**
 * Idempotent: upsert each (session, slug); optional session title for the control room.
 * Use from the manager UI with a preset from `lib/roster-presets/*`.
 */
export const seedRoster = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.optional(v.string()),
    entries: v.array(rosterSeedEntry),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, title, entries, managerKey }) => {
    assertManagerKey(managerKey);
    if (title !== undefined) {
      await ctx.db.patch(sessionId, { title });
    }
    const userIds: string[] = [];
    for (const e of entries) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_session_slug", (q) =>
          q.eq("sessionId", sessionId).eq("slug", e.slug),
        )
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { name: e.name, role: e.role });
        userIds.push(existing._id);
      } else {
        const id = await ctx.db.insert("users", {
          sessionId,
          slug: e.slug,
          name: e.name,
          role: e.role,
        });
        userIds.push(id);
      }
    }
    return { userIds };
  },
});

/** Add or update one roster row (manager). */
export const upsertRosterUser = mutation({
  args: {
    sessionId: v.id("sessions"),
    slug: v.string(),
    name: v.string(),
    role: userRole,
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, slug, name, role, managerKey }) => {
    assertManagerKey(managerKey);
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();
    if (!trimmedSlug) {
      throw new Error("User slug is required");
    }
    if (!trimmedName) {
      throw new Error("Name is required");
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session_slug", (q) =>
        q.eq("sessionId", sessionId).eq("slug", trimmedSlug),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { name: trimmedName, role });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      sessionId,
      slug: trimmedSlug,
      name: trimmedName,
      role,
    });
  },
});

/**
 * Remove a user and dependent rows in this session (evaluations touching them,
 * calibration marks as subject). Clears session pointers that reference this user.
 */
export const removeRosterUser = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, userId, managerKey }) => {
    assertManagerKey(managerKey);
    const user = await ctx.db.get(userId);
    if (!user || user.sessionId !== sessionId) {
      throw new Error("User not in session");
    }

    const evalRows = await ctx.db
      .query("evaluations")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const row of evalRows) {
      if (row.evaluatorId === userId || row.subjectId === userId) {
        await ctx.db.delete(row._id);
      }
    }

    const marks = await ctx.db
      .query("calibrationMarks")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const m of marks) {
      if (m.subjectId === userId) {
        await ctx.db.delete(m._id);
      }
    }

    const session = await ctx.db.get(sessionId);
    if (session) {
      const patch: {
        activeEvaluatorId?: undefined;
        liveEvalSubjectId?: undefined;
        liveEvalRevealOrder?: Id<"users">[] | undefined;
        liveEvalRevealCursor?: number;
      } = {};
      if (session.activeEvaluatorId === userId) {
        patch.activeEvaluatorId = undefined;
      }
      if (session.liveEvalSubjectId === userId) {
        patch.liveEvalSubjectId = undefined;
        patch.liveEvalRevealOrder = undefined;
        patch.liveEvalRevealCursor = undefined;
      } else if (session.liveEvalRevealOrder?.includes(userId)) {
        const filtered = session.liveEvalRevealOrder.filter((id) => id !== userId);
        patch.liveEvalRevealOrder = filtered.length > 0 ? filtered : undefined;
        patch.liveEvalRevealCursor = 0;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(sessionId, patch);
      }
    }

    await ctx.db.delete(userId);
    return { ok: true as const };
  },
});
