# DevSync — Skill Matrix & Evaluation Platform

Structured **360° evaluation** for a small dev team: **prepare-then-reveal** (async prep, manager-driven live calibration), **foundation-first + spike** scoring, and (planned) radar / heatmap views.

**Canonical product & tech docs:** [`docs/design-document.md`](docs/design-document.md) · [`docs/technology.md`](docs/technology.md) · hub: [`docs/agent-navigation.md`](docs/agent-navigation.md). **Agent entry:** [`AGENTS.md`](AGENTS.md).

---

## Stack

- **Next.js** (App Router) · **Convex** (real-time backend) · **Tailwind** · **Vitest** (scoring tests)

---

## Local setup

1. Copy env template and set Convex URL (from `npx convex dev` or the Convex dashboard):

   ```bash
   cp .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_CONVEX_URL` — required for live data and Convex hooks.
   - `MANAGER_ACCESS_KEY` (optional) — if set, open manager UIs with `?k=<value>` (e.g. `/manage`, `/room/driver`, `/room/live-evaluation`; Next.js gate; Convex manager mutations also check the key when set).

2. **Terminal A — Convex**

   ```bash
   npm run convex:dev
   ```

3. **Terminal B — Next.js**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Other commands: `npm test` (Vitest), `npm run lint`, `npm run build`.

---

## Evaluation session flow (MVP)

Sessions are keyed by a **session slug** (human-readable). The built-in **`default`** slug is used when no `?session=` is present on evaluator/room URLs; additional rounds use Team setup + `?session=<slug>` on shared links.

| Step | Who | Action |
|------|-----|--------|
| 1 | Manager | Open **`/manage`**, create or open a session, add people (or bulk via `users.seedRoster` from custom tooling). Copy each evaluator’s URL from Team setup. |
| 2 | Manager | Drive **phase** from **`/room/driver`** (preparation → live → verdict), **active evaluator**, **submit verdict** when done; use **`/room/live-evaluation`** for peer reveal + calibration. |
| 3 | Each participant | Open their copied **`/eval/<slug>`** link (with **`?session=…`** if not `default`). **Continue** binds this browser via `localStorage` to their Convex `users` row. |

**Convex surface (high level):** `session.*` (bootstrap, phase, active evaluator, live skill focus, live-eval wizard, verdict), `users.*` (roster, join, seed), `evaluations.*` (checkboxes, prep-safe list, live aggregates), `liveEvaluation.*` (manager bundle + calibration marks). Schema: [`convex/schema.ts`](convex/schema.ts).

**Conceptual model:** Evaluators write **per–(subject × skill)** rows in `evaluations` (checkboxes, optional manual mark + rationale). During **preparation**, each client only loads **their own** evaluator rows (`listEvaluationsForEvaluator`). The manager uses **`/manage`** for roster + links, **`/room/driver`** for session FSM + prep aggregates, **`/room/live-evaluation`** for peer-reveal queue + calibration marks, and optional **`MANAGER_ACCESS_KEY`** + `?k=` when set. Product source of truth + checklist: [`docs/design-document.md`](docs/design-document.md); **session slug + `?session=`** rationale: [**§6.3**](docs/design-document.md#63-session-identity-and-shareable-urls).

---

## Routes

| Path | Purpose |
|------|---------|
| `/` | Setup hints + links to Team setup and room routes |
| `/manage` | Manager Team setup: session slug, roster, copy evaluator URLs (optional `?k=` if `MANAGER_ACCESS_KEY` is set) |
| `/room/driver` | Manager control room (requires `NEXT_PUBLIC_CONVEX_URL`; optional `?session=` + `?k=`) |
| `/room/live-evaluation` | Manager live calibration UI (same env + optional `?session=` + `?k=`); HTML reference: [`docs/live-group-evaluation.html`](docs/live-group-evaluation.html) |
| `/eval/[slug]` | Evaluator join + full skill matrix (`EvaluatorMatrix` → `evaluations.updateCheckboxes`); optional `?session=` |

---

## Repo map (implementation status)

| Area | Location | Notes |
|------|----------|--------|
| Rubrics | `lib/hard-skills-rubric.ts`, `lib/soft-skills-rubric.ts`, `lib/skill-rubric-common.ts` | Level 1–5 criteria trees |
| Checkpoints & scoring | `lib/skill-checkpoints.ts`, `lib/scoring.ts`, `lib/scoring.test.ts` | Stable IDs + foundation-first UI estimate |
| Convex API | `convex/` | Schema + session / users / evaluations / liveEvaluation |
| Manager UI | `app/manage/`, `app/room/driver/`, `app/room/live-evaluation/` | Team setup + roster links; FSM + aggregates; live peer queue + calibration |
| Evaluator join | `app/eval/[slug]/` | Join + matrix; prep privacy via Convex query filter |
| UI prototypes | `docs/skill-evaluation.html`, `docs/developer-dashboard.html`, `docs/live-group-evaluation.html` | HTML reference; App Router ports for matrix + live eval |

**Next up (see design checklist §8):** radar / heatmap; bias guards (discrepancy highlight, 50% interaction before manual mark); optional Convex hardening beyond MVP trust model — snapshot: [`docs/temp/2026-03-24T092200Z-audit.md`](docs/temp/2026-03-24T092200Z-audit.md).

---

## Flow tracking (optional)

Local-only planning doc (not committed): `.flow-history/2026-03-23-NOJIRA-root.md` — NOJIRA root implementation plan for this repo.

---

## Deploy

Convex project + env vars on the host (e.g. Vercel) must match; run `npx convex deploy` as needed. See [`docs/technology.md`](docs/technology.md) for milestones and commands.
