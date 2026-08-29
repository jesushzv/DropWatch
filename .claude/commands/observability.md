---
description: "Stage 3 — set up error tracking, uptime monitoring, and alerts, and decide what actually pages you"
argument-hint: "[optional: 'audit' to check existing setup instead of creating one]"
---

Set up production observability. Mode: **$ARGUMENTS** (default: set up what's missing; `audit` = verify what exists).

`/hotfix` and launch day both assume you *find out* when things break. This command makes that true — proportionate for one founder: you are the on-call rotation, so the design goal is **few, real signals** — an alert that cries wolf gets muted, and then nothing pages you.

## The three layers

1. **Error tracking (Sentry, or the project's chosen equivalent):**
   - Install and configure the Next.js SDK (client + server + edge configs), wire the DSN via env var, and verify with a deliberate test error — captured in the dashboard, evidence in the artifact (PB-4: an SDK that's installed but never received an event is not "set up").
   - Source maps uploaded on Vercel builds so stack traces are readable.
   - Scrub PII: no user emails/tokens in event payloads; check the SDK's default scrubbing and the project's custom context.
2. **Uptime:** one external check on the production URL and one on the most business-critical API route (a simple `/api/health` that touches the DB), from a free-tier service or Vercel's checks. Down = page immediately.
3. **Structured signals in code:** errors logged with context (user id, route, operation) at the boundaries that matter — API routes, webhooks (Stripe especially — a silently failing webhook corrupts entitlements), background jobs. No `console.log` debugging left as "monitoring".

## What pages you vs. what waits

Write the policy into the artifact, explicitly:
- **Page immediately** (push/SMS): site down, payment webhook failures, error-rate spike on the core loop, auth broken.
- **Daily digest:** new error types, elevated-but-not-spiking rates.
- **Weekly glance (in `/measure`):** performance regressions, noisy handled errors.

## Wrap up

Record the setup (tools, DSNs' env var names — never the values, alert rules, the paging policy, and the captured verification evidence) in `docs/engineering/09-observability.md`; update `.env.example` and `docs/00-status.md`. Run before `/launch`; re-run in `audit` mode when a release adds a new critical surface (jobs, webhooks, a mobile client).
