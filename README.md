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
   - `MANAGER_ACCESS_KEY` (optional) — if set, open the control room as `/room/driver?k=<value>` (server-side check only).

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

Single canonical session slug: **`default`** (`lib/devsync-constants.ts`). Everyone shares the same Convex session.

| Step | Who | Action |
|------|-----|--------|
| 1 | Manager | Open **`/room/driver`**, click **Seed “Burger” team** once (idempotent). Sets roster + session title `Burger`. |
| 2 | Manager | Drive **phase** (preparation → live → verdict), **active evaluator**, and **submit verdict** when done. |
| 3 | Each participant | Open their **`/eval/<slug>`** link from the home page (or construct it). **Continue** binds this browser via `localStorage` to their Convex `users` row. |

**Burger preset** (names, emails for invites, URL slugs): [`lib/roster-presets/burger.ts`](lib/roster-presets/burger.ts). Evaluator slugs include `adrien-rouaix`, `daniil-belov`, `david-veltzer`, `georgiy-zelenskiy`, `julien-baron`; manager join link uses `honza-sroubek`.

**Convex surface (high level):** `session.*` (session bootstrap, phase, active evaluator, verdict), `users.*` (roster, join, seed), `evaluations.*` (checkboxes, live aggregates). Schema: [`convex/schema.ts`](convex/schema.ts).

---

## Routes

| Path | Purpose |
|------|---------|
| `/` | Setup hints + deep links to control room and Burger eval URLs |
| `/room/driver` | Manager control room (requires `NEXT_PUBLIC_CONVEX_URL`) |
| `/eval/[slug]` | Evaluator join + (soon) matrix UI |

---

## Repo map (implementation status)

| Area | Location | Notes |
|------|----------|--------|
| Rubrics | `lib/hard-skills-rubric.ts`, `lib/soft-skills-rubric.ts`, `lib/skill-rubric-common.ts` | Level 1–5 criteria trees |
| Checkpoints & scoring | `lib/skill-checkpoints.ts`, `lib/scoring.ts`, `lib/scoring.test.ts` | Stable IDs + foundation-first UI estimate |
| Convex API | `convex/` | Schema + session / users / evaluations modules |
| Manager UI | `app/room/driver/` | FSM + seed + roster + aggregates |
| Evaluator join | `app/eval/[slug]/` | Join + pre-filled names when roster is seeded |
| UI prototypes | `docs/skill-evaluation.html`, `docs/developer-dashboard.html` | Reference for upcoming App Router port |

**Next up (see design checklist §8):** evaluator matrix wired to `evaluations.updateCheckboxes` + scoring; prep vs live visibility; radar / heatmap; bias guards.

---

## Flow tracking (optional)

Local-only planning doc (not committed): `.flow-history/2026-03-23-NOJIRA-root.md` — NOJIRA root implementation plan for this repo.

---

## Deploy

Convex project + env vars on the host (e.g. Vercel) must match; run `npx convex deploy` as needed. See [`docs/technology.md`](docs/technology.md) for milestones and commands.
