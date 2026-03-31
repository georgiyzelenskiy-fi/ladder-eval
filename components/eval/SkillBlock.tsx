"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import {
  applyParentNestedCheckpointConsistency,
  competencyCheckpointDisplayRows,
  competencyToCheckpoints,
  groupCheckpointDisplayRows,
  parentCheckpointMet,
  type CheckpointDisplayGroup,
} from "@/lib/skill-checkpoints";
import { computeFoundationFirstUiEstimate } from "@/lib/scoring";
import type { SkillCompetency } from "@/lib/skill-rubric-common";
import { useId, useMemo, useRef, useState } from "react";

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

/** Collapsed level strip: same glyph + sizing as expanded parent row (`check_circle` / `circle`). */
function LevelSummaryPointChip({
  met,
  pointIndex,
}: {
  met: boolean;
  pointIndex: number;
}) {
  const label = met
    ? `Point ${pointIndex + 1}, met`
    : `Point ${pointIndex + 1}, not met`;
  return (
    <span className="inline-flex shrink-0 items-center" title={label}>
      <input
        type="checkbox"
        className="sr-only"
        checked={met}
        disabled
        tabIndex={-1}
        aria-label={label}
      />
      <span
        aria-hidden
        className={`material-symbols-outlined shrink-0 text-[16px] leading-none ${
          met ? "fill-on text-primary" : "text-on-surface-variant"
        }`}
      >
        {met ? "check_circle" : "circle"}
      </span>
    </span>
  );
}

