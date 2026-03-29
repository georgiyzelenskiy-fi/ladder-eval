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
| **Non-manager UX** | **Done:** `/room/live-evaluation` hides manager controls; read-only skill tabs, subject line, reveal progress + “next”; **Your row is next** when this browser’s joined `/eval` user matches the next queue id; links to control room + matrix; calibration sidebar is read-only status. |
| **Hard vs soft grouping** | Support sessions that evaluate **only hard skills** or **only soft skills**: group competencies in the UI/session config so the matrix and live-eval tabs match the intended scope without scrolling past irrelevant blocks. |

---

## 2. Evaluation view (`/eval/[slug]`)

| Item | Notes |
|------|--------|
| **Subject switcher always reachable** | Changing **who** you evaluate today requires scrolling back to the subject control. Keep subject selection **sticky** or in a persistent header/sheet so it stays one tap away anywhere in the matrix. |
| **Live session awareness** | When a **live evaluation** is active (driver focus or live-eval wizard), the matrix should **emphasize** the competency (and context) the group is reviewing and **on load** scroll or focus that region so evaluators land in the right place. |
| **First-time complexity** | Overall look is acceptable; the full matrix can feel **overwhelming** at first. Add **progressive disclosure**: e.g. collapsed skill groups, a short guided first visit, “start here” for one subject, or a compact vs expanded mode. |

---

## 3. Authentication & access

| Item | Notes |
|------|--------|
| **Beyond slug URLs** | Slugs + `localStorage` worked for MVP. Next iteration: stronger identity (magic link, SSO, or team invite tokens), optional accounts, and clearer **session ↔ user** binding without sharing opaque paths. |

---

## 4. Manager surfaces

| Item | Notes |
|------|--------|
| **Manager controls revamp** | Revisit **driver** (`/room/driver`) and **live evaluation** layouts: denser status, fewer context switches, and alignment between “competency focus” vs “live-eval subject/skill” so the mental model is obvious on a long call. |

---

## 5. Personal overview (was MVP-deferred)

| Item | Notes |
|------|--------|
| **Heatmap + spider (radar) chart** | Per design doc §5: personal and team views with **heatmap** (criteria × people) and **radar** comparison. Still required for closing the feedback loop after calibration. |

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
| Non-manager UI | `LiveEvaluationClient.tsx`, `lib/devsync-browser.ts` (`useJoinedEvaluatorSessionHints`), room layout |
| Skill grouping / session scope | `lib/*-skills-rubric.ts`, matrix competency list assembly, optional `sessions` fields |
| Eval sticky subject + live emphasis | `EvaluatorMatrix.tsx` (or equivalent), `session.activeRevealSkillId` / live-eval bundle subscription |
| Auth | `convex/users.ts`, join flows, env secrets, future IdP |
| Charts | new route or `developer-dashboard` evolution, `lib/scoring.ts` aggregates |

When implementing, update this doc (check off or split into tickets) so the backlog stays honest.
