# Business Continuity: <product>

> The "founder offline for two weeks" runbook. Lives at `docs/knowledge/continuity.md`, updated by `/ops-check` quarterly. Write it so a technically-competent friend could follow it cold. **Never put actual secrets in this file** — it points to where they live.

## Access

- Credentials: (password manager + which vault; where recovery codes live)
- Emergency access: (who/what can reach the accounts if I can't; how)
- Accounts that matter: GitHub, Vercel, Supabase, Stripe, registrar, email provider, PostHog — (owner emails, 2FA method per account)

## What runs itself

What keeps working with no founder: (deploys off main, Stripe billing, transactional email, backups…) — and for how long (card expiry dates, plan renewal dates).

## What breaks first

The known time bombs in order: (e.g. support inbox unanswered → refund disputes at ~2 weeks; LLM API spend cap hit; domain renewal on DATE).

## Minimal keep-alive procedure

The 30-minute weekly routine that keeps the lights on: (check error tracker, answer refund-risk support, verify billing webhooks healthy).

## Worst case

If I'm permanently unavailable: (who is authorized to act; whether to wind down per `/sunset` or transfer; where this workflow's docs/ trail serves as the operations manual).

- **Last verified:** YYYY-MM-DD by /ops-check
