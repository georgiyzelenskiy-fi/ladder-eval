# Agent navigation — `docs/`

**Relationship to repo root:** Read **[`../AGENTS.md`](../AGENTS.md)** first. That file defines the overall agent flow; **this file** is the **documentation hub** inside `docs/` (inventory, routing, glossary). Functionality is **not** duplicated in `AGENTS.md` on purpose: the catalog lives here and can grow without bloating the root.

**Purpose:** Find documentation by topic, register new files, and keep conventions consistent as `docs/` grows.

**Rule for maintainers:** When you add or rename a doc under `docs/`, update **§ Inventory** and, if needed, **§ Topic map** below (same change as the new doc).

---

## How agents should use this file

1. **Start here** before deep work that depends on product or process context.
2. **Open the linked doc** that matches the task (overview vs scoring vs UI, etc.).
3. **Cross-check** the design doc **§ Implementation checklist** against code when implementing or reviewing.
4. If a topic is missing, **search `docs/`** and then **add an entry** to the inventory (same PR as the new doc).

---

## Inventory (authoritative list)

| Doc | One-line scope | Primary topics |
|-----|----------------|----------------|
| [design-document.md](./design-document.md) | Product, workflow, scoring, visuals, schema sketch, bias guards | FSM prepare/reveal, roles, Guttman-style scoring, radar + heatmap, data fields, UI patterns |
| [technology.md](./technology.md) | MVP stack (Next.js, Convex, Tailwind, Vercel), Convex schema/API sketch, auth shortcut, milestones | Convex tables, queries/mutations, real-time hooks, deployment |
| [DESIGN.md](./DESIGN.md) | Editorial dark UI strategy (“Precision Architect”): material-style surfaces, no-line layout rule, typography, elevation, buttons/charts/cards | Tailwind/M3-like tokens, glass/gradient CTAs, radar/line viz rules, asymmetry, do/don’t |
| [cyber_metric_dark_design_system.md](./cyber_metric_dark_design_system.md) | DevSync V1 implementation palette: hex tokens, layout shell (nav, content), product patterns (heatmap, radar, Dreyfus checkboxes), motion & gating notes | Colors, Inter/Roboto Mono, Tailwind + Material Symbols, bias-mitigation UI states |
| [skill-evaluation.html](./skill-evaluation.html) | Static HTML prototype: per-skill evaluation (level rubric, criteria checkboxes, rationale, manual mark) | Evaluator matrix UI, Dreyfus-style descriptors, split-pane layout |
| [developer-dashboard.html](./developer-dashboard.html) | Static HTML prototype: developer-facing dashboard (summary, competency grid, trends placeholder) | Post-eval read-only views, radar-style summary strip |
| [live-group-evaluation.html](./live-group-evaluation.html) | Static HTML prototype: manager live calibration (skill tabs, subject header, sequential peer reveal queue, final calibration, rationale modal) | Live evaluation route UX (`/room/live-evaluation`), matrix + popover patterns |

*Add new rows above this line when new docs appear.*

---

## Topic map (quick routing)

| If the task involves… | Read first |
|-------------------------|------------|
| Overall product intent, team size, prepare-then-reveal | [design-document.md §1–3](./design-document.md) |
| Scoring math, base/spike, examples, flags | [design-document.md §4](./design-document.md) |
| Radar, heatmap, manager toggles | [design-document.md §5](./design-document.md) |
| JSON framework, evaluation record shape, screen layout | [design-document.md §6](./design-document.md) |
| Discrepancy highlight, manual-mark gating | [design-document.md §7](./design-document.md) |
| Trace requirements to implementation | [design-document.md §8](./design-document.md) |
| Stack choice, Convex schema/functions, MVP auth, build/deploy commands | [technology.md](./technology.md) |
| Preset team roster (Burger), evaluator slugs / seeding | [technology.md §2](./technology.md) · `lib/roster-presets/burger.ts` |
| Visual language, surface hierarchy, “no-line” layout, editorial density, chart line weights | [DESIGN.md](./DESIGN.md) |
| Concrete hex/theme, app shell dimensions, heatmap/radar/checkbox styling, Tailwind/Material Symbols for build | [cyber_metric_dark_design_system.md](./cyber_metric_dark_design_system.md) |
| Evaluator skill matrix UI (checkbox tree, manual mark, rationale) — reference implementation | [skill-evaluation.html](./skill-evaluation.html) |
| Developer results dashboard layout — reference implementation | [developer-dashboard.html](./developer-dashboard.html) |
| Manager live evaluation (peer reveal queue, calibration matrix) — reference HTML | [live-group-evaluation.html](./live-group-evaluation.html) · App: `/room/live-evaluation` |
| TypeScript competency definitions (hard/soft, shared level scale) | Repo `lib/skill-rubric-common.ts`, `lib/hard-skills-rubric.ts`, `lib/soft-skills-rubric.ts` |

---

## Conventions for growing this tree

- **File names:** `kebab-case.md`; prefer **one main concept per file** once `design-document.md` would exceed ~400–500 lines — then split (e.g. `scoring-spec.md`, `ui-spec.md`) and link from here.
- **Anchors:** GitHub/Cursor-friendly headings use `#` / `##`; deep links use slugified anchors (e.g. `#4-multi-tiered-scoring-logic-foundation-first`).
- **Doc headers:** Top of each doc should state **doc type**, **audience**, and **link back** to this navigation file.
- **Duplicates:** Do not copy full requirements into multiple files; **link** to the canonical section instead.

---

## Glossary (terms used across docs)

| Term | Meaning |
|------|---------|
| **Driver** | Manager role; controls session state and reveal |
| **Evaluator** | Developer; fills matrix for self + peers |
| **UI estimate** | Score computed from checkboxes (foundation + spikes) |
| **Evaluator mark** | Manual 1–5 from evaluator |
| **Manager final mark** | Post-calibration authoritative score |
| **Premature peak / out-of-sequence strength** | Criteria met **two+ rungs** above the fully met base while a rung in between is incomplete (immediate next rung may be partial without flag) |
