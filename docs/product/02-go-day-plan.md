# DropWatch — Conditional GO-day build plan

> **Status: CONDITIONAL.** This plan activates only when the validation probe resolves GO
> (thresholds in `docs/00-status.md`; decide by 2026-09-12). It exists so the build starts the
> day the signal is clear instead of cold. It fills no gate slots — `/prd`, `/architecture`,
> and `/build-plan` still run formally at GO, using this as their draft input. If the probe
> resolves KILL, the sunk cost of this document is zero by design.
>
> Inputs: the founder's validation brief (`00-brief.md`) and the price-data research
> (`01-price-data-sources.md`, 2026-08-22).

## Phase 0 — during the probe window (zero build cost, do now)

These have lead times or gate later phases; none of them commits to building.

1. **Buy a domain** (~$10; e.g. a `.app`/`.com` for DropWatch). Unlocks three things at once:
   a business email address (required for the Best Buy API key), a trustworthy display link
   for the Meta ads, and the production URL replacing vercel.app.
2. **Apply for the Best Buy Products API key** with the business email
   (developer.bestbuy.com). Approval is discretionary and takes time; the key is
   [ASSUMPTION] free. Do not build against it yet.
3. **Read the full Best Buy API ToS** (`developer.bestbuy.com/legal`) — specifically the "no
   caching except on a temporary basis" clause — and email their dev support asking whether
   storing per-product price baselines/history for user alerts is permitted. This clause is
   the plan's biggest legal unknown.
4. **Read the Keepa API license** and confirm: (a) consumer-facing price alerts are a
   permitted use; (b) default data staleness of a 1-token product response; (c) token cost of
   a forced live refresh. Determines whether "instant" Amazon alerts are honest.
5. **Decide the LLM provider** for the parse + verdict features. The brief says Gemini; the
   framework stack and this workspace's tooling favor the Claude API. Either works — one
   decision line in `docs/knowledge/decisions.md` when made.

## Scope (from the brief, adjusted by research)

The brief's five MVP features, plus the price-data layer the brief deferred, minus one launch
claim the research killed:

- **In:** Plain-English Alert Builder (LLM parse → structured alert), alert dashboard
  (view/edit/pause/delete), automated price tracking for **Best Buy** (official API) and
  **Amazon** (via Keepa), threshold email alerts, price history + deal-quality verdict,
  founding-user onboarding (waitlist import + 3-months-Pro entitlement).
- **Deferred:** **Target** (no official API, anti-scraping ToS, ~10x data cost — revisit when
  revenue covers a commercial source; the FAQ's "founding users vote on stores" line is the
  public framing). Paste-a-price manual tracker (the brief's fallback — superseded by real
  tracking unless a store gap makes it useful). Web push (email first; push is a fast follow).
- **Still out** (per brief): scraping, native apps, browser extension, affiliate links,
  budgeting integrations, white-label.
- **Copy consequence:** the landing page's "Amazon, Target, and Best Buy" lines soften to
  match reality at `/prd` time — founding users were promised store voting, not Target.

## Architecture sketch (drafts the `/architecture` brief)

- **App:** migrate the landing SPA into a **Next.js app on Vercel** (framework stack default).
  Landing page becomes the marketing route; app routes behind Supabase auth (magic link).
  Server work (LLM calls, pollers, email) lives in API routes + Vercel cron. Alternative
  considered: keep Vite + Supabase Edge Functions — viable, but splits the codebase across
  two runtimes; decide at `/architecture`.
- **Data model (Supabase Postgres, RLS on every table):**
  - `alerts` — user_id, raw_text, parsed {product_query, stores[], threshold_cents |
    discount_pct}, status (active/paused/triggered), created_at
  - `tracked_products` — store, external_id (SKU/ASIN), url, title, image
  - `alert_products` — alert_id ↔ product_id (an alert can watch one product at N stores)
  - `price_points` — product_id, price_cents, observed_at, source
  - `notifications` — alert_id, price_point_id, sent_at (dedup: one alert per drop window)
  - `entitlements` — user_id, plan, source (founding_user_3mo), expires_at
- **Price-source boundary:** a `PriceSource` interface (`search(query)`,
  `getPrices(external_ids[])`) with `BestBuySource` and `KeepaSource` implementations; Target
  is a stub that returns "not yet supported." All retailer weirdness stays behind this seam.
- **Polling:** Vercel cron → 15-min job over products watched by paid users, daily job for
  free tier. Batch calls (Best Buy supports multi-SKU queries [ASSUMPTION — confirm current
  batch size]; Keepa accepts multiple ASINs per request). At 1,000 tracked products this fits
  Best Buy's 50k/day cap and Keepa's €49–99 tier (see research cost model).
- **LLM endpoints:** `/api/parse` (sentence → structured alert, strict schema, per-user rate
  limit, ~20-case eval set per `/ai-integrate`) and `/api/verdict` (price history → one-line
  read). Keys server-side only.
- **Email:** Resend (free tier) fired from the polling job on threshold crossing.
- **Product resolution UX:** parse → store search → user confirms the exact product match
  before the alert goes live. This confirm step is what prevents wrong-product alerts, the
  most likely trust-killer.

## Build phases (post-GO; each ends at a verification gate)

| # | Phase | Contents | Gate (captured evidence) | Est. |
|---|---|---|---|---|
| 1 | Foundation | Next.js migration, Supabase auth, alerts CRUD dashboard (parse stubbed as a form) | e2e: signup → create → pause → delete alert | 1–2 sessions |
| 2 | Alert Builder | `/api/parse` + structured outputs + eval set + rate limits | ≥90% on the eval set; injection cases handled | 1 session |
| 3 | Best Buy live | BestBuySource (search + prices), product-confirm UX, polling job, threshold email | a real alert fires end-to-end on a live Best Buy price change | 2–3 sessions |
| 4 | Amazon + history | KeepaSource, price-history chart, `/api/verdict` | history + verdict render for a real ASIN; freshness documented | 2 sessions |
| 5 | Founding users | waitlist import from `dropwatch_leads`, 3-months-Pro entitlements, invite email (the one email promised) | first founding user activated end-to-end | 1 session |

Then the standard gates: `/review`, `/security-check` (RLS on every new table, LLM injection,
key handling), `/observability` (poller failure alerting — a silently dead poller is the worst
failure mode for this product), `/ship`.

**Total: ~7–9 sessions (≈2.5–3 weeks part-time).**
**Running cost at MVP scale: ~$55–110/month** (Keepa; Best Buy $0; Resend/Supabase/Vercel free
tiers) + LLM pennies. First dollar of infra spend lands in phase 4.

## Open decisions for the formal gates

1. Next.js migration vs. Vite + Edge Functions (at `/architecture`).
2. LLM provider: Gemini (brief) vs. Claude (stack) (Phase 0, decision log).
3. "Instant" honesty: what polling interval the Pro copy promises, pending Keepa freshness
   findings (at `/prd`).
4. Launch-store copy softening for Target (at `/prd`/`/positioning`).
5. Whether paste-a-price survives as a feature for uncovered stores (at `/prd`).
