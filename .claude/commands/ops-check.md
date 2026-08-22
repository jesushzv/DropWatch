---
description: "Cross-cutting — quarterly ops health check: tested backup restore, dependency updates, credential hygiene, cost drift, continuity doc"
argument-hint: "[optional: 'first-run' to also create the continuity doc]"
---

Run the ops health check. Mode: **$ARGUMENTS**

This covers the failure modes that kill solo businesses regardless of product-market fit: unrestorable backups, rotted dependencies, a locked-out founder, and quiet cost creep. Quarterly per live product (put it in the calendar next to `/retro`). Evidence rules apply — every "checked, fine" embeds the output that proves it.

## The checklist

1. **Backups you have actually restored.** Confirm Supabase backups/PITR are enabled for production, then **do a test restore** — to a branch/scratch project, never over production — and run one real query against the restored data (captured). A backup that has never been restored is a hope. Note the restore time; that's your real RPO/RTO.
2. **Dependency hygiene.** `npm outdated` + `npm audit` (captured). Apply patch/minor updates now (CI green proves them); list major updates as scheduled decisions, not indefinite deferrals. If Dependabot/Renovate isn't configured, offer to add it via `/ci-pipeline`.
3. **Credential & access hygiene.** Rotate anything long-lived that has leaked-risk (a key that ever touched a chat, a screenshot, a script). Verify: 2FA on GitHub/Vercel/Supabase/Stripe/registrar, secrets live only in a password manager + platform env vars, and **emergency access exists** — a trusted person (or at minimum documented recovery codes in a separate location) can reach the accounts if you can't.
4. **Cost drift.** Pull current monthly spend per service (Vercel, Supabase, LLM APIs, email, domains) and compare to last check and to MRR. Flag anything growing faster than usage. Cross-check against `/perf-audit`'s unit-cost model if stale.
5. **Domain & renewals.** Domain auto-renew on with a valid card; certificate/DNS sanity; anything expiring within 90 days listed.
6. **Continuity doc current** (`first-run` creates it from `docs/templates/continuity.md`, kept at `docs/knowledge/continuity.md`): the "if the founder is offline for two weeks" runbook — where credentials live, what runs itself, what breaks first, who (if anyone) to alert, and the wind-down-or-transfer instruction for the worst case. Update whatever changed this quarter; a continuity doc describing last year's infra is theater.

## Wrap up

Append the dated check (findings + captured evidence + fixes applied) to `docs/engineering/11-ops.md`, update `docs/00-status.md`. Anything requiring real work (major upgrade, provider migration) goes to `/roadmap` as a maintenance release — tracked, not remembered.
