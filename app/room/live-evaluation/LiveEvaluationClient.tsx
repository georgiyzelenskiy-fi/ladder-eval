"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { DEFAULT_SESSION_SLUG } from "@/lib/devsync-constants";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import {
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
} from "@/lib/skill-checkpoints";
import { computeFoundationFirstUiEstimate } from "@/lib/scoring";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function evalUiEstimate(
  skillId: string,
  checkpoints: Record<string, boolean>,
): number {
  const comp = MATRIX_COMPETENCIES.find((c) => c.id === skillId);
  if (!comp) return 0;
  const cps = competencyToCheckpoints(comp);
  const checked = new Set(
    Object.entries(checkpoints)
      .filter(([, v]) => v)
      .map(([k]) => k),
  );
  return computeFoundationFirstUiEstimate(cps, checked).uiEstimate;
}

function peerSummaryLine(
  evaluations: Doc<"evaluations">[],
  subjectId: Id<"users">,
  skillId: string,
): string {
  const peers = evaluations.filter(
    (r) =>
      r.subjectId === subjectId &&
      r.skillId === skillId &&
      r.evaluatorId !== subjectId,
  );
  if (peers.length === 0) return "No peer rows";
  const uiAvg =
    peers.reduce((s, r) => s + evalUiEstimate(skillId, r.checkpoints), 0) /
    peers.length;
  const withManual = peers.filter((r) => r.manualMark != null);
  const manAvg =
    withManual.length > 0
      ? withManual.reduce((s, r) => s + (r.manualMark as number), 0) /
        withManual.length
      : null;
  return manAvg != null
    ? `${peers.length} peers · manual μ ${manAvg.toFixed(1)} · UI μ ${uiAvg.toFixed(2)}`
    : `${peers.length} peers · UI μ ${uiAvg.toFixed(2)}`;
}

type DetailCell = { subjectId: Id<"users">; skillId: string };

