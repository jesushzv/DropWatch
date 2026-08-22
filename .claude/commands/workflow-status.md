---
description: "Cross-cutting — where is this project in the lifecycle, and what's the next command?"
---

Report the project's position in the lifecycle. Read-only — change nothing.

## Steps

1. Read `docs/00-status.md`, then verify it against reality — the artifacts on disk outrank the status file if they disagree (and say so if they do):
   - Which artifacts exist and their gate verdicts: validation (GO/PIVOT/KILL/PENDING PROBE), PRD, positioning, architecture, plan (phases complete/total), latest review (APPROVED/NEEDS_FIX), security (PASS/FAIL), ship, launch, last metric review, last retro.
   - `git log --oneline -5` and working-tree state for build progress.
2. Report, briefly:
   - **Stage**: Idea / Validate / Define / Build / Launch-Grow — and what's done vs. pending within it
   - **Open gates or waivers**: anything skipped-on-the-record, pending probes, NEEDS_FIX verdicts
   - **Next command**, with a one-line reason — always end with exactly one recommended action
3. If the status file has drifted from reality, offer to fix it (that's the one write this command may make, with permission).

The lifecycle map lives in `CLAUDE.md` (single source — do not duplicate it here); recommend the next command from that map plus the cadence table in `docs/PLAYBOOK.md` for post-launch periods.
