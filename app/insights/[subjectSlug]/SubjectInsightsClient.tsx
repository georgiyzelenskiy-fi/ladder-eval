"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useRoomLinkSessionSlug } from "@/components/eval/useRoomLinkSessionSlug";
import { useStoredManagerAccessKey } from "@/lib/devsync-browser";
import {
  applyParentNestedCheckpointConsistency,
  competencyCheckpointDisplayRows,
  groupCheckpointDisplayRows,
} from "@/lib/skill-checkpoints";
import { getSkillCompetencyById } from "@/lib/skill-rubric-common";
import { MATRIX_COMPETENCIES } from "@/lib/matrix-competencies";
import {
  buildRadarData,
  calibrationMarkFor,
  evaluatorsSorted,
  findEvaluation,
  heatmapCellCompareValue,
  heatmapSkillBaseline,
  insightForEvaluationRow,
  INSIGHTS_ALL_SKILL_IDS,
  radarSkillIdsForGroup,
  type SkillRubricGroup,
} from "@/lib/subject-insights-pivot";
import { useRegisteredEvaluatorId } from "@/lib/use-registered-evaluator-id";
import { useQuery } from "convex/react";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const EVALUATOR_COLORS = [
  "#5eb4ff",
  "#bca2ff",
  "#599ffb",
  "#ff716c",
  "#7ae582",
  "#f4a261",
  "#e9c46a",
  "#2a9d8f",
] as const;

/** Diff on 0–5 rubric; at/above this magnitude the cell reads as fully “far” (red end). */
const HEATMAP_FULL_RED_AT = 2.25;

function heatmapDeviationSurface(diff: number): {
  backgroundColor: string;
  borderColor: string;
} {
  const t = Math.min(1, Math.max(0, diff / HEATMAP_FULL_RED_AT));
  const gR = 34;
  const gG = 197;
  const gB = 94;
  const rR = 255;
  const rG = 113;
  const rB = 108;
  const r = Math.round(gR + (rR - gR) * t);
  const g = Math.round(gG + (rG - gG) * t);
  const b = Math.round(gB + (rB - gB) * t);
  return {
    backgroundColor: `rgba(${r},${g},${b},0.22)`,
    borderColor: `rgba(${r},${g},${b},0.45)`,
  };
}

const ERROR_COPY: Record<string, string> = {
  SESSION_NOT_FOUND: "Session not found. Check the session link or open Team setup.",
  SUBJECT_NOT_FOUND: "That person is not on this team roster.",
  NOT_AUTHENTICATED:
    "Open your evaluator link for this session first (or use the manager key), then return here.",
  NOT_ON_ROSTER: "Your browser is not registered for this session roster.",
  PREPARATION_BLOCKED:
    "Peer evaluation details stay private until the session moves to Live or Finished.",
};

