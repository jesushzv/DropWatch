---
description: "Stage 4 — wind down or sell a product deliberately: users treated well, asset value preserved, lessons harvested"
argument-hint: "[optional: 'sell' to prep for acquisition instead of shutdown]"
---

Sunset the product. Mode: **$ARGUMENTS** (default: wind-down; `sell` = acquisition prep).

**Precondition:** `/measure`'s honest-exit recommendation, or the founder's explicit decision (recorded in `docs/00-status.md` either way). A sunset done well protects your reputation — the audience you keep is the launch asset for the next product.

## `sell` mode — try this first

A product with revenue, clean metrics, and documented ops is a sellable asset (micro-SaaS marketplaces exist for exactly this). Prep: 12 months of MRR/churn from Stripe (exportable, verifiable — never adjusted), cost breakdown per `/ops-check`, the `docs/` trail as the operations manual (this workflow's artifacts are literally the due-diligence package), transferability check (all services on dedicated business accounts, no personal-account entanglement), and an honest one-page listing draft: what it is, metrics, why you're selling, what a buyer gets. If it doesn't sell in a defined window (set one now), fall through to wind-down.

## Wind-down checklist

1. **Decide dates**: announcement → new-signups off → read-only → shutdown. Give paying users 60–90 days; annual subscribers get pro-rated refunds computed now.
2. **Tell users well**: plain-language email (what's happening, dates, refunds, how to export), in-app banner, updated landing page. No dark patterns in reverse — don't make leaving hard, don't go silent.
3. **Data export**: a working self-serve export of each user's data in a portable format, live until shutdown; honor deletion requests immediately (the compliance runbook applies to the end of life too).
4. **Money**: cancel Stripe subscriptions at the right date (don't bill past read-only), process the refund batch, keep records for taxes.
5. **Infra wind-down, in order**: new-signup gate → billing off → read-only → final backup archived (retain per your privacy policy's stated period, then delete) → Vercel/Supabase teardown → domain: keep it (cheap) with a farewell/redirect page for a year rather than letting it lapse to squatters.
6. **Harvest**: final `/retro` — the full arc's lessons to `docs/knowledge/`, and migrate the durable ones to the portfolio hub. Update the idea file's status to `shipped → sunset` with the numbers. Archive the repo.

Sunsetting is a portfolio win when done deliberately: capital (money, audience, lessons, code patterns) moves to the next bet instead of leaking away in a slow zombie decline.
