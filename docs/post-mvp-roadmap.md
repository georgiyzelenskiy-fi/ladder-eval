# Post-MVP roadmap & product feedback

**Doc type:** Backlog / stakeholder feedback (post-MVP)  
**Audience:** Implementers, future you, AI agents  
**Related:** [design-document.md](./design-document.md), [technology.md](./technology.md), [agent-navigation.md](./agent-navigation.md).

**Context:** MVP phase is **closed** (battle-tested successfully). Items below are prioritized **themes**, not a committed sequence.

---

## 1. Live evaluation flow (`/room/live-evaluation`)

| Item | Notes |
|------|--------|
| **Self in peer reveal** | **Done:** reveal order is all evaluators by slug (`computePeerRevealOrder`), including the subject’s self row; UI labels self in the queue. |
| **Non-manager UX** | **Partial:** Registered evaluators (same **`localStorage`** as **`/eval/[slug]`**) can open live calibration **without `?k=`** when the manager key gate is on; they see **Follow the session** plus read-only skill label, queue progress, and reveal cards (no subject shuffle / reveal-next / calibration writes). **Still improve:** tighter chrome, “your turn” hints, deep links. |
| **Hard vs soft grouping** | Support sessions that evaluate **only hard skills** or **only soft skills**: group competencies in the UI/session config so the matrix and live-eval tabs match the intended scope without scrolling past irrelevant blocks. |

---

## 2. Evaluation view (`/eval/[slug]`)

| Item | Notes |
|------|--------|
| **Subject switcher always reachable** | **Partial (2026-03):** Subject `<select>` in sticky `EvalWorkspaceShell` header (`EvalMatrixChromeContext`); initial option seeded once from `liveEvalSubjectId` (or first roster); evaluator can change anytime; manager updates do not override. |
| **Live session awareness** | **Partial (2026-03):** Live-phase dim + ring on `activeRevealSkillId` ?? `liveEvalSkillId`; **one-time** scroll to that block on matrix load (not on later manager skill changes); focused block stays collapsible. |
| **First-time complexity** | **Partial (2026-03):** `SkillBlock` uses **per-level progressive disclosure** — levels L1–L5 are a full-width column; each level collapses to a header-only row with **read-only** top-level criterion summary (aligned with expanded parent `check_circle` / `circle` icons). **Still improve:** guided first visit, “start here” for one subject, compact vs expanded mode for whole matrix, other skill-group patterns. |

---

## 3. Authentication & access

| Item | Notes |
|------|--------|
| **Beyond slug URLs** | Slugs + `localStorage` worked for MVP. **Session ↔ round** binding for multiple concurrent rounds: **`?session=<session-slug>`** + Team setup (`/manage`) — product intent in [design-document.md §6.3](./design-document.md). Next iteration: stronger identity (magic link, SSO, or team invite tokens), optional accounts, and clearer binding without sharing paths. |

---

## 4. Manager surfaces

| Item | Notes |
|------|--------|
| **Manager controls revamp** | Revisit **driver** (`/room/driver`) and **live evaluation** layouts: denser status, fewer context switches, and alignment between “competency focus” vs “live-eval subject/skill” so the mental model is obvious on a long call. |

---

## 5. Personal overview (was MVP-deferred)

| Item | Notes |
|------|--------|
| **Heatmap + spider (radar) chart** | **Partial (2026-03):** per-subject **shareable** route **`/insights/[users.slug]`** (`?session=` when not default) — multi-evaluator **radar** (hard/soft five-skill switch, UI vs manual toggles) + **10-skill heatmap**, skill **modal** with checkpoint grid; **`insights.getSubjectInsightsBundle`** + phase/manager gates. Team-wide comparison view still optional later. |

---

## 6. Additional ideas (optional)

- **Simultaneous peer mode** for one `(subject, skill)` as an alternative to strict sequential reveal (already noted in [design-document.md §3.2](./design-document.md)).
- **Bias guards** from design §7 (discrepancy highlight, manual-mark interaction gate)—partially or not wired; finish and surface in manager UIs.
- **Calibration history / audit**: lightweight log of committed calibration marks (who changed what, when) for retro and trust.
- **Exports**: one-page PDF or CSV for HR/archival without full app access.
- **Prep nudges**: optional reminders when phase is still preparation and coverage is low.
- **Responsive / narrow layout** pass on the matrix (tablet standups).

---

## 7. Traceability (code pointers)

| Theme | Likely touchpoints |
|-------|-------------------|
| Live peer order + self | `lib/live-eval-session.ts` (`computePeerRevealOrder`), `convex/session.ts` (`defaultLiveEvalRevealOrder`, `setLiveEvalSubject`, `randomizeLiveEvalSubject`), `LiveEvaluationClient.tsx` |
| Non-manager UI | `LiveEvaluationClient.tsx`, `canManage` / `useRegisteredEvaluatorId`, room layout |
| Skill grouping / session scope | `lib/*-skills-rubric.ts`, matrix competency list assembly, optional `sessions` fields |
| Eval sticky subject + live emphasis | `EvaluatorMatrix.tsx` (or equivalent), `session.activeRevealSkillId` / live-eval bundle subscription |
| SkillBlock level panels (collapse + summary) | `components/eval/SkillBlock.tsx` (`parentCheckpointMet`, per-level open state) |
| Auth | `convex/users.ts`, join flows, env secrets, future IdP |
| Charts | `app/insights/[subjectSlug]/`, `lib/subject-insights-pivot.ts`, Recharts radar chunk, `convex/insights.ts` |

When implementing, update this doc (check off or split into tickets) so the backlog stays honest.
