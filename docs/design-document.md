# Design Document: DevSync Skill Matrix & Evaluation Platform

**Doc type:** Product / UX / technical design  
**Audience:** Implementers, reviewers, AI agents  
**Related:** [AGENTS.md](../AGENTS.md) (repo entry); [agent-navigation.md](./agent-navigation.md) (doc inventory and topic map).

---

## 1. Project overview

| Field | Detail |
|-------|--------|
| **Purpose** | 360° performance evaluation for a **5-developer** team |
| **Problem solved** | Replaces manual randomized pairing with a structured workflow |
| **Core pattern** | **Prepare-then-Reveal**: evidence-based behavioral criteria + real-time calibration on group calls |
| **Key constraint** | Evaluators prepare privately; calibration happens only after controlled reveal |

---

## 2. User roles and permissions

| Role | Label | Permissions |
|------|--------|-------------|
| **Manager** | Driver | Full visibility of all in-progress data; controls **session state** (Reveal / Lock); finalizes calibrated scores |
| **Developer** | Evaluator | Evaluates **self + 4 assigned peers**; sees own finalized charts; enters rationales and checkbox data |

**Visibility rule (preparation):** Developers must **not** see peer evaluations of themselves or others until the reveal phase.

---

## 3. Prepare-then-reveal workflow (finite state machine)

The application is a **finite state machine** driven by the Manager (Driver).

### 3.1 Phase 1 — Preparation (asynchronous)

- Each Developer completes a matrix for **self** and **4 peers**.
- **Inputs per evaluation:**
  - Checkboxes for skill points (**5 levels per skill**).
  - Manual **Evaluator Mark** (scale **1–5**).
- **Visibility:** No peer or self visibility of others’ inputs during this phase.

### 3.2 Phase 2 — Live evaluation (synchronous, e.g. Zoom)

Manager drives the UI. The MVP uses **two complementary manager surfaces** under the same session FSM (`preparation` → `live` → `finished`):

**A — Control room (`/room/driver`)**  
- **Sequential competency focus:** The manager sets which competency is “in focus” (prev/next/jump/clear). The team walks the matrix **one skill at a time**.  
- Evaluators use **`/eval/[slug]`**; each still sees only **their own** evaluation rows during prep and live. The focused competency is **highlighted**; others are de-emphasized until the manager moves focus.  
- **Active evaluator** (optional) signals whose matrix is “hot” for discussion; it does not change role-based prep secrecy.

**B — Live evaluation (`/room/live-evaluation`)**  
- For a chosen **skill** and **subject**, the manager runs a **peer reveal queue**: reveal order + cursor advance **one evaluator at a time** (Convex: `liveEvalRevealOrder`, `liveEvalRevealCursor`, `session.liveEvalRevealNext`). UI reference: `docs/live-group-evaluation.html`.  
- Peers not yet reached may appear **locked** until the cursor advances; the manager commits **calibration marks** per `(subject, skill)` after discussion (`calibrationMarks`).

**Discussion (both surfaces):** The group calibrates using **UI estimate** (from checkboxes), **evaluator marks** (manual 1–5), and **manager calibration / final mark** as recorded in the app.

**Simultaneous vs sequential peers:** An earlier product sketch described showing **all** peer ratings for the selected cell at once (Planning Poker–style). The implemented **live evaluation** flow is **sequential peer reveal** instead, for structured turn-taking on the call. A later iteration could add an optional **simultaneous** mode for the same `(subject, skill)` if the team wants that anchoring-mitigation variant.

---

## 4. Multi-tiered scoring logic (“Foundation first”)

**Model:** Cumulative scoring aligned with a **Guttman-scale** intuition: lower levels must be satisfied before higher levels count as the “base.”

### 4.1 Definitions

| Symbol | Meaning |
|--------|---------|
| **B** (base score) | Highest level **L** where **100%** of criteria at **L** are met, **and** every level **below L** is also **100%** met |
| **Incomplete foundation** | If Level 1 is **not** 100% met → **B = 0** |
| **S** (spike bonus) | Each criterion met **above** the base level **L** adds marginal weight (example: **+0.1** per checkpoint) |

