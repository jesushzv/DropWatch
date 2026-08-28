---
description: "Stage 3 — production-readiness review: code-reviewer + adversary in parallel, scoped fix loop, binary verdict"
argument-hint: "[optional: scope, e.g. 'phase 3' or a path — blank reviews all uncommitted + unreviewed work]"
---

Run the review gate. Scope: **$ARGUMENTS** (blank = everything since the last APPROVED review, per `docs/00-status.md`).

## Steps

1. Determine the diff under review (`git diff` / commits since last review) and the plan context (`docs/engineering/02-plan.md`).
2. **Dispatch in parallel** (single message, two Agent calls):
   - `code-reviewer` — correctness, tests, prohibited behaviors, plan conformance
   - `adversary` — hostile pass on the same diff, hunting what a friendly review misses
3. **Merge verdicts.** Blocking = code-reviewer's BLOCKING list + adversary's kill shots and cracks that affect correctness or user harm. Adversary nitpicks are logged, not blocking.
4. **Scoped fix loop** (max 3 iterations):
   - Fix only the blocking findings — smallest change that truly fixes the root cause, no opportunistic refactors mid-review.
   - Re-dispatch **only the reviewer whose findings you fixed**, scoped to those findings.
   - The recovery protocol in `.claude/references/prohibited-behaviors.md` applies if a fix is tempted to weaken a test.
5. After 3 iterations still NEEDS_FIX → stop, write the sticking points to `docs/00-status.md`, and put the decision to the founder. Never grind a fourth loop or quietly downgrade a finding.
6. **Record** the final verdict, findings summary, and evidence in `docs/engineering/03-review.md` (append a dated section per review run), update `docs/00-status.md`.

**Gate:** `/ship` requires the latest review verdict to be APPROVED. Next after approval: `/security-check`.
