---
description: "Stage 3 — implement the plan phase by phase, with verification captured at each gate"
argument-hint: "[optional: phase number to run, e.g. '2', or blank for next incomplete phase]"
---

Implement the plan in `docs/engineering/02-plan.md`. Target: **$ARGUMENTS** (blank = next incomplete phase, per `docs/00-status.md`).

## The loop, per phase

1. **Re-read** the phase's goal, tasks, and verification list. Also load `.claude/references/stack.md` (+ project overrides) and `.claude/references/prohibited-behaviors.md` — the catalog is binding here.
2. **Implement** the tasks. Conventions:
   - Follow existing project patterns over introducing new ones; boring and consistent wins.
   - New tables ship with their migration **and their RLS policies in the same migration** — never "RLS later".
   - Server-side validation (zod or equivalent) at every boundary the phase adds: route params, forms, webhooks.
   - Instrument the PostHog events the plan assigns to this phase.
   - Write tests alongside the code they test: unit tests for logic with branches, an e2e happy-path when the phase completes a user-visible flow.
3. **Verify with the plan's own list** — run the exact commands, capture the real output. The phase is done only when its predefined verification passes unmodified. Weakening a check to pass it is PB-1; if a check turns out to be genuinely wrong, change it *and log why* in the plan file — visibly, not silently.
4. **Record**: mark the phase complete in `docs/engineering/02-plan.md` (with captured verification output or a pointer to it), update `docs/00-status.md`, and commit with a message naming the phase.
5. **Report** honestly: what shipped, what was cut or deferred (explicitly — PB-2), anything discovered that should feed back into the plan.

## When things go sideways

- A task turns out 3× bigger than planned → stop, split the phase in the plan file, tell the founder. Don't silently deliver a fraction.
- A plan assumption is wrong (API doesn't work that way, schema conflict) → fix the plan first, then the code, and note it — the plan must stay truthful to what's being built.
- After the final phase, run `/review`, then `/security-check`, then `/ship`. Between phases, `/review` is optional but cheap for risky phases.