### 4.2 Formula (UI estimated value)

```
Score = min(5.0, B + (count of checkpoints met above base × 0.1))
```

Use the project’s actual step size if it differs from `0.1`; the doc encodes the **intent**: capped total, foundation-gated base, marginal credit for out-of-sequence strengths.

### 4.3 Worked example

- Level 1: **4/4** met  
- Level 2: **2/4** met (incomplete)  
- Level 4: **4/4** met  

**Base:** **B = 1.0** because Level 2 is incomplete (not 100% met), so the base is Level 1.  
**Spike:** Checkpoints above base: e.g. **2** in L2 + **4** in L4 → **S = 6 × 0.1 = 0.6**  
**UI estimate:** **1.6** (before manager calibration)

**UI flag:** Criteria **two or more rungs** above the highest fully met level are checked while an intermediate rung is still incomplete (e.g. L1 full, L2 partial, L4 met) → show as **“Premature peaks”** / **“Out-of-sequence strengths.”** The rung immediately above the base (e.g. partial L2 after full L1) is **not** flagged — that is expected ladder progress.

---

## 5. Visual specifications

### 5.1 Spider overlay (radar chart)

| Aspect | Specification |
|--------|----------------|
| **Type** | Multi-series radar |
| **Axes** | **5** (Skill 1 … Skill 5) |
| **Series** | One **distinct color** per developer |
| **Manager toggles** | Overlay **self-assessment** (dotted) vs **peer average** (solid) vs **manager final** (bold) |
| **Comparison mode** | All **5** team members at once → **“team shape”** |

### 5.2 Swiss cheese heatmap (criteria level)

| Axis | Content |
|------|---------|
| **X** | All criterion points (e.g. `CR-L1-P1`, `CR-L1-P2`, …) |
| **Y** | **5** developers |
| **Cell** | Binary: **green = met**, **red = gap** |
| **Manager signal** | Column **all red** → candidate **team-wide training** need for that behavior |

---

## 6. Technical architecture (recommendations)

### 6.1 Data schema (conceptual)

- **Competency framework:** JSON tree: `Skill → Level → Criterion`.
- **Authoritative rubric source (MVP):** TypeScript modules under `lib/` — `skill-rubric-common.ts` (shared level scale and types), `hard-skills-rubric.ts`, `soft-skills-rubric.ts`. Serialize or seed Convex from these when persisting the framework.
- **Evaluation entry (fields):** `EvaluationID`, `EvaluatorID`, `SubjectID`, `SkillID`, `CheckedPointsArray`, `ManualMark`, `RationaleText`.

### 6.2 UI patterns

- **Evaluation screen:** Split view — **left:** hierarchical checkbox list with Dreyfus-style descriptors; **right:** sticky rationale + manual mark.
- **Manager dashboard:** “Control room” — roster with per-evaluator status (**Ready / In-progress / Not started**); **Broadcast to team** (or equivalent) to trigger reveal.

---

## 7. Bias mitigation guards

| Guard | Rule |
|-------|------|
| **Discrepancy highlight** | If the absolute gap between **UI estimate** and **Evaluator mark** is **greater than 1.0** → highlight entry for Manager (**e.g. yellow**) |
| **Checkmark gate** | Manual mark **disabled** until **≥ 50%** of criteria for that skill have been **interacted with** (checked or unchecked) → reduces “speed rating” |

---

## 8. Implementation checklist (derived from this doc)

Use as a traceability aid for agents and humans.

- [ ] FSM: preparation vs live; manager-controlled reveal/lock  
- [ ] Role-based visibility (preparation secrecy)  
- [ ] Scoring engine: foundation-first + spike bonus + cap + premature-peak flags  
- [ ] Radar: 5 axes, overlays, 5-developer comparison  
- [ ] Heatmap: criteria × developers, column-all-red insight  
- [ ] Schema: framework JSON + evaluation entries (TS rubrics in `lib/` are the working source until export/seed exists)  
- [ ] UI: split evaluation layout; manager control room + broadcast  
- [ ] Bias guards: discrepancy threshold; 50% interaction before manual mark  
