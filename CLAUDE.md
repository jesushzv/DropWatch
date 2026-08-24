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
- **Hosting:** Vercel project `drop-watch` serves the production domain
  `usedropwatch.com`; the older `dropwatch` project is also linked to this repo and still
  counts as a production host in `src/lib/analytics.ts`. Both build from the repo root.
  `VITE_*` env vars are build-time and per-project — set them on `drop-watch`.

## Engineering bar (proportionate to a solo shop)

- Simple and boring over clever; follow existing patterns.
- Server-side validation at every boundary; migrations carry their RLS policies.
- Tests where behavior can break: logic with branches, critical-path e2e. No coverage theater.
- Secrets never committed; `.env.example` stays current.
