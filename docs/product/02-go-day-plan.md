# DropWatch — Conditional GO-day build plan

> **Status: CONDITIONAL.** This plan activates only when the validation probe resolves GO
> (thresholds in `docs/00-status.md`; decide by 2026-09-12). It exists so the build starts the
> day the signal is clear instead of cold. It fills no gate slots — `/prd`, `/architecture`,
> and `/build-plan` still run formally at GO, using this as their draft input. If the probe
> resolves KILL, the sunk cost of this document is ~zero by design (a $10 domain and one API
> key application).
>
> Inputs: the founder's validation brief (`00-brief.md`) and the price-data research
> (`01-price-data-sources.md`, 2026-08-22). **Merge-order dependency:** the research doc lives
> on PR #4 — merge it before or with this plan, or the citations dangle.
>
> **Adversary verdict (2026-08-22): HOLDS WITH REPAIRS — repairs applied in this revision;
> see the verdict section at the end.** One repair needs a founder decision now (Target copy,
> Phase 0 item 6).

## Phase 0 — during the probe window (near-zero cost, do now)

These have lead times or gate later phases; none of them commits to building.

1. **Buy a domain** (~$10; e.g. a `.app`/`.com` for DropWatch). Unlocks three things at once:
   a business email address (required for the Best Buy API key), a trustworthy display link
   for the Meta ads, and the production URL replacing vercel.app. *Probe-hygiene note: if the
   landing page moves domains mid-probe, keep the old URL redirecting and read the PostHog
   denominator knowing uniques may double-count across the swap.*
2. **Apply for the Best Buy Products API key** with the business email
   (developer.bestbuy.com). Approval is discretionary and takes time; the key is
   [ASSUMPTION] free. Do not build against it yet.
3. **Read the full Best Buy API ToS** (`developer.bestbuy.com/legal`) — specifically the "no
   caching except on a temporary basis" clause — and email their dev support asking whether
   storing per-product price baselines/history for user alerts is permitted.
   **Decision branches (pre-committed):**
   - *Best Buy denies stored history* → price-history + deal-verdict become Amazon-only
     features; the demo's "Lowest price in 6 months" framing for Best Buy changes at `/prd`;
     recorded in decisions.md.
   - *No reply by the GO date* → proceed storing only a rolling last-N price points per
     product (defensible as "temporary"), no long-horizon Best Buy history until cleared;
     recorded as an accepted risk.
   - *Key denied outright* → launch becomes Amazon-only (swap Phases 3↔4), store story
     inverts; treat as a PIVOT-grade input to `/prd`.
4. **Read the Keepa API license** and confirm: (a) consumer-facing price alerts are a
   permitted use; (b) default data staleness of a 1-token product response; (c) token cost of
   a forced live refresh; (d) **keyword-search quality and token cost** (the parse→confirm
   flow depends on `search()`, which the research never assessed).
   **Decision branch:** *staleness > ~15 minutes* → Pro copy promises "checks every 15
   minutes" only for Best Buy, Amazon copy says "several times a day," and forced-refresh
   tokens get budgeted for Pro users' Amazon products — or, if that reads too weak, the
   fallback (Rainforest-class, ~10x/check) is priced before GO, not discovered after.
5. **Decide the LLM provider** for the parse + verdict features. The brief says Gemini; the
   framework stack and this workspace's tooling favor the Claude API. One decision line in
   `docs/knowledge/decisions.md` when made.
