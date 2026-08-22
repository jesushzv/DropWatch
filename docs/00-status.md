# Project Status

> Single source of truth for where this project is in the lifecycle. Every phase command updates this file. `/workflow-status` reads it; artifacts on disk outrank it if they disagree.

- **Project:** DropWatch — plain-English price-drop alerts, zero noise
- **Idea file:** `docs/product/00-brief.md` (external validation brief, supplied complete by the founder)
- **Stage:** Validate
- **Last updated:** 2026-08-22
- **Next command:** merge the landing-page PR → production URL, do one real test signup on the
  live page, then post the share-kit posts (in the brief) and watch `dropwatch_leads`; convert
  the probe with `/validate-idea` once signup evidence is in

## Gate ledger

| Gate | Verdict | Date | Notes |
|---|---|---|---|
| Validation | PENDING PROBE | 2026-08-22 | Landing page live (Vercel preview; production on merge). Probe = founding-user email capture to Supabase `dropwatch_leads`. Signup thresholds not yet pre-committed — set them before posting the share kit |
| PRD | — | | brief covers scope; formalize with `/prd` post-GO |
| Positioning | — | | brief covers positioning; formalize post-GO |
| Architecture | — | | |
| Build plan | — | | phases: 0/0 complete |
| CI pipeline | — | | set up / skipped-on-record |
| Review | — | | APPROVED / NEEDS_FIX |
| Security | — | | Landing-scope only: RLS insert-only on `dropwatch_leads` verified 2026-08-22 |
| Design review | — | | done / skipped-on-record |
| Perf audit | — | | done / skipped-on-record |
| Legal (first deploy) | — | | privacy+ToS+consent+tax, per compliance.md |
| Observability | — | | verified / skipped-on-record |
| Ship | — | | |
| Launch | — | | |

## Waivers & accepted risks

<!-- Every skipped gate or accepted risk gets a dated line here. Nothing is skipped silently. -->

- 2026-08-22 — Founder supplied a finished external validation brief (idea, positioning, design
  system, copy, pricing — all decided) and directed a straight build of the validation landing
  page. In-repo Stage 0–2 artifacts and gates waived by founder; the landing page IS the
  Stage-1 probe. If anything conflicts with the brief, the brief wins.

## Log

<!-- One dated line per meaningful state change, newest first. -->

- 2026-08-22 — Repo created as a clone of the workflow framework; landing page moved here from
  the portfolio hub (`claude-code-ai-development-workflow`, PR #2 there now removes it and
  records the graduation). App lives at repo root; Vercel project `dropwatch` linked to this
  repo; Supabase `dropwatch_leads` unchanged.
- 2026-08-22 — Landing page built verbatim from the founder's brief: copy + design system
  implemented as specified; leads to Supabase `dropwatch_leads` (RLS insert-only for anon,
  verified with captured output); QA'd at 1280px/375px, 0px horizontal overflow. Deviations
  (recorded in the build PR): no AI Studio / Gemini / Firebase in the build environment —
  framework stack used instead; hero image and logo are flat token-palette SVGs.
