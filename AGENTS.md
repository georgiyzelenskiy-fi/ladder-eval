# Agent instructions

Guidance for AI coding agents (and humans using the same flow) in this repository.

## Documentation flow (read in this order)

1. **This file** — Repo-wide expectations and pointers only; stay concise.
2. **[`docs/agent-navigation.md`](docs/agent-navigation.md)** — **Documentation hub:** authoritative inventory of files under `docs/`, topic-to-doc routing, glossary, and conventions for growing documentation. **Update it** whenever you add, remove, or rename a doc in `docs/`.
3. **[`docs/design-document.md`](docs/design-document.md)** — Product and design source of truth: roles, prepare-then-reveal FSM, scoring, visuals, schema sketch, bias guards, implementation checklist.

For requirement-heavy work, use the **topic map** in `docs/agent-navigation.md` to jump to the right section of the design document.

## Why not fold everything into this file?

**`AGENTS.md` is inherited as the root entry point** (common convention for agent tooling). The **inventory, topic map, and glossary** belong in **`docs/agent-navigation.md`** so they can grow with many files without bloating the root file or duplicating tables in two places.

**Do not** copy the full doc inventory or topic map here; link to `docs/agent-navigation.md` instead.

## Project summary

**DevSync Skill Matrix & Evaluation Platform** — structured 360° evaluation for a small developer team: asynchronous preparation, manager-driven synchronous reveal/calibration, foundation-first (Guttman-style) scoring with spike bonus, radar and heatmap views. Full detail: `docs/design-document.md`.

## Maintenance rule

Any change that adds or renames documentation under `docs/` must update **`docs/agent-navigation.md`** (inventory row, and topic map row if the new doc is routable by task).