6. **RESOLVED 2026-08-22 — Target launch promise.** Founder chose to soften the copy and
   explore a replacement third store. Live copy now reads "At launch: Amazon and Best Buy.
   Founding users vote on what comes next — Target, Walmart, and more are on the ballot"
   (PR #6; merge before the share kit posts). Recorded in the status ledger as a
   founder-directed brief deviation / honesty correction, distinct from the unused
   performance-iteration allowance. Candidate third stores (Walmart, eBay, Home Depot,
   Costco, Newegg, B&H) under research — findings land in
   `docs/product/01b-third-store-candidates.md` and feed `/prd`.

## Scope (from the brief, adjusted by research)

- **In:** Plain-English Alert Builder (LLM parse → structured alert), alert dashboard
  (view/edit/pause/delete), automated price tracking for **Best Buy** (official API) and
  **Amazon** (via Keepa), threshold email alerts, price history + deal-quality verdict
  (subject to the Phase 0 item 3 branch), founding-user onboarding (waitlist import +
  3-months-Pro entitlements).
- **Billing (explicit, not silent):** full Stripe subscription billing is **deferred to
  post-launch** — founding users are on free Pro for 3 months, so no recurring billing is
  needed at MVP ship. Two payment touchpoints ARE in scope: the GO branch's **$5
  reserve-your-spot** uses a **Stripe Payment Link** (no code; created in Phase 0/5), and
  **entitlement lapse** is defined now: when `entitlements.expires_at` passes with billing
  not yet built, users lapse to the free tier (3 alerts, 1 store, daily — per the brief's
  Basic tier), never to a dead account. Subscription billing is release 2's first item.
- **Deferred:** **Target** (no official API, anti-scraping ToS, ~10x data cost — the deferral
  held under adversarial attack; the *copy* implications are Phase 0 item 6). Paste-a-price
  manual tracker (superseded unless a store gap makes it useful). Web push (email first).
- **Still out** (per brief): scraping, native apps, browser extension, affiliate links,
  budgeting integrations, white-label.
- **Free tier shape** (per the brief's pricing section): 3 active alerts, 1 store per alert,
  **daily checks** — which by design cannot catch the hours-long drops the hero copy
  describes. This is acknowledged upsell architecture: the free tier proves the mechanism,
  Pro delivers the speed. The `/prd` should own this trade-off explicitly rather than let a
  reviewer discover it.

## Architecture sketch (drafts the `/architecture` brief)

- **App:** migrate the landing SPA into a **Next.js app on Vercel** (framework stack
  default). Landing page becomes the marketing route; app routes behind Supabase auth (magic
  link). Server work (LLM calls, pollers, email) lives in API routes + Vercel cron.
  Alternative considered: keep Vite + Supabase Edge Functions — viable, but splits the
  codebase across two runtimes; decide at `/architecture`.
- **Hosting cost correction (adversary):** 15-minute cron and commercial use are **not**
  within Vercel's Hobby tier (daily-only crons, non-commercial restriction [FACT as of
  training data — verify current terms at GO]). Budget **Vercel Pro (~$20/month) from Phase
  3**, or schedule via Supabase pg_cron hitting an API route to stay on free tier — decide at
  `/architecture`.
- **Data model (Supabase Postgres, RLS on every table):**
  - `alerts` — user_id, raw_text, parsed {product_query, stores[], threshold_cents |
    discount_pct}, status (active/paused/triggered), created_at
  - `tracked_products` — store, external_id (SKU/ASIN), url, title, image
  - `alert_products` — alert_id ↔ product_id
  - `price_points` — product_id, price_cents, observed_at, source (retention subject to the
    Best Buy caching branch)
  - `notifications` — alert_id, price_point_id, sent_at. **Dedup window defined now, because
    it IS the noise promise:** one notification per alert per continuous
    below-threshold episode; re-arm only after the price closes back above threshold.
  - `entitlements` — user_id, plan, source (founding_user_3mo), expires_at (lapse behavior
    defined in Scope)
- **Price-source boundary:** a `PriceSource` interface (`search(query)`,
  `getPrices(external_ids[])`) with `BestBuySource` and `KeepaSource` implementations; Target
  is a stub that returns "not yet supported." All retailer weirdness stays behind this seam.
- **Polling:** 15-min job over products watched by Pro-entitled users, daily job for free
  tier. Batch calls (Best Buy multi-SKU [ASSUMPTION — confirm batch size]; Keepa multi-ASIN).
- **Best Buy attribution:** the ToS requires conspicuous attribution (key suspension if
  missing) — it goes in the product-confirm UI and alert emails, scoped in Phase 3.
- **LLM endpoints:** `/api/parse` and `/api/verdict`, strict schemas, per-user rate limits,
  eval set per `/ai-integrate`. Keys server-side only.
- **Email:** Resend from the polling job. **Free tier is ~100 emails/day** — fine for alerts
  at MVP scale, NOT for the Phase 5 invite blast if the waitlist exceeds ~100; batch the
  blast over days or budget Resend's paid tier (~$20/mo) for launch month.
- **Product resolution UX:** parse → store search → user confirms the exact product match
  before the alert goes live.

## Cost model (adversary-corrected)

During the founding period **every user is Pro-entitled** (3 free months), so model all-Pro,
not the research's 300/700 split, and count `search()` tokens on every alert creation:

- Keepa: budget **€99–170/month** (one–two slider notches above entry; the €49 tier has zero
  headroom at 300 Amazon products on 15-min polls even before search calls).
- Vercel Pro: **~$20/month** from Phase 3 (or $0 with the pg_cron alternative).
- Resend: $0 until the invite blast; ~$20 for launch month if the waitlist is large.
- Best Buy: $0. LLM: pennies. Supabase: free tier.

