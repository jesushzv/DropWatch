# Security Gate Runs

> One dated section per `/security-check` run: verdict, blocking findings, fixes, accepted risks, evidence. The gate ledger in `docs/00-status.md` carries only the verdict; this file carries the reasoning.

## 2026-09-01/02 — App scope (first run) — FAIL → fixed → **PASS**

- **Scope:** the application in `app/` (never gated before), `.github/workflows/ci.yml`, `app/drizzle/` migrations — reviewed on branch `claude/dropwatch-adr-migration` after ADR-2/3/4/5 landed. Landing page out of scope (gated 2026-08-22). Payments N/A (no Stripe anywhere — verified by grep).
- **Process:** full checklist pass (security-reviewer charter) → FAIL with one blocking finding → root-cause fix + negative tests → scoped adversarial re-review → PASS.

### Blocking finding (fixed)

**No rate limiting or quotas anywhere, while three authenticated procedures spend paid-API money per call**, behind open magic-link self-signup: `watchedRecords.createFromRequest` (one Anthropic call per invocation), `watchedRecords.logPrice` (one Anthropic call), `priceImports.requestNow` (queues up to 100 PriceAPI jobs per run, no per-user cap on runs). Realistic attack: one hostile free account scripting these in a loop = an unbounded Anthropic/PriceAPI bill overnight.

**Fix (commit f551b07):**
- `usageCounters` table (migrations `0002` + `0003`), RLS'd like every other table: user-scoped select/insert/update, no user DELETE (no counter-reset path), anon/authenticated revoked. Applied to the provisioned Supabase project in lockstep.
- `server/usageLimits.ts`: **200 LLM calls/user/UTC-day**, **20 active watches/user**, **1 manual import run/user/UTC-hour** — enforced in the routers *before* the paid call. The LLM budget debits on attempts, so failed parses can't loop for free. Increment-then-check on an atomic `INSERT … ON CONFLICT … RETURNING`, so the LLM and cooldown caps have zero overshoot under parallel requests.
- Express body limit 50mb → 1mb (inherited default; nothing needs more).

**Negative tests (the durable proof):** `server/usageLimits.router.test.ts` — a capped caller gets `TOO_MANY_REQUESTS` and `parseAlertRequest` / `writeDealVerdict` / `requestPriceImports` are never invoked; budget debits on failed parses. `server/usage.integration.test.ts` — atomic increments per (user, kind, window), counters tenant-isolated under RLS, deleted watches don't count toward the cap. Both run in CI against Postgres as the non-owner role.

**Re-review verdict: PASS.** Ordering verified on all three paths (cap checks sit outside the try/catch, so they can't be swallowed into `BAD_REQUEST`); all `generateText`/`generateStructured`/`createPriceApiJob` callers enumerated — the only uncapped callers are service paths (CRON_SECRET-gated scheduled route; HMAC-with-expiry webhook processing each queued job exactly once). Live schema check confirmed the unique index, RLS enabled, and all three policies.

### Accepted risks (founder should know; none block an invite-scale pilot)

1. **Watch cap is check-then-insert, not atomic** — a parallel burst at 19 watches can overshoot 20. Extra rows spend nothing directly; LLM budget still debits; import spend stays capped per run.
2. **Webhook-path deal verdicts don't debit the user's LLM budget** — bounded by jobs a user can queue (~2,800/day worst case with imports fully enabled). Console-side spend caps are the backstop.
3. **UTC window boundaries allow ~2× burst at rollover** (inherent to fixed windows; bounded).
4. **Limits are per-user, not per-IP** — N signups get N× budget. Proportionate for invite scale; revisit before open growth. Magic-link email sending relies on Supabase Auth's rate limits — **founder: confirm Dashboard → Auth → Rate Limits before launch.**
5. **Recurring imports** give a user 4 × ≤100 service-side jobs/day outside counters (and imports stay disabled per ADR-6 anyway).
6. **Manus storage proxy still mounted** (`storageProxy.ts`): any authenticated user can mint presigned URLs for arbitrary storage keys. Inert only because `BUILT_IN_FORGE_API_URL`/`KEY` are unset — **do not set them; execute ADR-7 soon.** Same for the dead vendor helpers.
7. **Sessions live 1 year with no server-side revocation** (logout clears the cookie only). HttpOnly/Lax/Secure mitigate; consider 30-day expiry later.
8. **JWT_SECRET doubles as the PriceAPI webhook HMAC key** — not exploitable by itself; derive a separate secret when imports turn on.
9. **`assertRequiredEnv` runs only in the local entry**, not the serverless function — a deploy missing JWT_SECRET fails safe but late (per-request 403s instead of boot failure).
10. **Dependency audit:** 1 critical / 11 high, all on dead paths (fast-xml-parser via never-imported `@aws-sdk/client-s3`; unused trpc/lodash/mysql2 lockfile remnants). Pruning the unused packages in ADR-7 clears the critical.

### Evidence (captured during the runs)

- Full-checklist pass: HS256 pinned + appId-bound sessions; Supabase exchange pins issuer + `authenticated` audience and rejects anonymous sign-ins; test-auth allowlisted to NODE_ENV ∈ {development, test} with timing-safe secret; secrets grep over repo + full git history clean (`.env` never committed); RLS live probes as `dropwatch_app`: no-context reads → 0 rows on every table, cross-tenant read/update → 0 rows, cross-tenant insert → `new row violates row-level security policy`, `SET ROLE postgres` → `permission denied`, watchEvents UPDATE denied even for service context; zod at every tRPC boundary; parameterized SQL only; email HTML escaped; unsubscribe mutates only on POST.
- Suite after fix: **Test Files 31 passed | 2 skipped; Tests 149 passed | 2 skipped** (Postgres 16, connected as `dropwatch_app`); negative tests 8/8.
- `pnpm audit --prod`: 53 findings (9 low / 32 moderate / 11 high / 1 critical), each traced to an unused dependency path — details in the 2026-09-01 review transcript summarised above.
