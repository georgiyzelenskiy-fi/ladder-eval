"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import {
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
} from "@/lib/skill-checkpoints";
import { computeFoundationFirstUiEstimate } from "@/lib/scoring";
import type { SkillCompetency } from "@/lib/skill-rubric-common";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

type SessionPhase = "preparation" | "live" | "finished";

type Props = {
  sessionId: Id<"sessions">;
  phase: SessionPhase;
  myUserId: Id<"users">;
  roster: Doc<"users">[];
};

const COMPETENCY_ICONS: Record<string, string> = {
  "code-reviews": "rate_review",
  "emplifi-domain-knowledge": "corporate_fare",
  "technology-knowledge": "memory",
  "problem-solving": "lightbulb",
  "learning-concepts": "school",
  mentoring: "groups",
  "organizational-skills": "assignment",
  "collaboration-cooperation": "handshake",
  accountability: "verified_user",
  "conflict-resolution": "gavel",
};

function competencyIcon(id: string) {
  return COMPETENCY_ICONS[id] ?? "widgets";
}

function evaluationFor(
  rows: Doc<"evaluations">[] | undefined,
  subjectId: Id<"users">,
  skillId: string,
): Doc<"evaluations"> | undefined {
  return rows?.find(
    (r) => r.subjectId === subjectId && r.skillId === skillId,
  );
}

