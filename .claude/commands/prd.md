---
description: "Stage 2 — write the one-page PRD: problem, users, solution, scope, success metrics"
argument-hint: "[optional: notes on scope or constraints]"
---

Write the PRD for this project. Founder notes: **$ARGUMENTS**

**Precondition:** `docs/product/01-validation.md` exists with verdict GO. If it doesn't, stop and say which command to run first (PB-9 in `.claude/references/prohibited-behaviors.md`). If the founder explicitly waives validation, record the waiver in `docs/00-status.md` and proceed — their call, but it goes on the record.

## Rules

- **One page.** This is a solo shop; the PRD is a thinking tool, not a contract with a committee. If it doesn't fit on a page, the scope is too big for a first release.
- Anchor everything in the validation artifact — the target user, the job-to-be-done, and the competitor gap come from there, not from scratch. Cite it.
- Check `docs/knowledge/` for lessons and decisions that constrain scope (research protocol step 2).

## Steps

1. **Draft** `docs/product/02-prd.md` from `docs/templates/prd.md`:
   - Problem & target user (from validation, sharpened)
   - The v1 promise — one sentence a user would understand ("X for Y that does Z")
   - User stories for the core loop only, in "As a … I want … so that …" form, each with 1–3 testable acceptance criteria
   - **Out of scope** — the explicit not-now list; this section earns its length even when the rest must stay short
   - Success metrics: one activation metric, one retention metric, one revenue metric, each with a target and the PostHog event that measures it
   - Riskiest product assumption carried forward from validation
2. **Scope-check hard.** Everything in v1 must serve the core loop: a user arrives → experiences the promised value → has a reason to return/pay. Move everything else to Out of scope. When in doubt, cut — v1.1 exists.
3. **Adversary gate.** Dispatch the `adversary` agent on the draft: contradictions, unfalsifiable metrics, "must haves" nobody asked for, missing unhappy paths. Repair what lands.
4. **Update** `docs/00-status.md`. Next: `/positioning` (can run in parallel with `/architecture`).
