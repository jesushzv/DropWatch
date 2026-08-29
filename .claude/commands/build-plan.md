---
description: "Stage 3 — break the PRD into a phased implementation plan with verification gates"
argument-hint: "[optional: what to build first, time constraints]"
---

Write the implementation plan. Founder notes: **$ARGUMENTS**

**Inputs:** `docs/product/02-prd.md` and `docs/engineering/01-architecture.md` (required — stop and name the missing command if absent, unless the founder waives it on the record in `docs/00-status.md`).

## Rules

- **Phases are vertical slices**, each ending in something runnable and demoable — "walking skeleton with auth and one real table" beats "all the models, then all the routes". First phase must reach deployed-to-Vercel-preview, however thin.
- **Each phase defines its own verification before its implementation**: the commands to run, the tests that must pass, the thing the founder can click. `/build` will hold itself to exactly this list, so make it concrete and runnable.
- Plans state **WHAT and in what order, not HOW** — no code in the plan; leave implementation freedom to `/build`.
- Right-size: a v1 plan is typically 3–6 phases. If it's 10+, the PRD scope is too big — push back before planning it.

## Steps

1. Derive the phase list from the PRD's core loop: skeleton → core value path → auth/payment plumbing → polish of unhappy paths. Map every PRD acceptance criterion to a phase; anything unmapped is either missing from the plan or belongs in Out of scope.
2. For each phase: goal (one sentence), tasks (short list), files/areas touched, **verification** (exact commands + expected result + manual check), and rollback note if it touches production data.
3. Mark phases that can be parallelized in separate worktrees, if any.
4. Include a standing note: PostHog events from the PRD's success metrics get instrumented in the phase where their feature is built — not batched at the end.
5. **Pre-mortem.** Before the adversary pass, write three sentences: *"It's six months from now and this product failed. The most likely cause was ___. The second was ___. The earliest we could have seen it was ___."* Anything the pre-mortem surfaces that the plan doesn't address becomes either a plan phase, a `/grow` experiment queued for post-launch, or a recorded risk in `docs/knowledge/assumptions.md` — pick one per cause, explicitly.
6. **Adversary gate.** Dispatch the `adversary` agent: missing unhappy paths, phases with unverifiable "done", dependency order errors, scope smuggled in beyond the PRD, and whether the pre-mortem's causes are honestly addressed. Repair.
7. Write `docs/engineering/02-plan.md` using `docs/templates/plan.md`, update `docs/00-status.md`. Next: `/build`.
