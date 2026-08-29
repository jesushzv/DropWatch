---
description: "Stage 4 — sequence the next 1–3 releases from metric findings, user feedback, and the deferred-scope backlog"
argument-hint: "[optional: horizon, e.g. 'next quarter', or a candidate theme to evaluate]"
---

Plan the post-v1 roadmap. Notes: **$ARGUMENTS**

**Inputs:** the latest `/measure` reviews (`docs/launch/02-metrics.md` — the binding constraint drives everything), the PRD's Out-of-scope list (the deferred backlog), the themed feedback ledger (`docs/launch/04-feedback.md` — run `/feedback digest` first if it's stale), and `docs/knowledge/` (decisions constrain, invalidated assumptions redirect).

## Rules

- **The binding constraint outranks the backlog.** If retention is failing, the roadmap is retention work — not the shiny deferred feature. A roadmap that ignores `/measure`'s diagnosis needs an explicit recorded reason.
- Releases are small: 1–3 releases ahead, each sized like a v1 build plan (weeks, not months). Beyond that horizon, keep only a themes list — detail rots.
- Each release gets a **hypothesis**, not just a feature list: "shipping X moves metric Y because Z [ASSUMPTION]" — so `/measure` can grade it afterward.

## Steps

1. Gather candidates: deferred scope, feedback themes (quote real users), constraint-driven fixes, and any `/watch-competitors` escalations.
2. Score candidates against the binding constraint (impact on the failing metric × effort). Show the table.
3. Sequence 1–3 releases: name, hypothesis, headline scope (3–6 bullets), explicit not-now list, the metric that judges it.
4. **Adversary gate** — favorite attacks: roadmap-by-recency (last loud user wins), hypothesis that can't fail, scope creep disguised as a release.
5. Write `docs/product/04-roadmap.md` (dated sections per planning pass, newest first), update `docs/00-status.md`. Next: each release enters the build stage via a mini `/prd` update or directly `/build-plan`, per the skip-table in the README.
