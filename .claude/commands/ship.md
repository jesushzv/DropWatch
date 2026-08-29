---
description: "Stage 3 — take the release to production: deploy checklist, env vars, migrations, rollback plan"
argument-hint: "[optional: 'first-deploy' for initial production setup]"
---

Ship the current release to production. Mode: **$ARGUMENTS**

**Gates:** latest `/review` verdict APPROVED, and `/security-check` PASS (or an on-the-record skip/waiver in `docs/00-status.md`). Missing gate → stop and name it (PB-9).

## Steps

1. **Pre-flight, with captured output:**
   - Clean working tree, branch pushed, CI (if configured) green.
   - Production build passes locally: `npm run build` (or stack equivalent) — captured, not claimed.
   - `.env.example` matches every env var the code actually reads (grep for `process.env`); list any var that must be set in Vercel before deploy.
   - Pending Supabase migrations enumerated, in order, with a note on any that are destructive or slow on existing data.
2. **First deploy only** (`first-deploy` mode): walk through Vercel project creation/linking, production env vars, custom domain + HTTPS, Supabase production project (separate from dev!), Stripe live-mode keys and webhook endpoint, PostHog project key. Produce this as a checklist the founder executes, with the exact CLI commands or dashboard paths. **Legal gate** (per `.claude/references/compliance.md`, recorded in the status ledger): privacy policy + terms live and linked in footer and signup, consent gating for PostHog session replay with input masking on, Stripe Tax enabled, refund policy stated. These block first deploy like any other gate — waivable only on the record.
3. **Deploy:** migrations first (against production Supabase, after confirming a backup/restore point exists), then the Vercel production deploy. Prefer promoting a verified preview build over deploying unverified HEAD.
4. **Post-deploy smoke test** — actually exercise, on production: landing page loads, signup works, the core loop's first action works, payment test (Stripe test-clock or a real charge refunded), PostHog receiving events. Capture what you saw.
5. **Rollback plan, written before it's needed:** the exact Vercel rollback command/dashboard step, and per-migration notes on whether it can be rolled back or must roll forward.
6. **Record** in `docs/engineering/05-ship.md` (dated section per release): what shipped, smoke-test evidence, rollback notes. Update the user-facing changelog (a public `/changelog` page or `CHANGELOG.md` — a shipping cadence users can see is cheap marketing) and any help docs the release made stale; note if a new subprocessor means a privacy-policy update (compliance reference, "Ongoing"). Update `docs/00-status.md`. Next: `/launch` (first release) or `/measure` (subsequent releases).
