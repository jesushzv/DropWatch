# DropWatch

One plain-English price alert, zero noise. Type "Sony WH-1000XM5 under $250,
Amazon or Best Buy" and hear nothing until it happens.

**Current phase: validation.** This repo holds the founding-user landing page —
its only job is to prove people want DropWatch badly enough to leave an email.
The repo is a clone of the solo-founder workflow template (manual:
`docs/WORKFLOW.md`, narrative: `docs/PLAYBOOK.md`); project state lives in
`docs/00-status.md`, and the source-of-truth validation brief in
`docs/product/00-brief.md`.

## Repository layout

```text
/          validation landing page — the live site, and what Vercel builds
/app/      authenticated DropWatch application (not deployed; see app/README.md)
```

The two are independent builds. Nothing at the root imports from `app/`, and
`app/` does not build or serve the landing page.

## The landing page

Single-page React app (Vite + TypeScript) at the repo root.

```sh
npm install
npm run dev                 # local dev
npm run build               # production build → dist/
node scripts/qa-shots.mjs   # QA screenshots + og.png capture (Playwright chromium)
```

## Lead capture

Signups POST to Supabase (project `business-helper`, table `dropwatch_leads`)
via the REST API with the publishable key. Stored per lead: email, source
(which CTA), tier (if a pricing button was clicked), timestamp.

Security model (see `supabase/migrations/20260822_dropwatch_leads.sql`):
RLS enabled; anon may INSERT only (email format enforced by a check
constraint); SELECT/UPDATE/DELETE are revoked outright, so nothing can be
read or changed with the key shipped in the bundle. The publishable key is
public by design — no secrets live in this repo.

Every form carries a visually-hidden honeypot field; submissions that fill
it are silently dropped client-side.

Read leads (owner only, via Supabase dashboard / MCP):

```sql
select email, source, tier, created_at from dropwatch_leads order by created_at desc;
```

## Deployment

Vercel project `dropwatch` is linked to this repo (root directory = repo
root) and is the only project that builds it. Every push gets a preview
deployment; merging to `main` deploys production at https://usedropwatch.com
(the apex 308-redirects to https://www.usedropwatch.com).

`VITE_*` env vars are baked in at build time, so they must be set on
`dropwatch` — a build from anywhere else ships without the Meta Pixel. A
duplicate `drop-watch` project once held the domain and caused exactly that;
it was deleted on 2026-08-24.
