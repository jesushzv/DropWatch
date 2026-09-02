# DropWatch application

The authenticated DropWatch app: React, Express, tRPC, Drizzle on Supabase
Postgres, Supabase Auth, and Anthropic for the two LLM features. It accepts
plain-English alerts, monitors supported retailer sources, and presents
conservative trust evidence for price, shipping, tax, condition, availability
and freshness.

The validation landing page is a **separate build at the repository root** —
see the root `README.md`. The two are independent and deploy independently.

## Local setup

```sh
pnpm install
cp .env.example .env        # then fill in the values it explains
pnpm dev                    # tsx watch, http://localhost:3000
```

```sh
pnpm run check              # tsc --noEmit
pnpm test                   # vitest; integration suites skip without DATABASE_URL
pnpm run build              # client → dist/public, server → dist/index.js
pnpm start                  # run the production build (long-running node)
```

Every required secret is named and explained in `.env.example`. Nothing is
committed; the server refuses to start in production with any of JWT_SECRET,
DATABASE_URL, SUPABASE_URL or VITE_APP_ID missing.

### Local database

The integration suites (including the row-level-security enforcement tests)
need a Postgres with the app's migrations applied and the non-owner
`dropwatch_app` role able to log in — the same sequence CI runs:

```sh
createdb dropwatch_test
DATABASE_URL=postgres://<owner>@localhost/dropwatch_test pnpm exec drizzle-kit migrate
ADMIN_DATABASE_URL=postgres://<owner>@localhost/dropwatch_test \
  APP_DB_PASSWORD=<password> node scripts/provision-app-role.mjs
DATABASE_URL=postgres://dropwatch_app:<password>@localhost/dropwatch_test pnpm test
```

Connect the app as `dropwatch_app`, never as the table owner: RLS only binds
for a non-owner role, and `rls.integration.test.ts` will fail loudly on an
owner connection — that failure is a feature.

## Authentication

Supabase Auth (magic link) is only the login path. The client completes the
Supabase flow at `/auth/callback` and exchanges the verified access token at
`POST /api/auth/session` for the app's own HS256 session cookie; every
request after that runs on the first-party cookie. `users.openId` holds the
Supabase auth user UUID.

## Deployment (ADR-5)

The app deploys as a Vercel project of its own — `dropwatch-app`, Root
Directory `app/`, configured by `vercel.json` in this directory:

- the SPA is built by `vite build` and served statically from `dist/public`;
- every dynamic route is one serverless function, `api/index.ts`, which
  serves the same Express app the local entry runs (`server/_core/app.ts`);
- Vercel Cron calls `GET /api/scheduled/price-imports` once daily (08:00 UTC)
  with `Authorization: Bearer CRON_SECRET`; the route refuses everything when
  the secret is unset. Daily is the Hobby-plan cap — the product spec's
  six-hourly cadence needs Vercel Pro, and imports stay disabled for the MVP
  (ADR-6) so the cadence is inert at launch;
- set `DATABASE_POOL_MAX=1` and point `DATABASE_URL` at Supabase's
  transaction pooler (port 6543) — the driver already runs `prepare:false`.

The Vercel project that serves `usedropwatch.com` builds the repository root
and must never build this directory; both projects are named explicitly in
the root `CLAUDE.md`.

## Provider callbacks

Scheduled imports call PriceAPI, which calls back to
`POST /api/webhooks/price-api`. The callback URL carries an `expires` stamp and
a signature bound to it, so a URL captured from provider or proxy logs stops
working after `PRICE_WEBHOOK_TTL_MS` (7 days). The handler only re-downloads
results for jobs this app queued.

## Notes

`repo-sync-plan.md`, `readiness-roadmap.md`, `todo.md`,
`authenticated-smoke-test.md` and `template.json` are artifacts from the
original Manus project. They describe an earlier layout in which the app sat at
the repository root, and are kept for reference only — the root `README.md` and
this file describe the current structure.
