---
description: "Stage 4 — re-runnable competitor & pricing snapshot; reports only material changes since last run"
argument-hint: "[optional: competitor to add/drop, or 'baseline' for the first run]"
---

Run a competitor watch pass. Notes: **$ARGUMENTS**

Re-runnable and **diffable**: each run appends a dated snapshot to `docs/launch/03-competitor-watch.md` and reports only what materially changed since the previous snapshot. Research protocol applies — pricing and feature claims are [FACT]s with dated sources or they don't go in the table.

## Steps

1. **Load the roster** from the last snapshot in `docs/launch/03-competitor-watch.md`; on first run (`baseline`), seed it from the competitor scan in `docs/product/01-validation.md`. Apply any add/drop from the arguments.
2. **Snapshot each competitor** — dispatch the `research-analyst` agent (fan out in parallel, one per competitor for large rosters): pricing page (tiers + numbers), notable new features or product announcements, positioning headline on their homepage, any traction signals that surface cheaply (launch posts, funding news). The agent's labeling and dating discipline is the point — snapshots are only diffable if every entry is sourced the same way.
3. **Diff against the previous snapshot.** Material = pricing changed, a tier added/removed, a feature shipped that closes *our* differentiating gap, positioning shifted toward our territory, a new entrant worth adding. Cosmetic homepage rewording is not material.
4. **Append the dated snapshot section** (full table — so the file stays a time series) with a `### Changes since last run` block at the top: material changes only, each with its implication for us ("closes gap X — our differentiator is now only Y").
5. **Escalate if warranted:** a change that undermines the positioning statement or pricing gets flagged as a recommendation to revisit `docs/product/03-positioning.md` — noted in `docs/00-status.md`, not auto-applied.
6. If nothing material changed, say exactly that in one line and stop. A quiet run is a valid result; padding it is PB-8.

## Scheduling

This command is built to run unattended on a cadence (e.g. monthly). In Claude Code: `claude -p "/watch-competitors"` from cron, a scheduled Routine, or a desktop scheduled task. Success = the snapshot appended and material changes (or "none") reported; the command never needs to ask questions mid-run.
