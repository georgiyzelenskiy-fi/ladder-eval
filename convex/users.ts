import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
  },
  handler: async (ctx, { sessionId, title, entries }) => {
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
