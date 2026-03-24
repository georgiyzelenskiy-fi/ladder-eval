"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { SkillBlock } from "@/components/eval/SkillBlock";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

type SessionPhase = "preparation" | "live" | "finished";

type Props = {
  sessionId: Id<"sessions">;
  phase: SessionPhase;
  /** During live phase, manager-driven “current” competency for sequential reveal. */
  activeRevealSkillId?: string | undefined;
  myUserId: Id<"users">;
  roster: Doc<"users">[];
};

function evaluationFor(
  rows: Doc<"evaluations">[] | undefined,
  subjectId: Id<"users">,
  skillId: string,
): Doc<"evaluations"> | undefined {
  return rows?.find(
    (r) => r.subjectId === subjectId && r.skillId === skillId,
  );
}

function MatrixWorkspaceHero() {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 lg:col-span-4">
        <div className="mb-4 flex justify-between items-start">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Skill geometry
          </h3>
        </div>
        <div className="relative flex h-32 items-center justify-center rounded-lg bg-surface-container/40">
          <div
            className="absolute inset-2 rounded-md opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(94,180,255,0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(94,180,255,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "12px 12px",
            }}
            aria-hidden
          />
          <p className="relative z-[1] max-w-[12rem] text-center text-[10px] uppercase tracking-widest text-on-surface-variant">
            Radar chart placeholder — library TBD
          </p>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase text-on-surface-variant">
          Aggregated view will appear here after integration.
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-xl border border-primary/20 bg-surface-container p-6 lg:col-span-8">
        <div className="mb-4 flex items-center gap-4">
          <span className="material-symbols-outlined text-3xl text-primary">
            edit_note
          </span>
          <div>
            <h3 className="text-lg font-black tracking-tight text-on-surface">
              Evaluator workspace
            </h3>
            <p className="text-xs text-on-surface-variant">
              Review the criteria below. Toggle items to record fulfillment.
              Assign optional manual marks and add qualitative notes per
              competency.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-outline-variant/20 pt-4 sm:grid-cols-3">
          <div className="text-center sm:border-r sm:border-outline-variant/20 sm:pr-4">
            <div className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
              Status
            </div>
            <div className="text-sm font-bold uppercase text-success">
              In progress
            </div>
          </div>
          <div className="text-center sm:border-r sm:border-outline-variant/20 sm:px-4">
            <div className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
              Manual marks
            </div>
            <div className="text-sm font-bold text-on-surface">—</div>
          </div>
          <div className="text-center sm:pl-4">
            <div className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">
              Peer visibility
            </div>
            <div className="text-sm font-bold uppercase text-primary">
              Private draft
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EvaluatorMatrix({
  sessionId,
  phase,
  activeRevealSkillId,
  myUserId,
  roster,
}: Props) {
  const updateCheckboxes = useMutation(api.evaluations.updateCheckboxes);
  const myRows = useQuery(api.evaluations.listEvaluationsForEvaluator, {
    sessionId,
    evaluatorId: myUserId,
  });

  const subjects = useMemo(
    () => roster.filter((u) => u._id !== myUserId),
    [roster, myUserId],
  );

  const [subjectId, setSubjectId] = useState<Id<"users"> | null>(null);

  const effectiveSubject =
    subjectId && subjects.some((s) => s._id === subjectId)
      ? subjectId
      : subjects[0]?._id ?? null;

  const readOnly = phase === "finished";

  const revealFocusActive = useMemo(() => {
    if (phase !== "live" || !activeRevealSkillId) return false;
    return MATRIX_COMPETENCIES.some((c) => c.id === activeRevealSkillId);
  }, [phase, activeRevealSkillId]);

  const focusedCompetency = useMemo(
    () =>
      revealFocusActive && activeRevealSkillId
        ? MATRIX_COMPETENCIES.find((c) => c.id === activeRevealSkillId)
        : undefined,
    [revealFocusActive, activeRevealSkillId],
  );

  const onSetCheckpoints = useCallback(
    async (skillId: string, updates: Record<string, boolean>) => {
      if (!effectiveSubject || readOnly) return;
      try {
        await updateCheckboxes({
          sessionId,
          evaluatorId: myUserId,
          subjectId: effectiveSubject,
          skillId,
          checkpoints: updates,
        });
      } catch {
        /* Convex retries / toast later */
      }
    },
    [effectiveSubject, readOnly, updateCheckboxes, sessionId, myUserId],
  );

  const onSaveMeta = useCallback(
    async (
      skillId: string,
      manualMark: number | undefined,
      rationale: string | undefined,
    ) => {
      if (!effectiveSubject || readOnly) return;
      try {
        await updateCheckboxes({
          sessionId,
          evaluatorId: myUserId,
          subjectId: effectiveSubject,
          skillId,
          ...(manualMark !== undefined ? { manualMark } : {}),
          ...(rationale !== undefined ? { rationale } : {}),
        });
      } catch {
        /* ignore */
      }
    },
    [effectiveSubject, readOnly, updateCheckboxes, sessionId, myUserId],
  );

  const phaseBanner =
    phase === "preparation"
      ? {
          className:
            "border-outline-variant/15 bg-surface-container-high text-on-surface",
          text: "Preparation — only your drafts load here. Peer checkbox data stays private until the session is live.",
        }
      : phase === "live"
        ? {
            className:
              "border-primary/25 bg-primary/10 text-on-surface",
            text: "Live — you still edit only your matrix; aggregated peer views are for the manager driver.",
          }
        : {
            className:
              "border-outline-variant/20 bg-surface-container-highest/80 text-on-surface-variant",
            text: "Session finished — matrix is read-only.",
          };

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        No one else is on the roster yet. When teammates join, pick them here to
        score.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${phaseBanner.className}`}
      >
        {phaseBanner.text}
      </div>

      {focusedCompetency ? (
        <div className="rounded-lg border border-primary/35 bg-primary/8 px-4 py-3 text-sm text-on-surface">
          <span className="font-semibold text-primary">Live focus — </span>
          {focusedCompetency.name}. Other competencies are de-emphasized until
          the manager advances reveal.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex w-full max-w-md flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Subject
          <select
            className="mt-1 w-full cursor-pointer border-0 border-b border-outline-variant bg-surface-container-low py-2.5 text-sm font-normal text-on-surface focus:border-primary focus:outline-none focus:ring-0 rounded-sm"
            value={effectiveSubject ?? ""}
            onChange={(e) =>
              setSubjectId(e.target.value as Id<"users">)
            }
          >
            {subjects.map((u) => (
              <option
                key={u._id}
                value={u._id}
                className="bg-surface-container text-on-surface"
              >
                {u.name} ({u.slug})
              </option>
            ))}
          </select>
        </label>
      </div>

      <MatrixWorkspaceHero />

      {myRows === undefined ? (
        <p className="text-sm text-on-surface-variant">Loading matrix…</p>
      ) : (
        <div className="flex flex-col gap-12">
          {MATRIX_COMPETENCIES.map((comp) => (
            <SkillBlock
              key={`${effectiveSubject}-${comp.id}`}
              competency={comp}
              row={evaluationFor(myRows, effectiveSubject!, comp.id)}
              readOnly={readOnly}
              revealHighlight={
                revealFocusActive && activeRevealSkillId === comp.id
              }
              dimForReveal={revealFocusActive}
              onSetCheckpoints={onSetCheckpoints}
              onSaveMeta={onSaveMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
