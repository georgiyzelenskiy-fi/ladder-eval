import {
  isManagerAccessKeyConfigured,
  isManagerKeyValid,
} from "../lib/convex-manager-auth";
import { normalizeSessionSlug } from "../lib/session-slug";
import { query } from "./_generated/server";
import { v } from "convex/values";

type AccessDeniedCode =
  | "SESSION_NOT_FOUND"
  | "SUBJECT_NOT_FOUND"
  | "NOT_AUTHENTICATED"
  | "NOT_ON_ROSTER"
  | "PREPARATION_BLOCKED";

function resolveInsightsAccess(input: {
  phase: "preparation" | "live" | "finished";
  managerKey: string | undefined;
  viewerUserId: string | undefined;
  roster: { _id: string; role: "manager" | "evaluator" }[];
}): { ok: true } | { ok: false; code: AccessDeniedCode } {
  const keyConfigured = isManagerAccessKeyConfigured();

  if (isManagerKeyValid(input.managerKey)) {
    return { ok: true };
  }

  if (!input.viewerUserId) {
    if (input.phase === "preparation" || keyConfigured) {
      return { ok: false, code: "NOT_AUTHENTICATED" };
    }
    return { ok: true };
  }

  const viewer = input.roster.find((u) => u._id === input.viewerUserId);
  if (!viewer) {
    return { ok: false, code: "NOT_ON_ROSTER" };
  }

  if (viewer.role === "manager") {
    return { ok: true };
  }

  if (input.phase === "preparation") {
    return { ok: false, code: "PREPARATION_BLOCKED" };
  }

  return { ok: true };
}

/** Per-subject evaluation slice for charts (manager key or roster + phase rules). */
export const getSubjectInsightsBundle = query({
  args: {
    sessionSlug: v.string(),
    subjectSlug: v.string(),
    viewerUserId: v.optional(v.id("users")),
    managerKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let normalizedSession: string;
    try {
      normalizedSession = normalizeSessionSlug(args.sessionSlug);
    } catch {
      return { kind: "error" as const, code: "SESSION_NOT_FOUND" as const };
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_slug", (q) => q.eq("slug", normalizedSession))
      .unique();

    if (!session) {
      return { kind: "error" as const, code: "SESSION_NOT_FOUND" as const };
    }

    const subject = await ctx.db
      .query("users")
      .withIndex("by_session_slug", (q) =>
        q.eq("sessionId", session._id).eq("slug", args.subjectSlug),
      )
      .unique();

    if (!subject) {
      return { kind: "error" as const, code: "SUBJECT_NOT_FOUND" as const };
    }

    const roster = await ctx.db
      .query("users")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const access = resolveInsightsAccess({
      phase: session.phase,
      managerKey: args.managerKey,
      viewerUserId: args.viewerUserId,
      roster,
    });

    if (!access.ok) {
      return { kind: "error" as const, code: access.code };
    }

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const forSubject = evaluations.filter((e) => e.subjectId === subject._id);

    const calibrationMarks = await ctx.db
      .query("calibrationMarks")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const marksForSubject = calibrationMarks.filter(
      (m) => m.subjectId === subject._id,
    );

    return {
      kind: "ok" as const,
      session: {
        _id: session._id,
        slug: session.slug,
        phase: session.phase,
        title: session.title,
      },
      subject,
      roster,
      evaluations: forSubject,
      calibrationMarks: marksForSubject,
    };
  },
});
