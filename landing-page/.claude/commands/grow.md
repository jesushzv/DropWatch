---
description: "Stage 4 — attack the binding constraint with day-scale experiments and the growth playbook, not just releases"
argument-hint: "[optional: the constraint to attack, e.g. 'activation', or blank to take it from /measure]"
---

Run a growth cycle against the binding constraint: **$ARGUMENTS** (blank = the constraint named by the latest `/measure` review in `docs/launch/02-metrics.md`).

`/roadmap` moves in releases (weeks). This command moves in **experiments (days)** — the learning loop between releases. Tactics come from `.claude/references/growth-tactics.md`; evidence rules apply.

## Steps

1. **Confirm the constraint** from `/measure` (traffic / activation / retention / monetization) and pull the qualitative "why" from `docs/launch/04-feedback.md` if it exists. Numbers say where the funnel leaks; feedback says why.
2. **Pick the attack** from the playbook section matching the constraint — prefer the cheapest intervention with a plausible mechanism ("users churn before creating their first X → move X into onboarding") over generic best practice.
3. **Design the experiment, pre-registered before shipping it:**
   - Hypothesis: "changing X moves metric Y by ≥Z because [mechanism] [ASSUMPTION]"
   - Instrument: a PostHog experiment/feature-flag A/B where traffic allows; a before/after with a dated cut where it doesn't (say which, and note the weaker inference)
   - **Pass threshold and end date, fixed now** — an experiment that can't fail is PB-8 in slow motion
   - Small-sample honesty: at indie traffic most tests can't reach significance — prefer big swings on small numbers ("do 10 users activate instead of 4") over 2% button tweaks, and label the readout [INFERENCE] accordingly
4. **Ship the change** through the normal fast lane (it's usually a small `/build` phase; `/review` if it touches the funnel's code path).
5. **Log it** in `docs/launch/05-experiments.md` (dated entry: hypothesis, threshold, end date, status RUNNING). The next `/measure` run grades every experiment past its end date — VALIDATED / REFUTED / INCONCLUSIVE — and moves the assumption to `docs/knowledge/assumptions.md`.
6. **One experiment at a time per constraint.** A second concurrent experiment on the same metric contaminates both readouts; queue it instead.

Retention infrastructure (dunning, lifecycle email, cancellation save-flow) isn't an experiment — when the playbook says you're missing table stakes, route it to `/roadmap` as a release with the playbook section as its spec.