export function LiveEvaluationClient() {
  const ensureSession = useMutation(api.session.ensureSession);
  const session = useQuery(api.session.getSession, { slug: DEFAULT_SESSION_SLUG });
  const sessionId = session?._id;

  const bundle = useQuery(
    api.liveEvaluation.getLiveEvalBundle,
    sessionId ? { sessionId } : "skip",
  );

  const setLiveEvalSkill = useMutation(api.session.setLiveEvalSkill);
  const setLiveEvalSubject = useMutation(api.session.setLiveEvalSubject);
  const shuffleLiveEvalOrder = useMutation(api.session.shuffleLiveEvalOrder);
  const randomizeLiveEvalSubject = useMutation(
    api.session.randomizeLiveEvalSubject,
  );
  const liveEvalRevealNext = useMutation(api.session.liveEvalRevealNext);
  const resetLiveEvalReveal = useMutation(api.session.resetLiveEvalReveal);
  const upsertCalibrationMark = useMutation(
    api.liveEvaluation.upsertCalibrationMark,
  );

  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [calibDraft, setCalibDraft] = useState("");
  const [detailCell, setDetailCell] = useState<DetailCell | null>(null);

  const seededSkill = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession({ slug: DEFAULT_SESSION_SLUG });
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : "ensureSession failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureSession]);

  const run = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }, []);

  const firstSkillId = MATRIX_COMPETENCIES[0]?.id;
  useEffect(() => {
    if (!sessionId || !firstSkillId || seededSkill.current) return;
    if (session === undefined || session === null) return;
    if (session.liveEvalSkillId) {
      seededSkill.current = true;
      return;
    }
    seededSkill.current = true;
    void setLiveEvalSkill({ sessionId, skillId: firstSkillId });
  }, [sessionId, session, firstSkillId, setLiveEvalSkill]);

  const nameByUserId = useMemo(() => {
    const m = new Map<Id<"users">, string>();
    for (const u of bundle?.roster ?? []) {
      m.set(u._id, u.name || u.slug);
    }
    return m;
  }, [bundle?.roster]);

  const evaluatees = useMemo(
    () => (bundle?.roster ?? []).filter((u) => u.role === "evaluator"),
    [bundle?.roster],
  );

  const markBySubjectSkill = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of bundle?.calibrationMarks ?? []) {
      m.set(`${row.subjectId}:${row.skillId}`, row.mark);
    }
    return m;
  }, [bundle?.calibrationMarks]);

  const liveSkillId =
    bundle?.session.liveEvalSkillId ?? firstSkillId ?? "";
  const liveSubjectId = bundle?.session.liveEvalSubjectId;
  const revealOrder = bundle?.session.liveEvalRevealOrder ?? [];
  const revealCursor = bundle?.session.liveEvalRevealCursor ?? 0;

  const allPeersRevealed =
    revealOrder.length > 0 && revealCursor >= revealOrder.length;

  const currentMark =
    liveSubjectId && liveSkillId
      ? markBySubjectSkill.get(`${liveSubjectId}:${liveSkillId}`)
      : undefined;

  useEffect(() => {
    if (currentMark !== undefined) {
      setCalibDraft(String(currentMark));
    } else {
      setCalibDraft("");
    }
  }, [currentMark, liveSubjectId, liveSkillId]);

  const findEvalRow = useCallback(
    (
      evaluatorId: Id<"users">,
      subjectId: Id<"users">,
      skillId: string,
    ): Doc<"evaluations"> | undefined =>
      bundle?.evaluations.find(
        (r) =>
          r.evaluatorId === evaluatorId &&
          r.subjectId === subjectId &&
          r.skillId === skillId,
      ),
    [bundle?.evaluations],
  );

  if (bootError) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-error">
        {bootError}
      </p>
    );
  }

  if (session === undefined || session === null) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-on-surface-variant">
        Loading session…
      </p>
    );
  }

  if (bundle === undefined) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-on-surface-variant">
        Loading live evaluation…
      </p>
    );
  }

  if (bundle === null) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-error">
        Session missing.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant/20 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            Manager
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-on-surface">
            Live evaluation
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            Sequential peer reveal per skill and subject, then commit a
            calibration mark. Does not replace control room{" "}
            <span className="text-on-surface">Live reveal — competency focus</span>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/room/driver"
            className="rounded-lg border border-outline-variant/40 px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high"
          >
            Control room
          </Link>
          <Link
            href="/"
            className="text-sm text-on-surface-variant underline decoration-outline-variant/60 underline-offset-2 hover:text-on-surface"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Skill tabs */}
      <nav className="sticky top-0 z-30 border-b border-outline-variant/15 bg-surface-container-high/95 px-1 py-2 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MATRIX_COMPETENCIES.map((c) => {
            const active = liveSkillId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run("skill", () =>
                    setLiveEvalSkill({ sessionId: session._id, skillId: c.id }),
                  )
                }
                className={`shrink-0 rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                } disabled:opacity-40`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Subject header */}
      <section className="rounded-xl border border-primary/25 bg-surface-container-high p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Current subject
            </p>
            {liveSubjectId ? (
              <h2 className="mt-1 text-xl font-bold text-on-surface">
                {nameByUserId.get(liveSubjectId) ?? liveSubjectId}
              </h2>
            ) : (
              <p className="mt-1 text-sm text-on-surface-variant">
                Choose an evaluatee or randomize.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span className="sr-only">Subject</span>
              <select
                className="max-w-[220px] rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm text-on-surface"
                value={liveSubjectId ?? ""}
                disabled={busy !== null || evaluatees.length === 0}
                onChange={(e) => {
                  const v = e.target.value as Id<"users">;
                  if (!v) return;
                  run("subject", () =>
                    setLiveEvalSubject({ sessionId: session._id, subjectId: v }),
                  );
                }}
              >
                <option value="">Select…</option>
                {evaluatees.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.slug}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy !== null || evaluatees.length === 0}
              onClick={() =>
                run("rand-subj", () =>
                  randomizeLiveEvalSubject({ sessionId: session._id }),
                )
              }
              className="flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-sm">shuffle</span>
              Randomize subject
            </button>
          </div>
        </div>
      </section>

      {!liveSubjectId ? (
        <p className="text-sm text-on-surface-variant">
          Seed a roster in the control room, then pick a subject to start the
          reveal queue.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Reveal queue */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Live scoring panel
                </p>
                <h3 className="text-lg font-bold text-on-surface">
                  Peer reveal queue
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    busy !== null ||
                    revealOrder.length === 0 ||
                    allPeersRevealed
                  }
                  onClick={() =>
                    run("reveal", () =>
                      liveEvalRevealNext({ sessionId: session._id }),
                    )
                  }
                  className="flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-on-primary hover:brightness-110 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    visibility
                  </span>
                  Reveal next ({revealCursor}/{revealOrder.length})
                </button>
                <button
                  type="button"
                  disabled={busy !== null || revealCursor === 0}
                  onClick={() =>
                    run("reset-reveal", () =>
                      resetLiveEvalReveal({ sessionId: session._id }),
                    )
                  }
                  className="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                >
                  Reset reveal
                </button>
                <button
                  type="button"
                  disabled={busy !== null || revealOrder.length < 2}
                  onClick={() =>
                    run("shuffle", () =>
                      shuffleLiveEvalOrder({ sessionId: session._id }),
                    )
                  }
                  className="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                >
                  Shuffle order
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {revealOrder.map((peerId, i) => {
                const revealed = i < revealCursor;
                const row = findEvalRow(peerId, liveSubjectId, liveSkillId);
                const uiEst = row
                  ? evalUiEstimate(liveSkillId, row.checkpoints)
                  : null;

                if (!revealed) {
                  return (
                    <div
                      key={peerId}
                      className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-low p-5"
                    >
                      <span className="material-symbols-outlined mb-2 text-2xl text-outline-variant/50">
                        lock
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-outline-variant">
                        Locked
                      </span>
                      <span className="mt-1 text-xs text-on-surface-variant">
                        {nameByUserId.get(peerId) ?? peerId}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={peerId}
                    className="flex flex-col rounded-xl border border-primary/30 bg-surface-container-high p-5"
                  >
                    <div className="mb-3">
                      <p className="text-[10px] font-bold uppercase text-on-surface">
                        {nameByUserId.get(peerId) ?? peerId}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-primary">
                        Revealed
                      </p>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-outline-variant/15 bg-surface-container p-2 text-center">
                        <span className="mb-1 block text-[8px] font-bold uppercase text-on-surface-variant">
                          Manual mark
                        </span>
                        <span className="text-xl font-bold text-on-surface">
                          {row?.manualMark ?? "—"}
                        </span>
                      </div>
                      <div className="rounded-lg border border-outline-variant/15 bg-surface-container p-2 text-center">
                        <span className="mb-1 block text-[8px] font-bold uppercase text-on-surface-variant">
                          UI estimate
                        </span>
                        <span className="text-xl font-bold text-emerald-400">
                          {uiEst !== null ? uiEst.toFixed(1) : "—"}
                        </span>
                      </div>
                    </div>
                    {row?.rationale ? (
                      <p className="line-clamp-3 text-xs italic text-on-surface-variant">
                        {row.rationale}
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant/70">
                        No rationale
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {revealOrder.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No peers to reveal (need at least two evaluators, or this
                subject has no other evaluators).
              </p>
            ) : null}
          </div>

          {/* Calibration */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border-2 border-primary/35 bg-surface-container-highest p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  gavel
                </span>
                <h3 className="text-sm font-bold uppercase tracking-tight text-on-surface">
                  Final calibration
                </h3>
              </div>
              <p className="mb-6 text-xs leading-relaxed text-on-surface-variant">
                Commit a mark for{" "}
                <span className="font-semibold text-on-surface">
                  {liveSubjectId
                    ? nameByUserId.get(liveSubjectId)
                    : "subject"}
                </span>{" "}
                ·{" "}
                <span className="text-primary">
                  {MATRIX_COMPETENCIES.find((c) => c.id === liveSkillId)
                    ?.name ?? liveSkillId}
                </span>
                {allPeersRevealed ? null : (
                  <span className="block pt-2 text-warning">
                    Reveal all peers before committing.
                  </span>
                )}
              </p>
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Calibration mark (1–5)
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={calibDraft}
                  onChange={(e) => setCalibDraft(e.target.value)}
                  placeholder="e.g. 4.2"
                  className="w-full border-0 border-b-2 border-outline-variant bg-transparent py-2 text-3xl font-bold text-on-surface focus:border-primary focus:outline-none"
                />
              </label>
              <button
                type="button"
                disabled={
                  busy !== null ||
                  !allPeersRevealed ||
                  !calibDraft.trim() ||
                  Number.isNaN(Number(calibDraft))
                }
                onClick={() => {
                  const n = Number(calibDraft);
                  if (Number.isNaN(n)) return;
                  run("commit", () =>
                    upsertCalibrationMark({
                      sessionId: session._id,
                      subjectId: liveSubjectId,
                      skillId: liveSkillId,
                      mark: n,
                    }),
                  );
                }}
                className="mt-6 w-full rounded-lg bg-primary py-3 text-xs font-bold uppercase tracking-widest text-on-primary hover:brightness-110 disabled:opacity-40"
              >
                Commit calibration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matrix */}
      <section className="border-t border-outline-variant/20 pt-8">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-on-surface">
          Calibration matrix
        </h3>
        <p className="mb-4 text-xs text-on-surface-variant">
          Committed marks per subject and skill. Click a cell for peer detail
          (checklist, estimates, rationale).
        </p>
        <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-high">
                <th className="sticky left-0 z-10 bg-surface-container-high px-3 py-2 text-xs font-semibold text-on-surface-variant">
                  Subject
                </th>
                {MATRIX_COMPETENCIES.map((c) => (
                  <th
                    key={c.id}
                    className="max-w-[100px] px-2 py-2 text-xs font-semibold text-on-surface-variant"
                  >
                    <span className="line-clamp-3">{c.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {evaluatees.map((subj) => (
                <tr key={subj._id} className="bg-surface-container-low/50">
                  <td className="sticky left-0 z-10 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface">
                    {subj.name || subj.slug}
                  </td>
                  {MATRIX_COMPETENCIES.map((c) => {
                    const mark = markBySubjectSkill.get(`${subj._id}:${c.id}`);
                    const hoverLine = peerSummaryLine(
                      bundle.evaluations,
                      subj._id,
                      c.id,
                    );
                    return (
                      <td key={c.id} className="px-1 py-1 text-center">
                        <div className="group relative">
                          <button
                            type="button"
                            onClick={() =>
                              setDetailCell({
                                subjectId: subj._id,
                                skillId: c.id,
                              })
                            }
                            className="min-h-10 w-full rounded-md border border-transparent px-2 py-2 text-sm font-bold text-on-surface hover:border-primary/40 hover:bg-surface-container-high"
                          >
                            {mark !== undefined ? mark : "—"}
                          </button>
                          <div
                            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-48 -translate-x-1/2 rounded-md border border-outline-variant/30 bg-surface-container-highest px-2 py-1.5 text-left text-[10px] leading-snug text-on-surface-variant shadow-lg transition-opacity md:block md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
                            role="tooltip"
                          >
                            {hoverLine}
                            <span className="mt-0.5 block text-on-surface-variant/70">
                              Click for full detail
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {evaluatees.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
              No evaluator-role subjects in roster.
            </p>
          ) : null}
        </div>
      </section>

      {detailCell ? (
        <MatrixDetailModal
          cell={detailCell}
          nameByUserId={nameByUserId}
          evaluations={bundle.evaluations}
          committedMark={markBySubjectSkill.get(
            `${detailCell.subjectId}:${detailCell.skillId}`,
          )}
          onClose={() => setDetailCell(null)}
        />
      ) : null}
    </div>
  );
}

function MatrixDetailModal({
  cell,
  nameByUserId,
  evaluations,
  committedMark,
  onClose,
}: {
  cell: DetailCell;
  nameByUserId: Map<Id<"users">, string>;
  evaluations: Doc<"evaluations">[];
  committedMark: number | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const comp = MATRIX_COMPETENCIES.find((c) => c.id === cell.skillId);
  const displayRows = comp ? competencyCheckpointDisplayRows(comp) : [];
  const peers = evaluations.filter(
    (r) =>
      r.subjectId === cell.subjectId &&
      r.skillId === cell.skillId &&
      r.evaluatorId !== cell.subjectId,
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-eval-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/25 bg-surface-container-high shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/15 bg-surface-container-highest px-5 py-4">
          <div>
            <h4
              id="live-eval-detail-title"
              className="text-base font-bold text-on-surface"
            >
              {comp?.name ?? cell.skillId}
            </h4>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              {nameByUserId.get(cell.subjectId) ?? cell.subjectId}
              {committedMark !== undefined ? (
                <span className="ml-2 text-primary">
                  · Committed {committedMark}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-bright hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-5">
          <ul className="space-y-6">
            {peers.map((row) => {
              const uiEst = evalUiEstimate(cell.skillId, row.checkpoints);
              return (
                <li
                  key={row._id}
                  className="rounded-xl border border-outline-variant/20 bg-surface-container p-4"
                >
                  <p className="text-sm font-bold text-on-surface">
                    {nameByUserId.get(row.evaluatorId) ?? row.evaluatorId}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Manual: {row.manualMark ?? "—"} · UI estimate:{" "}
                    {uiEst.toFixed(2)}
                  </p>
                  {row.rationale ? (
                    <p className="mt-2 text-sm italic text-on-surface-variant">
                      {row.rationale}
                    </p>
                  ) : null}
                  {displayRows.length > 0 ? (
                    <ul className="mt-3 space-y-1.5 border-t border-outline-variant/15 pt-3">
                      {displayRows.map((dr) => {
                        const on = !!row.checkpoints[dr.id];
                        return (
                          <li
                            key={dr.id}
                            className={`flex items-start gap-2 text-xs ${
                              dr.nested ? "pl-4 text-on-surface-variant" : ""
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined shrink-0 text-sm ${
                                on ? "text-primary" : "text-outline-variant/50"
                              }`}
                              style={
                                on
                                  ? {
                                      fontVariationSettings:
                                        '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24',
                                    }
                                  : undefined
                              }
                            >
                              {on ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            <span className={on ? "text-on-surface" : ""}>
                              {dr.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {peers.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No peer evaluation rows for this cell yet.
            </p>
          ) : null}
        </div>
        <div className="flex justify-end border-t border-outline-variant/15 bg-surface-container px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant/40 px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
