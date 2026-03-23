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
  onSaveMeta: (skillId: string, manualMark: number | undefined, rationale: string | undefined) => void;
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

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {competency.name}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {competency.dimensions.slice(0, 3).join(" · ")}
            {competency.dimensions.length > 3 ? "…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              UI estimate
            </p>
            <p className="text-2xl font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
              {score.uiEstimate.toFixed(1)}
            </p>
            <p className="text-[10px] text-zinc-500">
              Base L{score.baseLevel}
              {score.spikeCount > 0
                ? ` · +${score.spikeCount} spike${score.spikeCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {score.prematurePeakLevels.length > 0 ? (
        <div className="border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          <span className="font-medium">Premature peaks: </span>
          Criteria above your foundation rung are checked (levels{" "}
          {score.prematurePeakLevels.join(", ")}). Calibration may be needed at
          reveal.
        </div>
      ) : null}

      <div className="grid gap-px bg-zinc-200 p-px dark:bg-zinc-800 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((level) => {
          const rowsAt = byLevel.get(level) ?? [];
          const rub = competency.levels.find((l) => l.number === level);
          return (
            <div
              key={level}
              className="space-y-2 bg-zinc-50 p-3 dark:bg-zinc-900/80"
            >
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {rub ? `${rub.label}` : `L${level}`}
              </p>
              <div className="space-y-2">
                {rowsAt.map((dr) => {
                  const isOn = checked.has(dr.id);
                  return (
                    <label
                      key={dr.id}
                      className={`flex cursor-pointer gap-2 rounded-lg border p-2 text-left text-xs transition-colors select-none ${
                        isOn
                          ? "border-blue-400/50 bg-blue-50/80 dark:border-blue-500/40 dark:bg-blue-950/30"
                          : "border-zinc-200 hover:bg-zinc-100/80 dark:border-zinc-700 dark:hover:bg-zinc-800/80"
                      } ${readOnly ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 shrink-0"
                        checked={isOn}
                        disabled={readOnly}
                        onChange={() =>
                          onToggleCheckpoint(competency.id, dr.id, !isOn)
                        }
                      />
                      <span
                        className={
                          dr.nested
                            ? "pl-2 text-zinc-600 dark:text-zinc-400"
                            : "font-medium text-zinc-800 dark:text-zinc-200"
                        }
                      >
                        {dr.text}
                      </span>
                    </label>
                  );
                })}
                {rowsAt.length === 0 ? (
                  <p className="text-center text-[10px] text-zinc-400">—</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 border-t border-zinc-200 p-4 sm:grid-cols-2 dark:border-zinc-800">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Manual mark (1–5, optional)
          </span>
          <input
            type="number"
            min={1}
            max={5}
            step={1}
            disabled={readOnly}
            className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
        </label>
        <label className="flex flex-col gap-1 text-xs sm:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Rationale / notes
          </span>
          <textarea
            rows={3}
            disabled={readOnly}
            className="resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
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
            "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200",
          text: "Preparation — only your drafts load here. Peer checkbox data stays private until the session is live.",
        }
      : phase === "live"
        ? {
            className:
              "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100",
            text: "Live — you still edit only your matrix; aggregated peer views are for the manager driver.",
          }
        : {
            className:
              "border-zinc-300 bg-zinc-200/60 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
            text: "Session finished — matrix is read-only.",
          };

  if (subjects.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No one else is on the roster yet. When teammates join, pick them here to
        score.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${phaseBanner.className}`}
      >
        {phaseBanner.text}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Subject
          <select
            className="max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-normal dark:border-zinc-600 dark:bg-zinc-950"
            value={effectiveSubject ?? ""}
            onChange={(e) =>
              setSubjectId(e.target.value as Id<"users">)
            }
          >
            {subjects.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.slug})
              </option>
            ))}
          </select>
        </label>
      </div>

      {myRows === undefined ? (
        <p className="text-sm text-zinc-500">Loading matrix…</p>
      ) : (
        <div className="flex flex-col gap-10">
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
