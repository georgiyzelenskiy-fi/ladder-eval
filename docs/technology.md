# Project Reference: Evaluation App MVP

## 1. Core Technology Stack
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Backend/Database:** [Convex](https://convex.dev/) (Real-time sync, TypeScript-first)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

## 2. Competency data (app code)

* **`lib/skill-rubric-common.ts`** — Shared 1–5 level definitions and types (`SkillCompetency`, criteria nesting).
* **`lib/hard-skills-rubric.ts`**, **`lib/soft-skills-rubric.ts`** — Full competency trees for evaluation UI and (later) Convex seeding.
* **`lib/roster-presets/burger.ts`** — Emplifi “Burger” team: manager + five evaluators (slugs, display names, emails for invites). Drives `users.seedRoster` from the manager UI.
* **`lib/skill-checkpoints.ts`** — Deterministic checkpoint IDs per competency (`competencyToCheckpoints`).
* **`lib/scoring.ts`** — Foundation-first + spike UI estimate (`computeFoundationFirstUiEstimate`); covered by `npm test`.
* **Static UI references:** `docs/skill-evaluation.html`, `docs/developer-dashboard.html`, `docs/live-group-evaluation.html` — HTML prototypes aligned with [design-document.md §6.2](./design-document.md) patterns; port to App Router components when wiring the live matrix.

## 3. Data Model (Convex Schema)
Defined in `convex/schema.ts`. Convex is schemaless by default, but defining a schema ensures type safety for the MVP.

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| **`sessions`** | Prepare-then-reveal FSM for one room | `slug` (e.g. `default`), `phase` (`preparation` / `live` / `finished`), `activeEvaluatorId`, `activeRevealSkillId`, `managerVerdict`; plus **live evaluation wizard** fields `liveEvalSkillId`, `liveEvalSubjectId`, `liveEvalRevealOrder`, `liveEvalRevealCursor` (independent of `activeRevealSkillId`) |
| **`users`** | Participants in the room | `sessionId`, `name`, `role` (manager/evaluator), `slug` (unique per session) |
| **`evaluations`** | Per skill matrix cell | `evaluatorId`, `subjectId`, `skillId`, `checkpoints` (record of checkpoint id → checked), `manualMark`, `rationale`, `updatedAt` |
| **`calibrationMarks`** | Manager committed mark after live peer reveal | `sessionId`, `subjectId`, `skillId`, `mark`, `updatedAt` |

## 4. API Surface (Convex Functions)

Modules: `convex/session.ts`, `convex/users.ts`, `convex/evaluations.ts`, `convex/liveEvaluation.ts` (paths become `api.session.*`, `api.users.*`, `api.evaluations.*`, `api.liveEvaluation.*`).

### Queries (Read Data)
* **`session.getSession`**: Fetches session row by `slug` (default `default`).
* **`users.listUsers`**: Lists users for a `sessionId`.
* **`evaluations.getLiveScores`**: Returns evaluation rows plus a coarse per-subject checkpoint summary for manager “progress” views.
* **`evaluations.listEvaluationsForSession`**: Raw rows for a session (e.g. custom aggregations).
* **`liveEvaluation.getLiveEvalBundle`**: Session live-eval slice, roster, evaluations, and `calibrationMarks` for the manager live-evaluation UI.

### Mutations (Write Data)
* **`session.ensureSession`**: Creates the session row for a slug if missing (bootstrap).
* **`session.setSessionPhase`**: Manager FSM: `preparation` → `live` → `finished`.
* **`users.joinSession`**: Assigns or updates `name` / `role` for a slug in a session.
* **`session.pickNextEvaluator`**: (Manager) Sets `sessions.activeEvaluatorId`.
* **`session.setActiveRevealSkill`**: (Manager, live phase) Sets or clears `sessions.activeRevealSkillId` for sequential competency reveal; evaluators highlight that matrix block.
* **`evaluations.updateCheckboxes`**: Merges checkpoint toggles; optional `manualMark` and `rationale` (design doc §6.1).
* **`session.submitVerdict`**: (Manager) Saves verdict and sets phase `finished`.
* **`session.setLiveEvalSkill`**, **`session.setLiveEvalSubject`**, **`session.shuffleLiveEvalOrder`**, **`session.randomizeLiveEvalSubject`**, **`session.liveEvalRevealNext`**, **`session.resetLiveEvalReveal`**: (Manager) Live evaluation wizard state on `sessions` (peer reveal queue).
* **`liveEvaluation.upsertCalibrationMark`**: (Manager) Writes per `(subjectId, skillId)` calibration mark.

## 5. MVP "Shortcut" Authentication
To avoid the complexity of Auth0 or NextAuth:
1.  **Manager access:** Control room at **`/room/driver`**; live evaluation at **`/room/live-evaluation`** (same optional **`MANAGER_ACCESS_KEY`** gate via **`?k=…`**). See `.env.local.example`.
2.  **Evaluator access:** One URL per participant, e.g. **`/eval/dev-1`** — swap the last segment for each slug the manager hands out.
3.  **Persistence:** On first visit, the evaluator enters their name; Convex `users.joinSession` runs and the returned **`userId`** is stored in **`localStorage`** (key includes session slug + evaluator slug; see `lib/devsync-constants.ts`).
4.  **Security:** For an MVP, we trust users not to swap URLs during the 30-minute call.

## 6. Real-time Logic Flow (The "Convex way")
Instead of `useEffect` and `fetch`, the UI will use the `useQuery` hook:

```typescript
// Inside a React Component
const session = useQuery(api.session.getSession, {});
const updateScore = useMutation(api.evaluations.updateCheckboxes);

// If the manager changes the evaluator in the DB, 
// this component re-renders automatically for ALL users.
if (session.activeEvaluatorId === currentUser.id) {
  return <EvaluationForm onCheck={updateScore} />;
}
```

## 7. Implementation Milestones
1.  **Phase 1:** Set up Next.js + Convex provider. Define schema.
2.  **Phase 2:** Build "Manager Control Panel" (Buttons to toggle which user is "Active").
3.  **Phase 3:** Build "User Dashboard" (Checkbox list that only appears when user is "Active").
4.  **Phase 4:** Manager "Verdict" view (Seeing live checkbox counts).
5.  **Phase 5:** Deploy to Vercel and run a test call.

## 8. Useful Commands
* `npx convex dev` (Runs the backend in sync with your local code)
* `npx convex dashboard` (To manually edit data or see live evaluations)
