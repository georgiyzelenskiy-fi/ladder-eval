"use client";

import { SkillBlock } from "@/components/eval/SkillBlock";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  persistManagerAccessKey,
  useStoredManagerAccessKey,
} from "@/lib/devsync-browser";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import { competencyToCheckpoints } from "@/lib/skill-checkpoints";
import { computeFoundationFirstUiEstimate } from "@/lib/scoring";
import { useRegisteredEvaluatorId } from "@/lib/use-registered-evaluator-id";
import { useMutation, useQuery } from "convex/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Prototype-aligned accent for UI estimate figures (`docs/live-group-evaluation.html`). */
const UI_ESTIMATE_CLASS = "text-[#599ffb]";

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

function subjectInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
    ).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

type DetailCell = { subjectId: Id<"users">; skillId: string };

const EMPTY_PEER_ORDER: Id<"users">[] = [];

export function LiveEvaluationClient({
  managerGateActive,
  managerKey: managerKeyFromUrl,
  sessionSlug,
}: {
  /** True when `MANAGER_ACCESS_KEY` is set in Convex / Next env (mutations require a key). */
  managerGateActive: boolean;
  /** `?k=` from this request; persisted to localStorage when present for later visits without the query. */
  managerKey?: string;
  /** From `?session=` on this route. */
  sessionSlug: string;
}) {
  const storedManagerKey = useStoredManagerAccessKey();
  const effectiveManagerKey =
    managerKeyFromUrl ?? storedManagerKey ?? undefined;
  const canManage = !managerGateActive || Boolean(effectiveManagerKey);

  useEffect(() => {
    if (managerKeyFromUrl) persistManagerAccessKey(managerKeyFromUrl);
  }, [managerKeyFromUrl]);

  const ensureSession = useMutation(api.session.ensureSession);
  const session = useQuery(api.session.getSession, { slug: sessionSlug });
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

  const registeredEvaluatorId = useRegisteredEvaluatorId(
    sessionSlug,
    bundle?.roster,
  );
  const isRegisteredEvaluatorView = registeredEvaluatorId != null;
  const visitorNeedsManagerKey =
    managerGateActive && !canManage && !isRegisteredEvaluatorView;
  const showManagerControls = canManage;

  const matrixSectionRef = useRef<HTMLElement | null>(null);

  const [bootError, setBootError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [calibDraft, setCalibDraft] = useState("");
  const [detailCell, setDetailCell] = useState<DetailCell | null>(null);
  const [rationaleEvaluatorId, setRationaleEvaluatorId] =
    useState<Id<"users"> | null>(null);

  const seededSkill = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession({
          slug: sessionSlug,
          managerKey: effectiveManagerKey,
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
  }, [ensureSession, sessionSlug, effectiveManagerKey]);

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
    if (!canManage || !sessionId || !firstSkillId || seededSkill.current) return;
    if (session === undefined || session === null) return;
    if (session.liveEvalSkillId) {
      seededSkill.current = true;
      return;
    }
    seededSkill.current = true;
    void setLiveEvalSkill({
      sessionId,
      skillId: firstSkillId,
      managerKey: effectiveManagerKey,
    });
  }, [
    canManage,
    sessionId,
    session,
    firstSkillId,
    setLiveEvalSkill,
    effectiveManagerKey,
  ]);

  const nameByUserId = useMemo(() => {
    const m = new Map<Id<"users">, string>();
    for (const u of bundle?.roster ?? []) {
      m.set(u._id, u.name || u.slug);
    }
    return m;
  }, [bundle?.roster]);

  const slugByUserId = useMemo(() => {
    const m = new Map<Id<"users">, string>();
    for (const u of bundle?.roster ?? []) {
      m.set(u._id, u.slug);
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
  const revealOrder =
    bundle?.session.liveEvalRevealOrder ?? EMPTY_PEER_ORDER;
  const revealCursor = bundle?.session.liveEvalRevealCursor ?? 0;

  const allPeersRevealed =
    revealOrder.length > 0 && revealCursor >= revealOrder.length;

  const currentMark =
    liveSubjectId && liveSkillId
      ? markBySubjectSkill.get(`${liveSubjectId}:${liveSkillId}`)
      : undefined;

  const skillCalibrationProgress = useMemo(() => {
    const total = evaluatees.length;
    if (total === 0) return { done: 0, total: 0, pct: 0 };
    const done = evaluatees.filter((s) =>
      markBySubjectSkill.has(`${s._id}:${liveSkillId}`),
    ).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }, [evaluatees, liveSkillId, markBySubjectSkill]);

  const teamAvgUiForLiveCell = useMemo(() => {
    if (!liveSubjectId || !liveSkillId || !bundle?.evaluations) return null;
    const peers = bundle.evaluations.filter(
      (r) =>
        r.subjectId === liveSubjectId &&
        r.skillId === liveSkillId &&
        r.evaluatorId !== liveSubjectId,
    );
    if (peers.length === 0) return null;
    const sum = peers.reduce(
      (s, r) => s + evalUiEstimate(liveSkillId, r.checkpoints),
      0,
    );
    return sum / peers.length;
  }, [bundle?.evaluations, liveSubjectId, liveSkillId]);

  const revealedReferenceMean = useMemo(() => {
    if (!liveSubjectId || !liveSkillId || !bundle?.evaluations) return null;
    const vals: number[] = [];
    for (let i = 0; i < revealCursor; i++) {
      const peerId = revealOrder[i];
      const row = bundle.evaluations.find(
        (r) =>
          r.evaluatorId === peerId &&
          r.subjectId === liveSubjectId &&
          r.skillId === liveSkillId,
      );
      if (!row) continue;
      if (row.manualMark != null) vals.push(row.manualMark);
      else vals.push(evalUiEstimate(liveSkillId, row.checkpoints));
    }
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [
    bundle?.evaluations,
    liveSubjectId,
    liveSkillId,
    revealCursor,
    revealOrder,
  ]);

  const calibDraftNum = Number(calibDraft);
  const deltaVsRevealed =
    revealedReferenceMean != null && !Number.isNaN(calibDraftNum)
      ? calibDraftNum - revealedReferenceMean
      : null;

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

  const liveSubjectUser = useMemo(
    () =>
      liveSubjectId
        ? (bundle?.roster ?? []).find((u) => u._id === liveSubjectId)
        : undefined,
    [bundle?.roster, liveSubjectId],
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

  const liveSkillName =
    MATRIX_COMPETENCIES.find((c) => c.id === liveSkillId)?.name ?? liveSkillId;

  return (
    <div className="flex min-h-full flex-1 flex-col overflow-hidden bg-surface-container text-on-background">
      {!canManage ? (
        <div
          role="status"
          className={`shrink-0 border-b px-4 py-2.5 text-center text-[11px] leading-snug text-on-surface ${
            visitorNeedsManagerKey
              ? "border-warning/25 bg-warning-muted/15"
              : "border-outline-variant/20 bg-surface-container-high/80"
          }`}
        >
          {visitorNeedsManagerKey ? (
            <>
              <span className="font-semibold text-warning">Manager key required</span>{" "}
              to drive this screen. Open once with{" "}
              <code className="rounded bg-surface-container-high px-1 font-mono text-[10px]">
                ?k=…
              </code>{" "}
              matching <code className="font-mono text-[10px]">MANAGER_ACCESS_KEY</code>
              — this browser remembers it. Sidebar &quot;Live calibration&quot; adds{" "}
              <code className="font-mono text-[10px]">?k=</code> when stored. Use the
              same value in Convex env.
            </>
          ) : (
            <>
              <span className="font-semibold text-on-surface">Follow the session.</span>{" "}
              The manager chooses skill, subject, reveal order, and records the team
              baseline after discussion.
            </>
          )}
        </div>
      ) : null}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Top skill navigation — sticky strip matching prototype */}
        <nav className="sticky top-0 z-40 border-b border-white/5 bg-surface-container-high px-4 pt-3 md:px-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Calibration active
              </span>
              <div
                className="h-1 w-1 animate-pulse rounded-full bg-error"
                aria-hidden
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-container-highest">
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{
                    width: `${skillCalibrationProgress.total ? skillCalibrationProgress.pct : 0}%`,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-primary">
                {String(skillCalibrationProgress.done).padStart(2, "0")}/
                {String(skillCalibrationProgress.total).padStart(2, "0")}{" "}
                subjects
              </span>
            </div>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {showManagerControls ? (
              MATRIX_COMPETENCIES.map((c) => {
                const active = liveSkillId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy !== null}
                    onClick={() =>
                      run("skill", () =>
                        setLiveEvalSkill({
                          sessionId: session._id,
                          skillId: c.id,
                          managerKey: effectiveManagerKey,
                        }),
                      )
                    }
                    className={`shrink-0 whitespace-nowrap px-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      active
                        ? "border-b-2 border-primary text-primary"
                        : "text-on-surface-variant hover:text-on-surface"
                    } disabled:opacity-40`}
                  >
                    {c.name}
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col gap-1 py-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Current competency
                </span>
                <span className="text-sm font-black uppercase tracking-tight text-primary">
                  {liveSkillName}
                </span>
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 pb-10 md:p-6">
          {/* Compact profile header */}
          <div className="mb-8 flex flex-col gap-4 rounded-xl border border-primary/20 bg-surface-container-high p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="rounded-full border-2 border-primary p-0.5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-highest text-lg font-black text-on-surface">
                    {liveSubjectUser
                      ? subjectInitials(
                          liveSubjectUser.name || liveSubjectUser.slug,
                        )
                      : "?"}
                  </div>
                </div>
                {liveSubjectUser ? (
                  <div className="absolute -bottom-1 -right-1 rounded bg-primary px-1.5 py-0.5 text-[8px] font-black tracking-tighter text-on-primary">
                    EVAL
                  </div>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-black uppercase tracking-tight text-on-surface">
                    {liveSubjectId
                      ? (nameByUserId.get(liveSubjectId) ?? "Subject")
                      : "Select subject"}
                  </h2>
                  {liveSubjectId ? (
                    <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">
                      {slugByUserId.get(liveSubjectId) ?? liveSubjectId}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Baseline:
                    </span>
                    <span className="font-mono text-[10px] text-on-surface">
                      {currentMark !== undefined
                        ? currentMark.toFixed(1)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Team avg:
                    </span>
                    <span className="font-mono text-[10px] text-on-surface">
                      {teamAvgUiForLiveCell != null
                        ? teamAvgUiForLiveCell.toFixed(1)
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {showManagerControls ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor="live-eval-subject">
                  Subject
                </label>
                <select
                  id="live-eval-subject"
                  className="max-w-[220px] rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface"
                  value={liveSubjectId ?? ""}
                  disabled={busy !== null || evaluatees.length === 0}
                  onChange={(e) => {
                    const v = e.target.value as Id<"users">;
                    if (!v) return;
                    run("subject", () =>
                      setLiveEvalSubject({
                        sessionId: session._id,
                        subjectId: v,
                        managerKey: effectiveManagerKey,
                      }),
                    );
                  }}
                >
                  <option value="">Select subject…</option>
                  {evaluatees.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.slug}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy !== null || evaluatees.length === 0}
                  onClick={() =>
                    run("rand-subj", () =>
                      randomizeLiveEvalSubject({
                        sessionId: session._id,
                        managerKey: effectiveManagerKey,
                      }),
                    )
                  }
                  className="flex items-center gap-2 rounded-lg border border-outline-variant/30 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-sm">
                    shuffle
                  </span>
                  Randomize subject
                </button>
                <div
                  className="hidden h-10 w-px bg-outline-variant/30 sm:block"
                  aria-hidden
                />
              </div>
            ) : null}
          </div>

          {!liveSubjectId ? (
            <p className="text-sm text-on-surface-variant">
              {showManagerControls
                ? "Add evaluators in Team setup, then pick a subject to start the reveal queue."
                : "Waiting for the manager to choose a subject for the reveal queue."}
            </p>
          ) : (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      Live scoring panel
                    </span>
                    <h3 className="text-lg font-bold text-on-surface">
                      The reveal queue
                    </h3>
                  </div>
                  {showManagerControls ? (
                    <button
                      type="button"
                      disabled={
                        busy !== null ||
                        revealOrder.length === 0 ||
                        allPeersRevealed
                      }
                      onClick={() =>
                        run("reveal", () =>
                          liveEvalRevealNext({
                            sessionId: session._id,
                            managerKey: effectiveManagerKey,
                          }),
                        )
                      }
                      className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 text-xs font-black uppercase tracking-widest text-on-primary shadow-[0_0_15px_-3px_rgba(94,180,255,0.3)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-sm">
                        visibility
                      </span>
                      Reveal next (
                      {revealOrder.length === 0
                        ? "0/0"
                        : `${revealCursor}/${revealOrder.length}`}
                      )
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Progress{" "}
                      {revealOrder.length === 0
                        ? "0/0"
                        : `${revealCursor}/${revealOrder.length}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                          className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/20 bg-surface-container-low p-5"
                        >
                          <span className="material-symbols-outlined mb-3 text-2xl text-outline-variant/40">
                            lock
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-outline-variant">
                            Awaiting reveal
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={peerId}
                        className="relative flex flex-col rounded-xl border border-primary/30 bg-surface-container-high p-5"
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-highest text-xs font-black text-on-surface">
                            {subjectInitials(
                              nameByUserId.get(peerId) ?? String(peerId),
                            )}
                          </div>
                          <div className="flex flex-col">
                            <h4 className="text-[10px] font-black uppercase leading-none tracking-tight text-on-surface">
                              {nameByUserId.get(peerId) ?? peerId}
                            </h4>
                            <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-primary">
                              <span>Revealed</span>
                              {peerId === liveSubjectId ? (
                                <span className="rounded bg-primary/15 px-1 py-px text-[7px] tracking-tighter text-primary">
                                  Self
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-2.5 text-center">
                            <span className="mb-1 block text-[8px] font-bold uppercase text-on-surface-variant">
                              Manual mark
                            </span>
                            <span className="text-2xl font-black text-on-surface">
                              {row?.manualMark ?? "—"}
                            </span>
                          </div>
                          <div className="rounded-lg border border-outline-variant/10 bg-surface-container p-2.5 text-center">
                            <span className="mb-1 block text-[8px] font-bold uppercase text-on-surface-variant">
                              UI estimate
                            </span>
                            <span
                              className={`text-2xl font-black ${UI_ESTIMATE_CLASS}`}
                            >
                              {uiEst !== null ? uiEst.toFixed(1) : "—"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRationaleEvaluatorId(peerId)}
                          className="flex w-full items-center justify-center gap-2 rounded border border-outline-variant/30 py-2.5 text-[9px] font-black uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-bright hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-xs">
                            article
                          </span>
                          View rationale
                        </button>
                      </div>
                    );
                  })}
                </div>
                {revealOrder.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No evaluators in the queue. Seed evaluator accounts from the
                    control room.
                  </p>
                ) : null}
                {showManagerControls ? (
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest">
                    <button
                      type="button"
                      disabled={busy !== null || revealCursor === 0}
                      onClick={() =>
                        run("reset-reveal", () =>
                          resetLiveEvalReveal({
                            sessionId: session._id,
                            managerKey: effectiveManagerKey,
                          }),
                        )
                      }
                      className="text-on-surface-variant underline decoration-outline-variant/50 underline-offset-2 hover:text-on-surface disabled:opacity-40"
                    >
                      Reset reveal
                    </button>
                    <span className="text-outline-variant/40" aria-hidden>
                      ·
                    </span>
                    <button
                      type="button"
                      disabled={busy !== null || revealOrder.length < 2}
                      onClick={() =>
                        run("shuffle", () =>
                          shuffleLiveEvalOrder({
                            sessionId: session._id,
                            managerKey: effectiveManagerKey,
                          }),
                        )
                      }
                      className="text-on-surface-variant underline decoration-outline-variant/50 underline-offset-2 hover:text-on-surface disabled:opacity-40"
                    >
                      Shuffle order
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                {showManagerControls ? (
                  <div className="flex flex-col rounded-xl border-2 border-primary/40 bg-surface-container-highest/90 p-6 shadow-2xl backdrop-blur-md">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/20">
                        <span className="material-symbols-outlined text-sm text-primary">
                          gavel
                        </span>
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-tight text-on-surface">
                        Final calibration
                      </h3>
                    </div>
                    <p className="mb-8 text-xs leading-relaxed text-on-surface-variant">
                      Finalize{" "}
                      <span className="font-semibold text-on-surface">
                        {nameByUserId.get(liveSubjectId)}
                      </span>
                      &apos;s score for{" "}
                      <span className="font-bold text-primary">
                        {liveSkillName}
                      </span>{" "}
                      based on the current evaluator reveals.
                      {!allPeersRevealed ? (
                        <span className="mt-2 block text-warning">
                          Reveal the full queue before committing.
                        </span>
                      ) : null}
                    </p>
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="calib-override"
                          className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant"
                        >
                          Manual override
                        </label>
                        <input
                          id="calib-override"
                          type="text"
                          inputMode="decimal"
                          value={calibDraft}
                          onChange={(e) => setCalibDraft(e.target.value)}
                          placeholder="e.g. 4.2"
                          className="w-full border-0 border-b-2 border-outline-variant bg-surface-container-low py-2 text-3xl font-black text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-0"
                        />
                      </div>
                      <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                            Calculated delta
                          </span>
                          <span className="font-mono text-xs text-primary">
                            {deltaVsRevealed != null
                              ? `${deltaVsRevealed >= 0 ? "+" : ""}${deltaVsRevealed.toFixed(1)}`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${revealedReferenceMean != null ? Math.min(100, (revealedReferenceMean / 5) * 100) : 0}%`,
                              }}
                            />
                          </div>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container-highest">
                            <div
                              className="h-full bg-outline-variant transition-all"
                              style={{
                                width: `${!Number.isNaN(calibDraftNum) && calibDraftNum >= 0 ? Math.min(100, (calibDraftNum / 5) * 100) : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-[8px] uppercase tracking-widest text-on-surface-variant opacity-70">
                          Bars: revealed peer mean · draft override (0–5 scale)
                        </p>
                      </div>
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
                              managerKey: effectiveManagerKey,
                            }),
                          );
                        }}
                        className="w-full rounded-lg bg-primary py-4 text-xs font-black uppercase tracking-widest text-on-primary shadow-[0_0_20px_rgba(94,180,255,0.3)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                      >
                        Commit baseline
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          matrixSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-sm">
                          history
                        </span>
                        Full history
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col rounded-xl border border-outline-variant/25 bg-surface-container-high/90 p-6 shadow-lg backdrop-blur-md">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-highest">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">
                          hourglass_empty
                        </span>
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-tight text-on-surface">
                        Team baseline
                      </h3>
                    </div>
                    <p className="mb-6 text-xs leading-relaxed text-on-surface-variant">
                      The manager records the agreed mark for{" "}
                      <span className="font-semibold text-on-surface">
                        {nameByUserId.get(liveSubjectId)}
                      </span>{" "}
                      on{" "}
                      <span className="font-bold text-primary">
                        {liveSkillName}
                      </span>{" "}
                      after the call discusses each reveal. You&apos;ll see it here
                      once it&apos;s committed.
                    </p>
                    <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low p-5 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                        Committed baseline
                      </p>
                      <p className="mt-2 font-mono text-4xl font-black text-on-surface">
                        {currentMark !== undefined ? currentMark.toFixed(1) : "—"}
                      </p>
                      {currentMark === undefined ? (
                        <p className="mt-3 text-[10px] text-on-surface-variant">
                          Not set yet for this subject and skill.
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        matrixSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-sm">
                        history
                      </span>
                      Full history
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <section
            ref={matrixSectionRef}
            id="live-eval-calibration-matrix"
            className="mt-12 border-t border-outline-variant/20 pt-8"
          >
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-on-surface">
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
                                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-48 -translate-x-1/2 rounded-md border border-outline-variant/30 bg-surface-container-highest px-2 py-1.5 text-left text-[10px] leading-snug text-on-surface-variant shadow-lg md:block md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
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
        </div>
      </main>

      {rationaleEvaluatorId && liveSubjectId && liveSkillId ? (
        <PeerRationaleModal
          row={findEvalRow(
            rationaleEvaluatorId,
            liveSubjectId,
            liveSkillId,
          )}
          skillId={liveSkillId}
          evaluatorName={
            nameByUserId.get(rationaleEvaluatorId) ?? String(rationaleEvaluatorId)
          }
          skillName={liveSkillName}
          onClose={() => setRationaleEvaluatorId(null)}
        />
      ) : null}

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

function PeerRationaleModal({
  skillId,
  row,
  evaluatorName,
  skillName,
  onClose,
}: {
  skillId: string;
  row: Doc<"evaluations"> | undefined;
  evaluatorName: string;
  skillName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const comp = MATRIX_COMPETENCIES.find((c) => c.id === skillId);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/90 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="peer-rationale-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-surface-container-high shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-highest px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-highest text-xs font-black">
              {subjectInitials(evaluatorName)}
            </div>
            <div>
              <h4
                id="peer-rationale-title"
                className="text-base font-bold uppercase text-on-surface"
              >
                {evaluatorName}
              </h4>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                Peer matrix (read-only) · {skillName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-bright hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[calc(90vh-10rem)] overflow-y-auto p-4 md:p-6">
          {comp ? (
            <SkillBlock
              key={row?._id ?? "no-row"}
              competency={comp}
              row={row}
              readOnly
              revealHighlight={false}
              dimForReveal={false}
              layout="embedded"
              onSetCheckpoints={() => {}}
              onSaveMeta={() => {}}
            />
          ) : (
            <p className="text-sm text-on-surface-variant">
              Unknown skill — cannot render matrix.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 bg-surface-container px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant/30 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Close view
          </button>
        </div>
      </div>
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
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-primary/25 bg-surface-container-high shadow-2xl"
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
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-4 md:p-5">
          {!comp ? (
            <p className="text-sm text-on-surface-variant">
              Unknown skill — cannot render matrix.
            </p>
          ) : peers.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No peer evaluation rows for this cell yet.
            </p>
          ) : (
            <ul className="space-y-8">
              {peers.map((peerRow) => (
                <li key={peerRow._id} className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
                    {nameByUserId.get(peerRow.evaluatorId) ??
                      String(peerRow.evaluatorId)}
                    <span className="ml-2 font-normal normal-case tracking-normal text-on-surface-variant">
                      · read-only peer view
                    </span>
                  </p>
                  <SkillBlock
                    competency={comp}
                    row={peerRow}
                    readOnly
                    revealHighlight={false}
                    dimForReveal={false}
                    layout="embedded"
                    onSetCheckpoints={() => {}}
                    onSaveMeta={() => {}}
                  />
                </li>
              ))}
            </ul>
          )}
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
