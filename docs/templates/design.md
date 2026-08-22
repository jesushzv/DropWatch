# Architecture Brief: <product>

- **Date:** — **Stack:** default per `.claude/references/stack.md` (deviations listed below)
- **1–2 pages: only decisions that are expensive to reverse.**

## Data model

Entities, key fields, relationships, row ownership (drives RLS). List or mermaid `erDiagram`.

## System shape (deviations from default stack only)

Background jobs, webhooks, external APIs, real-time, storage, mobile — with failure mode and 10× cost note for each external dependency.

## Decisions (mini-ADRs)

| Decision | Why | Revisit when |
|---|---|---|

(Also appended to `docs/knowledge/decisions.md`.)

## Risk paragraph

The part most likely to be wrong, and how we'd find out early.
