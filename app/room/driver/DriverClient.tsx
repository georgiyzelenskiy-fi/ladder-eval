"use client";

import { api } from "@/convex/_generated/api";
import {
  persistManagerAccessKey,
  useStoredManagerAccessKey,
} from "@/lib/devsync-browser";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import { buildRoomHref } from "@/lib/room-url";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type DriverClientProps = {
  /** Validated `?k=` from server when `MANAGER_ACCESS_KEY` is set. */
  managerKeyFromUrl?: string;
  /** From `?session=`; default room is `default`. */
  sessionSlug: string;
};

type SubjectSummary = {
  totalCheckpoints: number;
  checkedCount: number;
  rowCount: number;
};

function useBootstrapSession(
  sessionSlug: string,
  managerKey: string | undefined,
) {
  const ensureSession = useMutation(api.session.ensureSession);
  const session = useQuery(api.session.getSession, {
    slug: sessionSlug,
  });
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession({
          slug: sessionSlug,
          managerKey,
        });
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "ensureSession failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureSession, managerKey, sessionSlug]);

  return { session, bootError };
}

export function DriverClient({
  managerKeyFromUrl,
  sessionSlug,
}: DriverClientProps) {
  const storedManagerKey = useStoredManagerAccessKey();
  const effectiveManagerKey = managerKeyFromUrl ?? storedManagerKey ?? undefined;

  useEffect(() => {
    if (managerKeyFromUrl) persistManagerAccessKey(managerKeyFromUrl);
  }, [managerKeyFromUrl]);

  const { session, bootError } = useBootstrapSession(
    sessionSlug,
    effectiveManagerKey,
  );
  const setPhase = useMutation(api.session.setSessionPhase);
  const pickNext = useMutation(api.session.pickNextEvaluator);
  const setRevealSkill = useMutation(api.session.setActiveRevealSkill);
  const submitVerdict = useMutation(api.session.submitVerdict);

  const sessionId = session?._id;
  const roster = useQuery(
    api.users.listUsers,
    sessionId ? { sessionId } : "skip",
  );
  const live = useQuery(
    api.evaluations.getLiveScores,
    sessionId ? { sessionId } : "skip",
  );

  const [verdictDraft, setVerdictDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  if (bootError) {
    return (
      <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {bootError}
      </p>
    );
  }

  if (session === undefined) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading session…</p>
    );
  }

  if (session === null) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Creating session…
      </p>
    );
  }

  const nameByUserId = new Map<Id<"users">, string>(
    (roster ?? []).map((u: Doc<"users">) => [u._id, u.name || u.slug]),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Manager
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Control room
            {session.title ? (
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}
                · {session.title}
              </span>
            ) : null}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Prepare-then-reveal FSM: drive phase, active evaluator, and closing
            verdict. Session slug{" "}
            <code className="rounded bg-zinc-200/80 px-1 py-0.5 text-xs dark:bg-zinc-800">
              {sessionSlug}
            </code>
            . For sequential peer reveal per skill, use{" "}
            <a
              href={buildRoomHref(
                "/room/live-evaluation",
                sessionSlug,
                effectiveManagerKey,
              )}
              className="font-medium text-zinc-900 underline decoration-zinc-400/70 underline-offset-2 dark:text-zinc-100"
            >
              Live evaluation
            </a>
            .
          </p>
        </div>
        <div className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium capitalize text-zinc-700 dark:border-zinc-600 dark:text-zinc-200">
          Phase: {session.phase}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Session state
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={
              busy !== null ||
              session.phase === "preparation" ||
              session.phase === "finished"
            }
            onClick={() =>
              run("prep", () =>
                setPhase({
                  sessionId: session._id,
                  phase: "preparation",
                  managerKey: effectiveManagerKey,
                }),
              )
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {busy === "prep" ? "…" : "Back to preparation"}
          </button>
          <button
            type="button"
            disabled={
              busy !== null ||
              session.phase === "live" ||
              session.phase === "finished"
            }
            onClick={() =>
              run("live", () =>
                setPhase({
                  sessionId: session._id,
                  phase: "live",
                  managerKey: effectiveManagerKey,
                }),
              )
            }
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {busy === "live" ? "…" : "Start live / reveal"}
          </button>
        </div>
        {session.activeEvaluatorId ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Active evaluator:{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {nameByUserId.get(session.activeEvaluatorId) ??
                session.activeEvaluatorId}
            </span>
            <button
              type="button"
              disabled={busy !== null}
              className="ml-3 text-xs font-medium text-zinc-500 underline decoration-zinc-400/60 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={() =>
                run("clear", () =>
                  pickNext({
                    sessionId: session._id,
                    evaluatorUserId: undefined,
                    managerKey: effectiveManagerKey,
                  }),
                )
              }
            >
              Clear
            </button>
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            No active evaluator (pick one from the roster).
          </p>
        )}
      </section>

      {session.phase === "live" ? (
        <section className="flex flex-col gap-3 rounded-xl border border-violet-300/60 bg-violet-50/40 px-4 py-4 dark:border-violet-500/35 dark:bg-violet-950/25">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Live reveal — competency focus
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Evaluators see the focused skill highlighted (others dimmed). Use
            prev/next to walk the matrix in order, pick a skill directly, or
            clear to show the full matrix at equal weight.
          </p>
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            <span className="font-medium">Current:</span>{" "}
            {session.activeRevealSkillId
              ? (MATRIX_COMPETENCIES.find(
                  (c) => c.id === session.activeRevealSkillId,
                )?.name ?? session.activeRevealSkillId)
              : "None — full matrix visible"}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                const order = MATRIX_COMPETENCIES.map((c) => c.id);
                const cur = session.activeRevealSkillId;
                const idx = cur ? order.indexOf(cur) : -1;
                const nextIdx =
                  idx <= 0 ? order.length - 1 : idx - 1;
                const nextId = order[nextIdx];
                if (nextId) {
                  run("reveal-prev", () =>
                    setRevealSkill({
                      sessionId: session._id,
                      skillId: nextId,
                      managerKey: effectiveManagerKey,
                    }),
                  );
                }
              }}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {busy === "reveal-prev" ? "…" : "Previous skill"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => {
                const order = MATRIX_COMPETENCIES.map((c) => c.id);
                const cur = session.activeRevealSkillId;
                const idx = cur ? order.indexOf(cur) : -1;
                const nextIdx =
                  idx < 0 || idx >= order.length - 1 ? 0 : idx + 1;
                const nextId = order[nextIdx];
                if (nextId) {
                  run("reveal-next", () =>
                    setRevealSkill({
                      sessionId: session._id,
                      skillId: nextId,
                      managerKey: effectiveManagerKey,
                    }),
                  );
                }
              }}
              className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-violet-600"
            >
              {busy === "reveal-next" ? "…" : "Next skill"}
            </button>
            <button
              type="button"
              disabled={busy !== null || !session.activeRevealSkillId}
              onClick={() =>
                run("reveal-clear", () =>
                  setRevealSkill({
                    sessionId: session._id,
                    skillId: null,
                    managerKey: effectiveManagerKey,
                  }),
                )
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {busy === "reveal-clear" ? "…" : "Clear focus"}
            </button>
          </div>
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white/80 p-2 dark:border-zinc-700 dark:bg-zinc-950/50">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Jump to
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MATRIX_COMPETENCIES.map((c) => {
                const active = session.activeRevealSkillId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run("reveal-jump", () =>
                        setRevealSkill({
                          sessionId: session._id,
                          skillId: c.id,
                          managerKey: effectiveManagerKey,
                        }),
                      )
                    }
                    className={`rounded-md px-2 py-1 text-left text-xs font-medium ${
                      active
                        ? "bg-violet-600 text-white dark:bg-violet-500"
                        : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                    } disabled:opacity-40`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Roster
        </h2>
        {roster === undefined ? (
          <p className="text-sm text-zinc-500">Loading roster…</p>
        ) : roster.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No participants yet. Add people in Team setup (
            <code className="text-xs">/manage</code>) and share their links.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {roster.map((u: Doc<"users">) => {
              const active = session.activeEvaluatorId === u._id;
              return (
                <li
                  key={u._id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {u.name || "(unnamed)"}{" "}
                      <span className="text-xs font-normal text-zinc-500">
                        · {u.slug}
                      </span>
                    </p>
                    <p className="text-xs capitalize text-zinc-500">{u.role}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy !== null || session.phase === "finished"}
                    onClick={() =>
                      run("pick", () =>
                        pickNext({
                          sessionId: session._id,
                          evaluatorUserId: u._id,
                          managerKey: effectiveManagerKey,
                        }),
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      active
                        ? "bg-emerald-600 text-white dark:bg-emerald-500"
                        : "border border-zinc-300 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    } disabled:opacity-40`}
                  >
                    {active ? "Active" : "Set active"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Prep progress (checkpoint coverage)
        </h2>
        {live === undefined ? (
          <p className="text-sm text-zinc-500">Loading aggregates…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Checked / total</th>
                  <th className="px-4 py-2">Rows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {(
                  Object.entries(live.summaryBySubjectId) as [
                    string,
                    SubjectSummary,
                  ][]
                ).map(([subjectId, s]) => (
                  <tr key={subjectId}>
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                      {nameByUserId.get(subjectId as Id<"users">) ??
                        `${subjectId.slice(0, 8)}…`}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {s.checkedCount} / {s.totalCheckpoints || "—"}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                      {s.rowCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(live.summaryBySubjectId).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No evaluation rows yet.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Close round
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Saves manager verdict and sets phase to{" "}
          <code className="text-xs">finished</code>.
        </p>
        {session.managerVerdict ? (
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            Recorded verdict: {session.managerVerdict}
          </p>
        ) : null}
        <textarea
          value={verdictDraft}
          onChange={(e) => setVerdictDraft(e.target.value)}
          placeholder="Short calibration summary or decision…"
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          disabled={
            busy !== null || !verdictDraft.trim() || session.phase === "finished"
          }
          onClick={() =>
            run("verdict", () =>
              submitVerdict({
                sessionId: session._id,
                verdict: verdictDraft.trim(),
                managerKey: effectiveManagerKey,
              }),
            )
          }
          className="w-fit rounded-lg border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-40 dark:border-zinc-500 dark:text-zinc-100"
        >
          {busy === "verdict" ? "Saving…" : "Submit verdict & finish"}
        </button>
      </section>
    </div>
  );
}
