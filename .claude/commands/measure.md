---
description: "Stage 4 — read the metrics against PRD targets and decide: iterate, double down, or sunset"
argument-hint: "[optional: 'setup' to plan instrumentation, or a period like 'last 30d']"
---

Measure the product against its own targets. Mode: **$ARGUMENTS**

**Inputs:** the PRD's success metrics (`docs/product/02-prd.md`) — activation, retention, revenue, each with a target — plus every release hypothesis in `docs/product/04-roadmap.md`, every experiment past its end date in `docs/launch/05-experiments.md`, and the feedback themes in `docs/launch/04-feedback.md` (the qualitative "why" behind the numbers). The pre-set targets and thresholds are the anti-rationalization device: read the numbers against them, not against hope — and never edit a target in the same session that grades it. Metric definitions, formulas, and benchmarks come from `.claude/references/saas-finance.md` — use its definitions (and its traps list: small-number theater, fictional early LTV) verbatim.

## `setup` mode (pre- or at launch)

Audit that every PRD metric has a PostHog event actually firing (check the code, then the PostHog live events view if MCP access is available). Define the activation funnel and a weekly dashboard: signups → activated → retained (week-over-week) → paying, plus the primary channel's traffic. Record the instrumentation map in `docs/launch/02-metrics.md`.

## Review mode (default; run on a cadence — weekly early on)

1. **Pull the numbers** for the period — from the PostHog MCP if connected, otherwise ask the founder to paste dashboard numbers. Never estimate a metric you didn't retrieve (PB-8); missing data is reported as missing.
2. **Compare to targets** and to the previous period. Separate signal from noise honestly — 5 users to 8 users is not "+60% growth", it's too-early-to-tell.
3. **Grade what was bet on:** every roadmap release hypothesis whose release shipped, and every `/grow` experiment past its end date — VALIDATED / REFUTED / INCONCLUSIVE against its pre-registered threshold, recorded in its file and in `docs/knowledge/assumptions.md`. Ungraded bets are PB-4.
4. **Diagnose the binding constraint** — the one funnel stage losing the most people relative to target. Traffic, activation, retention, or monetization: name it, with the numbers and with the feedback ledger's "why" where it speaks. If the constraint is monetization, the recommendation includes re-running the pricing analysis (`/positioning`'s revisit signal has an owner: this step).
5. **Recommend one focus for next period**, aimed at the binding constraint — usually a `/grow` experiment or a `/roadmap` candidate. Not three initiatives — one; the founder is also the WIP limit, so sanity-check the recommendation against the hours they actually have this period. Update the assumption ledger: launch validated or invalidated some [ASSUMPTION]s from validation/positioning; move them to `docs/knowledge/assumptions.md` with their outcome.
6. **PMF check** (quarterly, or when the growth-vs-fit question is live): read the product against the PMF signals in `.claude/references/saas-finance.md` — retention-curve flattening, Sean Ellis threshold, organic pull, and the anti-signals. State the call: *pre-fit* (all cycles target activation/retention) or *fit-reached* (scaling spend is now justified) — and record a change of state in `docs/knowledge/decisions.md`.
7. **Honest-exit check.** If the trend has been under target for 3+ consecutive periods, put iterate / pivot / sunset on the table explicitly with the evidence. A **pivot** is a procedure, not a mood: keep what's validated (the audience, the problem evidence, the parts of the funnel that worked), form the new hypothesis, and re-enter the lifecycle at `/validate-idea` in this same repo — the validation brief's "Prior context" section carries everything learned. Sunsetting is `/sunset`. Either is a portfolio win over a zombie — the workflow exists to make the next bet cheaper.
7. Append the dated review to `docs/launch/02-metrics.md`, update `docs/00-status.md`.