**Realistic MVP running cost: ~$130–210/month during the founding period**, dropping toward
the research's ~$55–110 once entitlements lapse and the paid/free mix normalizes. Break-even
arithmetic survives: ~€0.16/Amazon-product-month means a $9.99 Pro user breaks even at ~55
tracked Amazon products — only a pathological tail user loses money.

## Build phases (post-GO; each ends at a verification gate)

| # | Phase | Contents | Gate (captured evidence) | Est. |
|---|---|---|---|---|
| 1 | Foundation | Next.js migration, Supabase auth, alerts CRUD dashboard (parse stubbed) | e2e: signup → create → pause → delete alert; **AND regression: lead capture to `dropwatch_leads` + PostHog `signup_submitted`/UTM verified on the migrated marketing route** | 1–2 sessions (magic-link e2e is the likely overrun) |
| 2 | Alert Builder | `/api/parse` + structured outputs + eval set + rate limits | eval passes **including all adversarial/injection cases** (not just a % — a small eval is gameable) | 1 session |
| 3 | Best Buy live | BestBuySource (search + prices + attribution UI), product-confirm UX, polling job, threshold email | an alert whose threshold is set above the current live price fires on the next poll, end-to-end (schedulable, unlike waiting for a real drop) | 2–3 sessions |
| 4 | Amazon + history | KeepaSource, price-history chart, `/api/verdict` | history + verdict render for a real ASIN; measured staleness documented against the Pro copy | 2 sessions |
| 5 | Founding users | waitlist import, 3-months-Pro entitlements, invite email, $5-reservation Payment Link | first founding user activated end-to-end; invite blast plan sized against Resend limits | 1 session |

**Contingency:** if the Best Buy key hasn't arrived by end of Phase 2, **swap Phases 3↔4**
(Keepa needs payment, not approval). If the key is denied, see Phase 0 item 3's third branch.

**Email-promise constraint (adversary):** founding users were promised **one** email before
launch. The $5 reservation therefore rides **inside the invite email**, not as a separate
send — or the promise change is recorded. Founder call at Phase 5, flagged now.

Then the standard gates, **counted in the estimate this time**: formal `/prd` +
`/architecture` + `/build-plan` at GO, `/ci-pipeline` (once, early — Phase 1), `/review`,
`/security-check` (RLS on every new table, LLM injection, key handling), `/design-review`,
**Legal gate** (privacy policy, ToS, consent, unsubscribe handling — the app now holds
accounts and sends email; load-bearing, per `compliance.md`), `/observability` (a silently
dead poller is this product's worst failure mode), `/ship`.

**Build phases alone: ~7–9 sessions. Realistic time-to-launch including the process gates
above: ~12–16 sessions ≈ 4–6 weeks part-time.** The smaller number is the build; the larger
number is the launch — don't let the headline hide the difference.

## Open decisions for the formal gates

1. Next.js migration vs. Vite + Edge Functions; Vercel Pro vs. pg_cron (at `/architecture`).
2. LLM provider: Gemini (brief) vs. Claude (stack) (Phase 0, decision log).
3. "Instant" honesty per store, pending Keepa staleness findings — **product decision with a
   priced fallback, not a wording tweak** (branch in Phase 0 item 4; lands at `/prd`).
4. Target copy: Phase 0 item 6 — founder decision during the probe, not at `/prd`.
5. Whether paste-a-price survives for uncovered stores (at `/prd`).
6. $5-reservation email placement (Phase 5, constraint above).

## Adversary verdict

**HOLDS WITH REPAIRS — 2026-08-22.** Three kill shots, nine cracks; all repaired in this
revision except the founder decision in Phase 0 item 6 (Target copy), which is open and
time-sensitive. Kill shots repaired: (KS-1) the plan's Target-cut cover story misquoted the
live FAQ — the page promises Target *at launch*, so the copy decision moved from `/prd` to
now; (KS-2) billing was silently absent — now explicit (deferred subscriptions, Payment Link
for the $5 ask, defined entitlement lapse); (KS-3) the two legal unknowns had no decision
branches and the Best Buy demo promise ("lowest in 6 months") was undeliverable at launch —
branches pre-committed in Phase 0. Material corrections: all-Pro founding-period cost model
(€99–170 Keepa + ~$20 Vercel), Vercel free tier can't run 15-min commercial crons,
time-to-launch restated at 12–16 sessions including the framework's own gates, Phase 1 gained
a lead-capture regression gate, Phase 3's gate made schedulable, dedup window defined,
Resend blast limits noted. What survived attack: the store phasing, the Target deferral, the
`PriceSource` seam, the data model, kill-branch hygiene, and the $9.99 unit economics.