function SkillDetailModal({
  open,
  onClose,
  skillId,
  subjectName,
  evaluations,
  subjectId,
  evaluators,
}: {
  open: boolean;
  onClose: () => void;
  skillId: string | null;
  subjectName: string;
  evaluations: Doc<"evaluations">[];
  subjectId: Id<"users">;
  evaluators: Doc<"users">[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal();
    } else {
      d.close();
    }
  }, [open]);

  const competency = skillId
    ? getSkillCompetencyById(MATRIX_COMPETENCIES, skillId)
    : undefined;
  const displayRows = useMemo(
    () => (competency ? competencyCheckpointDisplayRows(competency) : []),
    [competency],
  );
  const groups = useMemo(
    () => groupCheckpointDisplayRows(displayRows),
    [displayRows],
  );

  if (!skillId || !competency) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-50 h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-h-none max-w-none -translate-x-1/2 -translate-y-1/2 rounded-xl border border-outline-variant/25 bg-surface-container p-0 text-on-surface shadow-2xl backdrop:bg-black/60"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="flex h-full max-h-[inherit] min-h-0 flex-col sm:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-primary">
                {competency.name}
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Checkpoints for{" "}
                <span className="font-semibold text-on-surface">{subjectName}</span>
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-outline-variant/30 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-max min-w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="sticky left-0 z-10 bg-surface-container py-2 pr-3 font-bold uppercase tracking-widest text-on-surface-variant">
                    Evaluator
                  </th>
                  {displayRows.map((r) => (
                    <th
                      key={r.id}
                      className="max-w-[7rem] border-l border-outline-variant/10 px-1 py-2 text-center text-[9px] font-normal normal-case leading-tight text-on-surface-variant"
                      title={r.text}
                    >
                      <span className="line-clamp-4">{r.text}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evaluators.map((ev) => {
                  const row = findEvaluation(
                    evaluations,
                    ev._id,
                    subjectId,
                    skillId,
                  );
                  const checked = new Set<string>();
                  const map = row?.checkpoints ?? {};
                  for (const [k, v] of Object.entries(map)) {
                    if (v) checked.add(k);
                  }
                  const effective = applyParentNestedCheckpointConsistency(
                    checked,
                    groups,
                  );
                  return (
                    <tr
                      key={ev._id}
                      className="border-b border-outline-variant/10"
                    >
                      <td className="sticky left-0 z-10 bg-surface-container py-2 pr-3 font-medium text-on-surface">
                        {ev.name}
                      </td>
                      {displayRows.map((r) => {
                        const on = effective.has(r.id);
                        return (
                          <td
                            key={r.id}
                            className="border-l border-outline-variant/10 px-1 py-1 text-center"
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] leading-none ${
                                on
                                  ? "fill-on text-primary"
                                  : "text-on-surface-variant/50"
                              }`}
                            >
                              {on ? "check_circle" : "circle"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="max-h-[min(40vh,14rem)] shrink-0 overflow-y-auto border-t border-outline-variant/20 bg-surface-container-low p-4 sm:max-h-none sm:w-72 sm:border-l sm:border-t-0">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Point legend
          </h3>
          <ul className="space-y-2 text-[10px] text-on-surface-variant">
            {displayRows.map((r) => (
              <li key={r.id}>
                <code className="mr-1 font-mono text-[9px] text-primary/90">
                  {r.id}
                </code>
                <span className="text-on-surface/90">{r.text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </dialog>
  );
}

function InsightsRadarPlaceholder() {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-outline-variant/25 bg-surface-container/30 text-xs text-on-surface-variant">
      Loading chart…
    </div>
  );
}

const DynamicRadarChart = dynamic(
  () =>
    import("./InsightsRadarBlock").then((m) => ({
      default: m.InsightsRadarBlock,
    })),
  { ssr: false, loading: InsightsRadarPlaceholder },
);

export function SubjectInsightsClient({
  subjectSlug,
}: {
  subjectSlug: string;
}) {
  const sessionSlug = useRoomLinkSessionSlug();
  const managerKey = useStoredManagerAccessKey();
  const sessionRow = useQuery(api.session.getSession, { slug: sessionSlug });
  const roster = useQuery(
    api.users.listUsers,
    sessionRow?._id ? { sessionId: sessionRow._id } : "skip",
  );
  const viewerId = useRegisteredEvaluatorId(sessionSlug, roster);

  const bundle = useQuery(api.insights.getSubjectInsightsBundle, {
    sessionSlug,
    subjectSlug,
    viewerUserId: viewerId ?? undefined,
    managerKey: managerKey ?? undefined,
  });

  const [rubricGroup, setRubricGroup] = useState<SkillRubricGroup>("hard");
  /** Hidden = off; empty sets = all series visible. */
  const [hiddenEvaluators, setHiddenEvaluators] = useState(
    () => new Set<string>(),
  );
  const [hiddenUi, setHiddenUi] = useState(() => new Set<string>());
  const [hiddenManual, setHiddenManual] = useState(() => new Set<string>());
  const [modalSkillId, setModalSkillId] = useState<string | null>(null);

  const evaluators = useMemo(
    () => (roster ? evaluatorsSorted(roster) : []),
    [roster],
  );

  const resetToggles = useCallback(() => {
    setHiddenEvaluators(new Set());
    setHiddenUi(new Set());
    setHiddenManual(new Set());
  }, []);

  const okBundle = bundle?.kind === "ok" ? bundle : null;
  const subject = okBundle?.subject;
  const evaluations = useMemo(
    () => (bundle?.kind === "ok" ? bundle.evaluations : []),
    [bundle],
  );
  const calibrationMarks = useMemo(
    () => (bundle?.kind === "ok" ? bundle.calibrationMarks : []),
    [bundle],
  );

  const evalSeriesOn = (id: Id<"users">) => !hiddenEvaluators.has(id);
  const uiSeriesOn = (id: Id<"users">) => !hiddenUi.has(id);
  const manualSeriesOn = (id: Id<"users">) => !hiddenManual.has(id);

  const radarSkillIds = useMemo(
    () => [...radarSkillIdsForGroup(rubricGroup)],
    [rubricGroup],
  );

  const radarData = useMemo(() => {
    if (!subject) return [];
    return buildRadarData({
      subjectId: subject._id,
      evaluations,
      evaluatorIds: evaluators.map((e) => e._id),
      skillIds: radarSkillIds,
    });
  }, [subject, evaluations, evaluators, radarSkillIds]);

  const heatmapBaselinesBySkill = useMemo(() => {
    const out = new Map<string, number | null>();
    if (!subject) return out;
    const evaluatorIds = evaluators.map((e) => e._id);
    for (const sid of INSIGHTS_ALL_SKILL_IDS) {
      const cal = calibrationMarkFor(calibrationMarks, subject._id, sid);
      out.set(
        sid,
        heatmapSkillBaseline({
          subjectId: subject._id,
          skillId: sid,
          evaluations,
          evaluatorIds,
          calibrationMark: cal,
        }),
      );
    }
    return out;
  }, [subject, evaluations, evaluators, calibrationMarks]);

  const radarSeries = useMemo(() => {
    const out: {
      dataKey: string;
      name: string;
      color: string;
      dashed?: boolean;
    }[] = [];
    evaluators.forEach((e, i) => {
      const color = EVALUATOR_COLORS[i % EVALUATOR_COLORS.length];
      const evOn = !hiddenEvaluators.has(e._id);
      const ui = !hiddenUi.has(e._id);
      const man = !hiddenManual.has(e._id);
      if (evOn && ui) {
        out.push({
          dataKey: `ui:${e._id}`,
          name: `${e.name} (UI est.)`,
          color,
        });
      }
      if (evOn && man) {
        out.push({
          dataKey: `manual:${e._id}`,
          name: `${e.name} (manual)`,
          color,
          dashed: true,
        });
      }
    });
    return out;
  }, [evaluators, hiddenEvaluators, hiddenUi, hiddenManual]);

  if (bundle === undefined) {
    return (
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Loading insights…
      </p>
    );
  }

  if (bundle.kind === "error") {
    return (
      <div className="max-w-lg rounded-xl border border-warning/35 bg-surface-container-low p-6">
        <p className="text-sm font-semibold text-on-surface">
          {ERROR_COPY[bundle.code] ?? "Unable to load insights."}
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Code: <code className="font-mono">{bundle.code}</code>
        </p>
      </div>
    );
  }

  if (!subject) {
    return (
      <p className="text-xs text-on-surface-variant">
        Missing subject data.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low/80 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              Multi-evaluator radar
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              UI estimate (solid fill) vs manual mark (dashed), per evaluator.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["hard", "soft"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setRubricGroup(g)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  rubricGroup === g
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {g === "hard" ? "Hard (5)" : "Soft (5)"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
          <div className="min-h-[320px] min-w-0 flex-1">
            <DynamicRadarChart data={radarData} series={radarSeries} />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 rounded-lg border border-outline-variant/15 bg-surface-container/50 p-4 xl:w-72">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Legend
              </span>
              <button
                type="button"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                onClick={resetToggles}
              >
                Reset view
              </button>
            </div>
            <ul className="max-h-80 space-y-3 overflow-y-auto">
              {evaluators.map((e, i) => {
                const color = EVALUATOR_COLORS[i % EVALUATOR_COLORS.length];
                return (
                  <li
                    key={e._id}
                    className="rounded-md border border-outline-variant/10 bg-surface-container-low/80 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: color }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-on-surface">
                        {e.name}
                      </span>
                      <label className="flex items-center gap-1 text-[10px] text-on-surface-variant">
                        <input
                          type="checkbox"
                          checked={evalSeriesOn(e._id)}
                          onChange={(ev) => {
                            const on = ev.target.checked;
                            setHiddenEvaluators((prev) => {
                              const next = new Set(prev);
                              if (on) next.delete(e._id);
                              else next.add(e._id);
                              return next;
                            });
                          }}
                        />
                        On
                      </label>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 pl-4 text-[10px] text-on-surface-variant">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={uiSeriesOn(e._id)}
                          disabled={!evalSeriesOn(e._id)}
                          onChange={(ev) => {
                            const on = ev.target.checked;
                            setHiddenUi((prev) => {
                              const next = new Set(prev);
                              if (on) next.delete(e._id);
                              else next.add(e._id);
                              return next;
                            });
                          }}
                        />
                        UI
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={manualSeriesOn(e._id)}
                          disabled={!evalSeriesOn(e._id)}
                          onChange={(ev) => {
                            const on = ev.target.checked;
                            setHiddenManual((prev) => {
                              const next = new Set(prev);
                              if (on) next.delete(e._id);
                              else next.add(e._id);
                              return next;
                            });
                          }}
                        />
                        Manual
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-outline-variant/15 bg-surface-container-low/80 p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              Aggregate heatmap
            </h2>
            <p className="text-xs text-on-surface-variant">
              Each cell: manual mark (top, — if none) and UI estimate (bottom).
              Click for checkpoints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2 w-8 rounded-full bg-gradient-to-r from-[rgb(34,197,94)] to-[rgb(255,113,108)]" />
              Cell color = distance to baseline (calibrated → else team mean)
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[9.5rem]" />
              {INSIGHTS_ALL_SKILL_IDS.map((sid) => (
                <col key={sid} className="w-[4.75rem]" />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-surface-container-low py-2 pr-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Evaluator
                </th>
                {INSIGHTS_ALL_SKILL_IDS.map((sid) => {
                  const c = getSkillCompetencyById(MATRIX_COMPETENCIES, sid);
                  const label = c?.name ?? sid;
                  return (
                    <th key={sid} className="px-0.5 py-2 align-bottom">
                      <button
                        type="button"
                        title={label}
                        className="flex w-full min-w-0 flex-col items-center gap-1 text-center text-[9px] font-bold uppercase leading-tight tracking-tight text-primary hover:underline"
                        onClick={() => setModalSkillId(sid)}
                      >
                        <span className="line-clamp-3 break-words">{label}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {evaluators.map((ev) => (
                <tr key={ev._id} className="border-t border-outline-variant/10">
                  <td className="sticky left-0 z-10 max-w-[9.5rem] truncate bg-surface-container-low py-2 pr-2 text-xs font-medium text-on-surface">
                    {ev.name}
                  </td>
                  {INSIGHTS_ALL_SKILL_IDS.map((sid) => {
                    const row = findEvaluation(
                      evaluations,
                      ev._id,
                      subject._id,
                      sid,
                    );
                    const insight = insightForEvaluationRow(row, sid);
                    const baseline = heatmapBaselinesBySkill.get(sid) ?? null;
                    const compare = heatmapCellCompareValue(row, insight);
                    const diff =
                      baseline !== null && compare !== null
                        ? Math.abs(compare - baseline)
                        : null;
                    const surface =
                      diff !== null ? heatmapDeviationSurface(diff) : null;
                    const manual = row?.manualMark;
                    const manualLine =
                      manual !== undefined &&
                      manual !== null &&
                      Number.isFinite(manual)
                        ? manual.toFixed(1)
                        : "—";
                    const uiLine = insight
                      ? insight.foundation.uiEstimate.toFixed(1)
                      : "—";
                    const hasPremature =
                      insight &&
                      insight.foundation.prematurePeakLevels.length > 0;
                    return (
                      <td key={sid} className="px-0.5 py-1 align-middle">
                        <button
                          type="button"
                          onClick={() => setModalSkillId(sid)}
                          className={`flex min-h-[4.25rem] w-full flex-col items-center justify-center gap-0.5 rounded-md border px-0.5 py-1.5 text-center tabular-nums transition-opacity hover:opacity-95 ${
                            surface === null
                              ? "border-outline-variant/25 bg-surface-container-high/50"
                              : ""
                          }`}
                          style={
                            surface
                              ? {
                                  backgroundColor: surface.backgroundColor,
                                  borderColor: surface.borderColor,
                                }
                              : undefined
                          }
                        >
                          <span className="text-[11px] font-semibold leading-tight text-on-surface">
                            {manualLine}
                          </span>
                          <span className="text-[10px] font-medium leading-tight text-on-surface/80">
                            {uiLine}
                          </span>
                          {hasPremature ? (
                            <span
                              className="text-[8px] text-warning"
                              title="Out-of-sequence strengths"
                            >
                              Δ
                            </span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-outline-variant/20 bg-surface-container/40">
                <td className="sticky left-0 z-10 max-w-[9.5rem] truncate bg-surface-container/40 py-2 pr-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Calibrated
                </td>
                {INSIGHTS_ALL_SKILL_IDS.map((sid) => {
                  const m = calibrationMarkFor(
                    calibrationMarks,
                    subject._id,
                    sid,
                  );
                  return (
                    <td key={sid} className="px-0.5 py-2 text-center">
                      <span className="font-mono text-xs font-semibold text-on-surface">
                        {m !== undefined ? m.toFixed(1) : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <SkillDetailModal
        open={modalSkillId != null}
        onClose={() => setModalSkillId(null)}
        skillId={modalSkillId}
        subjectName={subject.name}
        evaluations={evaluations}
        subjectId={subject._id}
        evaluators={evaluators}
      />
    </div>
  );
}