function SkillBlock({
  competency,
  row,
  readOnly,
  onToggleCheckpoint,
  onSaveMeta,
}: {
  competency: SkillCompetency;
  row: Doc<"evaluations"> | undefined;
  readOnly: boolean;
  onToggleCheckpoint: (
    skillId: string,
    checkpointId: string,
    next: boolean,
  ) => void;
  onSaveMeta: (
    skillId: string,
    manualMark: number | undefined,
    rationale: string | undefined,
  ) => void;
}) {
  const checkpoints = useMemo(
    () => competencyToCheckpoints(competency),
    [competency],
  );
  const displayRows = useMemo(
    () => competencyCheckpointDisplayRows(competency),
    [competency],
  );

  const checked = useMemo(() => {
    const map = row?.checkpoints ?? {};
    const s = new Set<string>();
    for (const [k, v] of Object.entries(map)) {
      if (v) s.add(k);
    }
    return s;
  }, [row?.checkpoints]);

  const score = useMemo(
    () => computeFoundationFirstUiEstimate(checkpoints, checked),
    [checkpoints, checked],
  );

  const byLevel = useMemo(() => {
    const m = new Map<number, typeof displayRows>();
    for (const r of displayRows) {
      const list = m.get(r.level) ?? [];
      list.push(r);
      m.set(r.level, list);
    }
    return m;
  }, [displayRows]);

  const [manualDraft, setManualDraft] = useState(
    () => row?.manualMark?.toString() ?? "",
  );
  const [rationaleDraft, setRationaleDraft] = useState(
    () => row?.rationale ?? "",
  );

  const icon = competencyIcon(competency.id);

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-4 border-b border-outline-variant/20 bg-surface-container-high px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-primary/20 bg-surface-container">
            <span className="material-symbols-outlined text-2xl text-primary">
              {icon}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-on-surface">
              {competency.name}
            </h2>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Dimension focus:{" "}
              {competency.dimensions.slice(0, 3).join(", ")}
              {competency.dimensions.length > 3 ? "…" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[9px] font-bold uppercase tracking-tighter text-on-surface-variant">
              Evaluator mark (1–5)
            </span>
            <input
              type="number"
              min={1}
              max={5}
              step={1}
              disabled={readOnly}
              className="h-10 w-16 rounded border border-primary/30 bg-surface-container text-center text-lg font-black text-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              value={manualDraft}
              onChange={(e) => setManualDraft(e.target.value)}
              onBlur={() => {
                const t = manualDraft.trim();
                if (t === "") {
                  setManualDraft(row?.manualMark?.toString() ?? "");
                  return;
                }
                const n = Number(t);
                if (!Number.isInteger(n) || n < 1 || n > 5) {
                  setManualDraft(row?.manualMark?.toString() ?? "");
                  return;
                }
                if (n !== row?.manualMark) {
                  onSaveMeta(competency.id, n, undefined);
                }
              }}
            />
          </div>
          <div
            className="hidden h-10 w-px bg-outline-variant/30 sm:block"
            aria-hidden
          />
          <div className="text-right">
            <span className="text-[9px] font-bold uppercase tracking-tighter text-on-surface-variant">
              UI-calculated level
            </span>
            <p className="text-3xl font-black tabular-nums text-on-surface/80">
              L{score.uiEstimate.toFixed(1)}
            </p>
            <p className="text-[10px] text-on-surface-variant">
              Base L{score.baseLevel}
              {score.spikeCount > 0
                ? ` · +${score.spikeCount} spike${score.spikeCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {score.prematurePeakLevels.length > 0 ? (
        <div className="border-b border-warning-muted bg-warning/10 px-4 py-2.5 text-xs text-on-surface">
          <span className="font-semibold text-warning">Premature peaks: </span>
          Criteria above your foundation rung are checked (levels{" "}
          {score.prematurePeakLevels.join(", ")}). Calibration may be needed at
          reveal.
        </div>
      ) : null}

      <div className="grid gap-1 bg-surface-container-lowest p-1 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((level) => {
          const rowsAt = byLevel.get(level) ?? [];
          const rub = competency.levels.find((l) => l.number === level);
          const emphasize = score.baseLevel === level;
          return (
            <div
              key={level}
              className={`space-y-3 p-4 ${
                emphasize
                  ? "bg-surface-container-high"
                  : "bg-surface-container/50"
              }`}
            >
              <p
                className={`mb-2 block text-center text-[9px] font-black uppercase tracking-[0.2em] ${
                  emphasize ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {rub ? rub.label : `L${level}`}
              </p>
              <div className="space-y-2">
                {rowsAt.map((dr) => {
                  const isOn = checked.has(dr.id);
                  return (
                    <label
                      key={dr.id}
                      className={`flex cursor-pointer select-none flex-col gap-1 rounded border p-3 text-left text-[11px] transition-all ${
                        isOn
                          ? "border-primary/40 bg-primary/5"
                          : "border-outline-variant/10 hover:bg-surface-variant"
                      } ${readOnly ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isOn}
                          disabled={readOnly}
                          onChange={() =>
                            onToggleCheckpoint(competency.id, dr.id, !isOn)
                          }
                        />
                        <span
                          className={`material-symbols-outlined shrink-0 text-[16px] ${
                            isOn
                              ? "fill-on text-primary"
                              : "text-on-surface-variant"
                          }`}
                        >
                          {isOn ? "check_circle" : "circle"}
                        </span>
                        <span
                          className={
                            dr.nested
                              ? "leading-tight text-on-surface-variant"
                              : "font-bold leading-tight text-on-surface"
                          }
                        >
                          {dr.text}
                        </span>
                      </div>
                    </label>
                  );
                })}
                {rowsAt.length === 0 ? (
                  <p className="text-center text-[10px] text-on-surface-variant/60">
                    —
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 border-t border-outline-variant/10 bg-surface-container-low p-6">
        <label className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Rationale / notes
          </span>
          <textarea
            rows={4}
            disabled={readOnly}
            className="resize-none rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            value={rationaleDraft}
            onChange={(e) => setRationaleDraft(e.target.value)}
            onBlur={() => {
              const next = rationaleDraft.trim();
              const prev = (row?.rationale ?? "").trim();
              if (next !== prev) {
                onSaveMeta(competency.id, undefined, next || undefined);
              }
            }}
            placeholder="Optional context for this competency…"
          />
        </label>
      </div>
    </section>
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

  const onToggleCheckpoint = useCallback(
    async (skillId: string, checkpointId: string, next: boolean) => {
      if (!effectiveSubject || readOnly) return;
      try {
        await updateCheckboxes({
          sessionId,
          evaluatorId: myUserId,
          subjectId: effectiveSubject,
          skillId,
          checkpoints: { [checkpointId]: next },
        });
      } catch {
        /* Convex retries / toast later */
      }
    },
    [
      effectiveSubject,
      readOnly,
      updateCheckboxes,
      sessionId,
      myUserId,
    ],
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
              onToggleCheckpoint={onToggleCheckpoint}
              onSaveMeta={onSaveMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
