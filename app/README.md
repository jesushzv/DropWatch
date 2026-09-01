# DropWatch application

The authenticated DropWatch app: React, Express, tRPC, Drizzle and Manus OAuth.
It accepts plain-English alerts, monitors supported retailer sources, and
presents conservative trust evidence for price, shipping, tax, condition,
availability and freshness.

The validation landing page is a **separate build at the repository root** —
see the root `README.md`. The two are independent and deploy independently.

## Local setup

```sh
pnpm install
cp .env.example .env        # then fill in JWT_SECRET, DATABASE_URL, OAuth
pnpm dev                    # tsx watch, http://localhost:3000
```

```sh
pnpm run check              # tsc --noEmit
pnpm test                   # vitest; integration suites skip without DATABASE_URL
pnpm run build              # client → dist/public, server → dist/index.js
pnpm start                  # run the production build
pnpm run db:push            # drizzle-kit generate && migrate
```

Every required secret is named and explained in `.env.example`. Nothing is
committed; the server refuses to start in production with any of JWT_SECRET,
DATABASE_URL, OAUTH_SERVER_URL or VITE_APP_ID missing.

## Deployment status

**This app is not currently deployed, and cannot be deployed as-is by the
Vercel project that serves usedropwatch.com.** That project builds the
repository root as a static site; this is a long-running Express server, and
it has no serverless entry point. Choosing a host is an open decision — see
`docs/knowledge/decisions.md` in the repository root.

Two things to settle before it ships:

- **Where the server runs.** A container host, or a rewrite to serverless
  functions. If the app gets its own subdomain, set `VITE_LANDING_PAGE_URL` so
  the dashboard's "back to site" link points at the marketing site.
- **Which database.** The schema here is MySQL (`drizzle/schema.ts`,
  `mysql2`). The rest of the project is Supabase Postgres with RLS on every
  table, and the landing page already uses it. Running both engines is a cost
  that has not been justified yet.

## Provider callbacks

Scheduled imports call PriceAPI, which calls back to
`POST /api/webhooks/price-api`. The callback URL carries an `expires` stamp and
a signature bound to it, so a URL captured from provider or proxy logs stops
working after `PRICE_WEBHOOK_TTL_MS` (7 days). The handler only re-downloads
results for jobs this app queued.

Cron-authenticated imports run through `POST /api/scheduled/price-imports`,
which requires a session whose openId carries the `cron_` prefix.

## Notes

`repo-sync-plan.md`, `readiness-roadmap.md`, `todo.md`,
`authenticated-smoke-test.md` and `template.json` are artifacts from the
original Manus project. They describe an earlier layout in which the app sat at
the repository root, and are kept for reference only — the root `README.md` and
this file describe the current structure.
