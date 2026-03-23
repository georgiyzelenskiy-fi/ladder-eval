# Project Reference: Evaluation App MVP

## 1. Core Technology Stack
* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Backend/Database:** [Convex](https://convex.dev/) (Real-time sync, TypeScript-first)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

## 2. Competency data (app code)

* **`lib/skill-rubric-common.ts`** — Shared 1–5 level definitions and types (`SkillCompetency`, criteria nesting).
* **`lib/hard-skills-rubric.ts`**, **`lib/soft-skills-rubric.ts`** — Full competency trees for evaluation UI and (later) Convex seeding.
* **Static UI references:** `docs/skill-evaluation.html`, `docs/developer-dashboard.html` — HTML prototypes aligned with [design-document.md §6.2](./design-document.md) patterns; port to App Router components when wiring the live matrix.

## 3. Data Model (Convex Schema)
Defined in `convex/schema.ts`. Convex is schemaless by default, but defining a schema ensures type safety for the MVP.

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| **`sessions`** | State of the current live call | `activeEvaluatorId`, `status` (lobby/active/finished), `managerVerdict` |
| **`users`** | Participants in the call | `name`, `role` (manager/evaluator), `slug` (unique ID for login) |
| **`evaluations`** | The checkbox data | `evaluatorId`, `subjectId`, `criteria` (Object: `{task1: bool, task2: bool}`), `timestamp` |

## 4. API Surface (Convex Functions)

### Queries (Read Data)
* **`getSession`**: Fetches the current state of the room (who is currently evaluating).
* **`listUsers`**: Gets the list of 5 users for the manager to pick from.
* **`getLiveScores`**: Aggregates checkbox progress so the manager sees the "progress bars" in real-time.

### Mutations (Write Data)
* **`joinSession`**: Simple entry point that assigns a name to a user slug.
* **`pickNextEvaluator`**: (Manager Only) Updates `sessions.activeEvaluatorId`.
* **`updateCheckboxes`**: (Evaluator Only) Updates the `criteria` object for the current evaluation.
* **`submitVerdict`**: (Manager Only) Saves the final decision and ends the round.

## 5. MVP "Shortcut" Authentication
To avoid the complexity of Auth0 or NextAuth:
1.  **Manager Access:** Access via a hardcoded environment variable URL (e.g., `yourapp.com/admin-dashboard-7721`).
2.  **User Access:** Manager generates 5 unique slugs (e.g., `/eval/user-1`).
3.  **Persistence:** On first visit, the user enters their name. Store the `userId` in `localStorage`. 
4.  **Security:** For an MVP, we trust users not to swap URLs during the 30-minute call.

## 6. Real-time Logic Flow (The "Convex way")
Instead of `useEffect` and `fetch`, the UI will use the `useQuery` hook:

```typescript
// Inside a React Component
const session = useQuery(api.evaluations.getSession);
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
