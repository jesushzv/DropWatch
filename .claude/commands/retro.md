---
description: "Cross-cutting — retrospective that compounds: harvest lessons, validated assumptions, and decisions into the knowledge base"
argument-hint: "[optional: scope, e.g. 'launch week' or 'stage 3'; blank = since last retro]"
---

Run a retrospective. Scope: **$ARGUMENTS** (blank = everything since the last dated entry in `docs/knowledge/lessons.md`).

The knowledge base is the solopreneur's compounding asset: it's what makes idea #5 cheaper than idea #1. A retro that produces vibes instead of reusable entries is wasted; every output lands in a specific file in `docs/knowledge/`.

## Steps

1. **Reconstruct what happened** from the artifacts and git history: status file, phase artifacts, review/security verdicts, plan deviations logged during `/build`, metric reviews.
2. **Harvest into three ledgers:**
   - `docs/knowledge/lessons.md` — dated, tagged entries in the form *situation → what we did → what we'd do differently → rule going forward*. A lesson must be actionable by a future session with no memory of this one; "communicate better" is not a lesson, "always run the Stripe webhook locally with the CLI before deploying webhook changes" is.
   - `docs/knowledge/assumptions.md` — move assumptions to VALIDATED or INVALIDATED with the evidence. Invalidated assumptions are the most valuable entries in the whole system.
   - `docs/knowledge/decisions.md` — any durable decision made ad hoc during the period that isn't recorded yet.
3. **Workflow feedback, kept separate from product feedback:** if a *workflow command itself* fought you (a gate that's always waived, a template section that's always empty), record it under a `## Workflow friction` heading in lessons — but **do not edit the workflow's command files as part of the retro**. Propose the change to the founder; the workflow template only changes deliberately, in its own repo.
4. **Prune:** if any ledger exceeds ~150 lines, consolidate duplicates and promote recurring lessons into a single stronger rule. Recurring 3×+ rules deserve promotion into the project `CLAUDE.md` so they're always in context.
5. Update `docs/00-status.md` with the retro date. Report the 3 most valuable entries harvested.