export function SkillBlock({
  competency,
  row,
  readOnly,
  revealHighlight,
  dimForReveal,
  onSetCheckpoints,
  onSaveMeta,
  /** Tighter chrome when nested inside dialogs (live-eval, etc.). */
  layout = "page",
}: {
  competency: SkillCompetency;
  row: Doc<"evaluations"> | undefined;
  readOnly: boolean;
  revealHighlight: boolean;
  dimForReveal: boolean;
  onSetCheckpoints: (
    skillId: string,
    updates: Record<string, boolean>,
  ) => void;
  onSaveMeta: (
    skillId: string,
    manualMark: number | undefined,
    rationale: string | undefined,
  ) => void;
  layout?: "page" | "embedded";
}) {
  const checkpoints = useMemo(
    () => competencyToCheckpoints(competency),
    [competency],
  );
  const displayRows = useMemo(
    () => competencyCheckpointDisplayRows(competency),
    [competency],
  );

  const groupsAll = useMemo(
    () => groupCheckpointDisplayRows(displayRows),
    [displayRows],
  );

  const checked = useMemo(() => {
    const map = row?.checkpoints ?? {};
    const s = new Set<string>();
    for (const [k, v] of Object.entries(map)) {
      if (v) s.add(k);
    }
    return s;
  }, [row?.checkpoints]);

  const effectiveChecked = useMemo(
    () => applyParentNestedCheckpointConsistency(checked, groupsAll),
    [checked, groupsAll],
  );

  const score = useMemo(
    () => computeFoundationFirstUiEstimate(checkpoints, effectiveChecked),
    [checkpoints, effectiveChecked],
  );

  const groupsByLevel = useMemo(() => {
    const m = new Map<number, CheckpointDisplayGroup[]>();
    for (const g of groupsAll) {
      const L = g.parent.level;
      const list = m.get(L) ?? [];
      list.push(g);
      m.set(L, list);
    }
    return m;
  }, [groupsAll]);

  const [manualDraft, setManualDraft] = useState(
    () => row?.manualMark?.toString() ?? "",
  );
  const [rationaleDraft, setRationaleDraft] = useState(
    () => row?.rationale ?? "",
  );
  const [expanded, setExpanded] = useState(true);
  const [levelPanelsOpen, setLevelPanelsOpen] = useState<
    Record<number, boolean>
  >(() => ({ 1: true, 2: true, 3: true, 4: true, 5: true }));
  const bodyId = useId();
  const showBody = expanded;

  const icon = competencyIcon(competency.id);
  const sectionRef = useRef<HTMLElement>(null);

  const revealShell =
    revealHighlight
      ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-surface-container-low"
      : "";
  const revealDim = dimForReveal && !revealHighlight ? "opacity-45" : "";
  const shellShadow =
    layout === "embedded"
      ? "shadow-[0_8px_28px_-14px_rgba(0,0,0,0.4)]"
      : "shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]";
  const scrollMt = layout === "embedded" ? "" : "scroll-mt-24";

  return (
    <section
      ref={sectionRef}
      id={
        layout === "page" ? `eval-skill-${competency.id}` : undefined
      }
      className={`${scrollMt} overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low ${shellShadow} transition-opacity duration-300 ${revealShell} ${revealDim}`}
    >
      <div
        className={`flex flex-col gap-4 bg-surface-container-high px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 ${showBody ? "border-b border-outline-variant/20" : ""}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center sm:gap-3">
          <button
            type="button"
            aria-expanded={showBody}
            aria-controls={bodyId}
            title={
              showBody ? "Collapse competency" : "Expand competency"
            }
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/25 text-on-surface-variant transition-colors hover:border-primary/30 hover:bg-surface-bright hover:text-on-surface sm:mt-0"
          >
            <span className="material-symbols-outlined text-xl">
              {showBody ? "expand_less" : "expand_more"}
            </span>
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-primary/20 bg-surface-container">
              <span className="material-symbols-outlined text-2xl text-primary">
                {icon}
              </span>
            </div>
            <div className="min-w-0">
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
        </div>
        <div className="flex flex-wrap items-end gap-6 pl-11 sm:pl-0">
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

      {showBody ? (
        <div id={bodyId}>
          {score.prematurePeakLevels.length > 0 ? (
            <div className="border-b border-warning-muted bg-warning/10 px-4 py-2.5 text-xs text-on-surface">
              <span className="font-semibold text-warning">Premature peaks: </span>
              Criteria two or more rungs above your fully met level are checked
              (levels {score.prematurePeakLevels.join(", ")}). The next rung may
              still be partial — that is normal. Calibration may be needed at
              reveal.
            </div>
          ) : null}

          <div className="flex w-full flex-col gap-2 bg-surface-container-lowest p-2 sm:p-3">
        {[1, 2, 3, 4, 5].map((level) => {
          const groupsAt = groupsByLevel.get(level) ?? [];
          const rub = competency.levels.find((l) => l.number === level);
          const emphasize = score.baseLevel === level;
          const levelLabel = rub ? rub.label : `L${level}`;
          const levelOpen = levelPanelsOpen[level] ?? true;
          return (
            <div
              key={level}
              className={`flex w-full flex-col overflow-hidden rounded-xl border border-outline-variant/15 ${
                emphasize
                  ? "bg-surface-container-high"
                  : "bg-surface-container/50"
              }`}
            >
              <div
                className={`flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4 ${
                  levelOpen
                    ? "border-b border-outline-variant/15"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    aria-expanded={levelOpen}
                    aria-label={
                      levelOpen
                        ? `Collapse ${levelLabel}`
                        : `Expand ${levelLabel}`
                    }
                    onClick={() =>
                      setLevelPanelsOpen((prev) => ({
                        ...prev,
                        [level]: !levelOpen,
                      }))
                    }
                    className="flex shrink-0 items-center justify-center rounded-lg border border-outline-variant/20 p-1 text-on-surface-variant transition-colors hover:border-primary/30 hover:bg-surface-bright hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl leading-none">
                      {levelOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.12em] sm:text-[11px] ${
                      emphasize
                        ? "text-primary"
                        : "text-on-surface"
                    }`}
                  >
                    {levelLabel}
                  </span>
                </div>
                {!levelOpen ? (
                  <div
                    className="flex flex-wrap items-center gap-2 sm:gap-2.5"
                    role="group"
                    aria-label={`${levelLabel} criteria summary`}
                  >
                    {groupsAt.length === 0 ? (
                      <span className="text-[10px] text-on-surface-variant/60">
                        —
                      </span>
                    ) : (
                      groupsAt.map((group, pointIndex) => (
                        <LevelSummaryPointChip
                          key={group.parent.id}
                          met={parentCheckpointMet(group, checked)}
                          pointIndex={pointIndex}
                        />
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              {levelOpen ? (
              <div className="space-y-2 p-3 sm:p-4">
                {groupsAt.map((group) => {
                  const hasNested = group.nested.length > 0;
                  const parentOn = parentCheckpointMet(group, checked);
                  const anyNestedOn =
                    hasNested &&
                    group.nested.some((n) => checked.has(n.id));
                  const cardClass =
                    parentOn
                      ? "border-primary/35 bg-primary/[0.06]"
                      : anyNestedOn
                        ? "border-outline-variant/25 bg-surface-container-high/40"
                        : "border-outline-variant/10 bg-surface-container";

                  const toggleParent = () => {
                    if (readOnly) return;
                    if (hasNested) {
                      const target = !parentOn;
                      const updates: Record<string, boolean> = {
                        [group.parent.id]: target,
                      };
                      for (const n of group.nested) updates[n.id] = target;
                      onSetCheckpoints(competency.id, updates);
                    } else {
                      onSetCheckpoints(competency.id, {
                        [group.parent.id]: !checked.has(group.parent.id),
                      });
                    }
                  };

                  const toggleNested = (nestedId: string, next: boolean) => {
                    const nestedIds = group.nested.map((n) => n.id);
                    const temp = new Set(checked);
                    if (next) temp.add(nestedId);
                    else temp.delete(nestedId);
                    const parentShould = nestedIds.every((id) =>
                      temp.has(id),
                    );
                    onSetCheckpoints(competency.id, {
                      [nestedId]: next,
                      [group.parent.id]: parentShould,
                    });
                  };

                  return (
                    <div
                      key={group.parent.id}
                      className={`overflow-hidden rounded-lg border transition-colors ${cardClass}`}
                    >
                      <label
                        className={`flex cursor-pointer select-none flex-col gap-1 px-3 py-3 text-left text-[11px] transition-colors ${
                          readOnly
                            ? "pointer-events-none opacity-60"
                            : "hover:bg-surface-variant/30"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={parentOn}
                            disabled={readOnly}
                            onChange={toggleParent}
                          />
                          <span
                            className={`material-symbols-outlined shrink-0 text-[16px] ${
                              parentOn
                                ? "fill-on text-primary"
                                : "text-on-surface-variant"
                            }`}
                          >
                            {parentOn ? "check_circle" : "circle"}
                          </span>
                          <span className="font-bold leading-tight text-on-surface">
                            {group.parent.text}
                          </span>
                        </div>
                      </label>
                      {hasNested ? (
                        <div className="border-t border-outline-variant/10 bg-surface-container-lowest/90 px-2 pb-2 pt-1">
                          <div className="ml-2 space-y-0.5">
                            {group.nested.map((n) => {
                              const nOn = checked.has(n.id);
                              return (
                                <label
                                  key={n.id}
                                  className={`flex cursor-pointer select-none items-start gap-2 rounded-md py-1.5 pl-1 pr-1 text-left text-[10px] leading-snug transition-colors ${
                                    nOn
                                      ? "bg-primary/[0.07]"
                                      : "hover:bg-surface-variant/25"
                                  } ${
                                    readOnly
                                      ? "pointer-events-none opacity-60"
                                      : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={nOn}
                                    disabled={readOnly}
                                    onChange={() =>
                                      toggleNested(n.id, !nOn)
                                    }
                                  />
                                  <span
                                    className={`material-symbols-outlined mt-0.5 shrink-0 text-[14px] ${
                                      nOn
                                        ? "fill-on text-primary"
                                        : "text-on-surface-variant"
                                    }`}
                                  >
                                    {nOn ? "check_circle" : "circle"}
                                  </span>
                                  <span className="text-on-surface-variant">
                                    {n.text}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {groupsAt.length === 0 ? (
                  <p className="text-center text-[10px] text-on-surface-variant/60">
                    —
                  </p>
                ) : null}
              </div>
              ) : null}
            </div>
          );
        })}
          </div>

          <div className="grid gap-6 border-t border-outline-variant/10 bg-surface-container-low p-6">
            <label className="flex flex-col gap-2">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                <span className="material-symbols-outlined text-sm">
                  edit_note
                </span>
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
        </div>
      ) : null}
    </section>
  );
}
