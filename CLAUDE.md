# Solo Founder Workflow

This project uses a staged idea-to-launch workflow. Full docs: `docs/WORKFLOW.md`. Commands live in `.claude/commands/`; each phase writes an artifact under `docs/` and updates `docs/00-status.md` (the single source of truth — check it at session start; if work seems mid-flight, suggest `/continue-work`).

## Lifecycle

```
Stage 0 IDEA      /new-idea → /compare-ideas
Stage 1 VALIDATE  /validate-idea                     gate: GO / PIVOT / KILL
Stage 2 DEFINE    /prd → /ux-design → /positioning
Stage 3 BUILD     /architecture → /build-plan → /build (×N) → /review → /security-check
                  → /design-review → /ship
                  (once, early: /ci-pipeline; pre-launch: /perf-audit, /observability;
                   LLM features: /ai-integrate)
Stage 4 GROW      /launch → /measure (cadence) → /grow (experiments) ↔ /feedback
                  → /watch-competitors (monthly) → /roadmap → /retro
                  end of life: /sunset (wind down or sell)
Anytime           /workflow-status  /continue-work  /adversary <target>  /hotfix  /sync-template
                  /ops-check (quarterly)   /portfolio (from the hub, when 2+ products live)
```

Narrative manual: `docs/PLAYBOOK.md`.

Gates are real: don't start a stage whose predecessor's gate is missing or failed. The founder can waive any gate — but the waiver is recorded in `docs/00-status.md`, never silent.

## Standing rules

- **Prohibited behaviors** (`.claude/references/prohibited-behaviors.md`) bind all code and research work: no test-loosening, no silent scope cuts, no fabricated evidence, no skipped gates. Recovery: STOP → REVERT → DOCUMENT → FIX → VERIFY.
- **Research protocol** (`.claude/references/research-protocol.md`) binds all research/product artifacts: label claims [FACT]/[INFERENCE]/[ASSUMPTION], date sources, check `docs/knowledge/` before authoring, end with a verdict.
- **Claims are not evidence.** Any "verified/tested/checked" statement embeds captured output or a source.
- **Knowledge compounds.** Durable decisions → `docs/knowledge/decisions.md` when made, not just at retro. Never re-litigate a recorded decision without flagging it.

## Stack

Defaults in `.claude/references/stack.md` (Next.js + TypeScript, Supabase with RLS on every table, Vercel, PostHog, Stripe). Overrides for this project:

- **Validation-landing phase:** Vite + React + TypeScript SPA at the repo root (not Next.js) —
  the page is a static lead-capture probe; revisit when the MVP build starts.
- **Leads storage:** Supabase project `business-helper` (dfyoavffxzujvxvnsizi), table
  `dropwatch_leads`, insert-only RLS for anon; migration in `supabase/migrations/`.
- **Hosting (landing page):** Vercel project `dropwatch` (`prj_l7DMfbbVAMUvlvB3rQArQjn76bCV`)
  builds the repo root and is the **only** project that serves the landing page. It holds both
  `usedropwatch.com` and `www.usedropwatch.com`. `VITE_META_PIXEL_ID` is set on it, and Vite
  inlines `VITE_*` vars at build time, so a deployment from any other project silently ships a
  pixel-less bundle. **Before trusting a production URL, check which project serves it** — the
  duplicate-project trap in the 2026-08-24 entry of `docs/knowledge/decisions.md` cost a
  near-miss on the whole ad budget.
- **Hosting (application):** Vercel project `dropwatch-app` (`prj_I8YvLVlj4BL8GPFWliTzqaq65xjR`,
  Root Directory `app`, config in `app/vercel.json`; created 2026-09-01 for ADR-5) builds `app/`
  only. It must **never** hold `usedropwatch.com` or `www` — the landing hosts stay on
  `dropwatch`. Named here per the 2026-08-24 decision that any second project is declared, not
  discovered. Its database is Supabase project `gqezqgasuqqpnqiljsig`; env vars per
  `app/.env.example`.
- **Apex redirects to `www`:** `https://usedropwatch.com/` 308-redirects to
  `https://www.usedropwatch.com/`. Both hosts are in `PRODUCTION_HOSTS`, so analytics fires either
  way. `www` is the canonical host: `<link rel="canonical">`, `og:url` and the social image URLs in
  `index.html` all name `www`, and ad/post links should too (skips the redirect hop and keeps
  `?utm_source=` intact).

## Engineering bar (proportionate to a solo shop)

- Simple and boring over clever; follow existing patterns.
- Server-side validation at every boundary; migrations carry their RLS policies.
- Tests where behavior can break: logic with branches, critical-path e2e. No coverage theater.
- Secrets never committed; `.env.example` stays current.
