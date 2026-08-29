# Keepa API — license, freshness, token mechanics, pricing (Phase 0 item 4)

> Research pass run 2026-08-23, executing Phase 0 item 4 of `02-go-day-plan.md`. Prior
> context: `01-price-data-sources.md` (2026-08-22), which left Keepa staleness and license as
> [ASSUMPTION]s — this pass resolves staleness and search cost, and partially resolves
> license. Claims labeled per `.claude/references/research-protocol.md`; all sources
> fetched/searched 2026-08-23.

## Question

Do Keepa's API terms permit consumer-facing price alerts; how stale is a standard 1-token
product response; what does a forced live refresh cost; what does `search()` cost and how
good is it; and do current pricing tiers still fit the €99–170/month budget — i.e., does the
"checks every 15 minutes" Pro copy hold for Amazon-via-Keepa, or does the plan's decision
branch activate?

## Sourcing caveats (read first)

- **The egress proxy again blocked every first-party Keepa web property**: `keepa.com`
  (pricing page, api-docs), `discuss.keepa.com` (the canonical API docs live on this forum —
  DNS-level failure), plus `keepaapi.readthedocs.io`, `revenuegeeks.com`,
  `frontdeskreview.com`, `fbamultitool.com`, `saasworthy.com`, `scribd.com`,
  `docs.datavirtuality.com`, and Medium. Same failure mode as the 2026-08-22 pass.
- **What could be verified directly:** the official Keepa-maintained Java client
  (`github.com/keepacom/api_backend`) via raw.githubusercontent — its doc comments mirror
  the API docs and are first-party Keepa text. Quoted claims from it are genuine [FACT]s.
- Everything else is **"what the source says per search snippet"** — dated, linked, but not
  verified page content. Marked `[FACT — snippet]` throughout.
- **The API license text itself was unreachable by every route tried** (keepa.com, a Scribd
  mirror of "Terms and Conditions for Keepa.com's API", CData's summary page, and three
  snippet-phrase searches). Topic 1 is therefore an absence finding plus inference, not a
  verified answer.

## Findings

### 1. Permitted use — consumer-facing price alerts

- **[FACT — absence finding, 2026-08-23]** The license/terms text could not be obtained from
  the sandbox. A third-party copy exists ("[Terms and Conditions For Keepa.com's API](https://www.scribd.com/document/751189100/Terms-and-Conditions-for-Keepa-com-s-API)",
  Scribd doc 751189100 — fetch blocked), confirming a formal API T&C document exists; its
  clauses on redistribution/resale, competing products, and consumer display could not be
  read. Three targeted snippet searches for clause text ("grants you", "may not…
  resell/redistribute/sublicense", "commercial use") returned no quotable terms.
- **[FACT — snippet of Keepa's own API overview, 2026-08-23]** Keepa's API self-description
  includes alerting as a headline capability: the API provides "complete price histories,
  detailed product data, marketplace offers, deals, best seller lists, seller information
  **and product tracking with notifications**" ([keepa.com/api-docs](https://keepa.com/api-docs/)
  via search snippet).
- **[FACT — first-party code, 2026-08-23]** The official Keepa Java client contains a full
  `Tracking` object for API-managed price tracking: desired-price thresholds,
  price-drop/increase and stock notifications, notification channels including `API` and
  webhooks ("currently only supports notifications through push webhooks or API pull
  request"), per-tracking TTL and re-arm timers
  ([Tracking.java](https://github.com/keepacom/api_backend/blob/master/src/main/java/com/keepa/api/backend/structs/Tracking.java),
  fetched raw 2026-08-23).
- **[INFERENCE]** An API that ships a purpose-built threshold-tracking endpoint with webhook
  push — a mechanism only useful for notifying *your own* downstream users — is designed for
  exactly DropWatch's use case; consumer-facing alerts are almost certainly a permitted,
  indeed intended, use. What remains genuinely unknown is any clause limiting **bulk
  redistribution of raw historical data** (DropWatch's price-history charts re-display
  Keepa-derived history) or **competing with Keepa's own consumer product**. Neither could
  be confirmed present or absent.
- **[ASSUMPTION — carried forward, now narrowed]** The 2026-08-22 assumption "alert use is
  tolerated" upgrades to "alert use is intended [INFERENCE]; redistribution/history-display
  limits unknown [ASSUMPTION]". The founder must still read the T&C shown at API checkout
  (outside the sandbox) before Phase 4 code — but this is now a confirm-the-details read,
  not an open question about viability.

### 2. Data staleness of a standard 1-token response

- **[FACT — first-party code, 2026-08-23]** Official Java client doc comment on the product
  request's `update` parameter: *"If the product's last refresh is older than update-hours
  force a refresh. Use this to speed up requests if up-to-date data is not required."* and
  *"Might cost an extra token if 0 (= live data)."*
  ([Request.java](https://raw.githubusercontent.com/keepacom/api_backend/master/src/main/java/com/keepa/api/backend/structs/Request.java),
  fetched raw). Client default: `update = 1` (hour).
- **[FACT — third-party client mirroring official docs, 2026-08-23]** Independent Python
  client comment, same text lineage: *"If the product's last update is older than update
  hours force a refresh. **The default value is 1 hour.**"*
  ([deuexpo/keepa keepa.py](https://github.com/deuexpo/keepa/blob/master/keepa.py), fetched
  raw). Corroborated by search-snippet summaries of the official Products docs
  ([discuss.keepa.com/t/products/110](https://discuss.keepa.com/t/products/110)): data older
  than ~1 hour is refreshed before delivery.
- **[INFERENCE]** So a standard 1-token response guarantees freshness of only **≤ ~60
  minutes** (refresh triggers only when stored data is older than 1 hour). Worst-case
  staleness ~59 minutes. **That is > 15 minutes: the decision branch's trigger condition is
  met for default requests.**
- **[INFERENCE — the branch's own escape hatch works]** But because a 15-minute poll loop
  re-queries every 15 minutes with `update=0`, each request forces a refresh and returns
  live data at ~2 tokens instead of 1 (see topic 3). The staleness problem is a **2x token
  cost problem, not a capability problem**.

### 3. Forced live refresh cost

- **[FACT — first-party code, 2026-08-23]** `update=0` "= live data" and "might cost an
  extra token" (Request.java, above). I.e., **~2 tokens per product per live check** (1 base
  + 1 refresh; the extra token is charged only when a refresh actually occurs).
- **[FACT — snippet, 2026-08-23]** Add-ons scale it up only if requested: live marketplace
  `offers` cost "6 extra tokens per page of 10"
  ([revenuegeeks Keepa API page](https://revenuegeeks.com/software/keepa/api) snippet).
  DropWatch needs only the base price fields → offers not required.
- **[ASSUMPTION — untested]** Refresh *latency* (whether `update=0` blocks until Keepa's
  crawler returns, and how long that takes per ASIN) is undocumented in anything reachable.
  If forced refreshes are queued rather than synchronous, effective freshness could be
  minutes, not seconds. Verify empirically in Phase 4's "measured staleness documented
  against the Pro copy" gate — which the plan already requires.
- **[FACT — snippet, 2026-08-23]** Batch note: product requests take up to 100 ASINs per
  call, but token cost is **per ASIN** — batching saves HTTP round-trips, not tokens.
- **[INFERENCE — alternative path, for `/architecture`]** Keepa's own Tracking endpoint
  (webhook push on threshold cross) has a minimum update interval of **1 hour** ("The update
  interval, in hours… A setting of 1 hour will not trigger an update exactly every 60
  minutes, but as close to that as it is efficient" — Tracking.java, first-party). Too slow
  for the 15-minute Pro promise, but potentially a near-free implementation of the **free
  tier's daily checks**; token cost of Add Tracking not found (absence).

### 4. `search()` — keyword product search

- **[FACT — snippet of official docs, 2026-08-23]** Product Search "costs **10 tokens per
  result page (up to 10 results)**"
  ([discuss.keepa.com/t/product-searches/109](https://discuss.keepa.com/t/product-searches/109)
  via snippet, two independent search corroborations).
- **[FACT — first-party code, 2026-08-23]** Search request parameters per Request.java:
  `term`, `page` ("Valid values 0 - 9. Each search result page provides up to 10 results"),
  optional `stats` ("quick access to current prices, min/max prices and the weighted mean
  values" — useful for the confirm-screen UI in one call).
- **[FACT — snippet discrepancy, noted]** Max results per term: Java client comment says
  "maximum of 50 results per search term"; a 2026 snippet says "up to 100 results per search
  term". Either is ample for a parse→confirm flow showing a handful of candidates; the
  discrepancy is immaterial but flagged.
- **[FACT — absence finding, 2026-08-23]** **Result-quality evidence is thin.** Searches for
  user reports on Keepa keyword-search relevance (Reddit, forums, G2, n8n community) found
  no substantive complaints *and* no substantive praise — the only quality complaint located
  concerns the separate Product Finder endpoint ignoring filters
  ([n8n community, Jan 2026](https://community.n8n.io/t/keepa-api-selection-parameter-ignored-in-code-node-v2-1-5-docker/249411)),
  not keyword search. Keepa's search runs against its own catalog, not Amazon's live search
  ranking [INFERENCE from architecture]; relevance for head-term consumer queries ("PS5
  slim", "AirPods Pro 2") is plausible but **unproven**. This is cheap to test: one €49
  month and ~20 test queries (≈200 tokens) settles it before GO copy hardens.
- **[INFERENCE — cost impact negligible]** Alert creation costing 10 tokens (1 page) is
  noise next to polling: even 100 alert creations/day ≈ 1,000 tokens/day ≈ 0.7 tokens/min
  of capacity.

### 5. Pricing tiers (as of 2026-08-23)

- **[FACT — snippets, 2026-08-23]** Entry unchanged from the 2026-08-22 research: **€49/month
  for 20 tokens/minute** (≈28,800 tokens/day), prepaid, no free tier, tokens expire 60
  minutes after generation; sold as **slider presets with custom rates purchasable between
  tiers** ([revenuegeeks API page](https://revenuegeeks.com/software/keepa/api),
  [frontdeskreview](https://frontdeskreview.com/software/amazon-seller-tools/keepa/)
  snippets).
- **[FACT — snippets, 2026-08-23]** Named notches per 2026-dated snippet sources: **Starter
  €49 / 20 tpm; "Developer" €129 / 60 tpm; "Business" €459 / 250 tpm; "Enterprise" €4,499**.
  Per-100k-token effective price: ~€5.49 (Starter), €4.11 (Developer), €2.80 (Business).
  Discrepancy vs. the 2026-08-22 pass (which had €2,499/€11,099 presets per a different
  snippet): irrelevant to DropWatch's range, but neither set is page-verified — flagged.
- **[INFERENCE — capacity math against the plan]** At ~2 tokens per live-refreshed check,
  15-min polling needs **0.133 tokens/min per Amazon product**. So: 20 tpm (€49) ≈ 150
  products; 40 tpm (≈€99 if the slider is ~linear near entry [ASSUMPTION]) ≈ 300 products;
  60 tpm (€129 per snippet) ≈ 450 products; ~€170 ≈ ~75 tpm ≈ 550+ products. The plan's
  all-Pro founding cohort at ~300 tracked Amazon products lands at **≈€99–129/month —
  inside the budgeted €99–170**, now including the forced-refresh doubling the earlier
  research hadn't priced. Search tokens don't move this.

## Verdict — against the plan's decision branch

**The branch's trigger condition is technically met (default staleness ≤ ~1 hour > 15 min),
but the branch's cheap escape — budgeting forced-refresh tokens — works, so the "checks
every 15 minutes" Pro copy CAN hold for Amazon-via-Keepa without the per-store copy split
and without the Rainforest-class fallback.** Concretely: poll Pro users' Amazon products
every 15 minutes with `update=0` at ~2 tokens/product-check. The Rainforest fallback stays
dead (~$0.01+/check ≈ 7–15x Keepa's ~2 tokens ≈ €0.00011–0.00016/check at the relevant
tiers) — do not price it further.

**The €99–170/month budget still looks right — and now survives the 2x refresh cost it
didn't originally include.** ~300 live-refreshed Amazon products ≈ €99–129; headroom to ~550
products at €170. The €49 tier is confirmed insufficient (≈150 products at live-refresh).

Two residual conditions attach, both already congruent with the plan:

1. **License text remains unread** — alert use is now strongly evidenced as intended (Keepa
   ships a tracking-with-webhooks endpoint), but redistribution/price-history-display
   clauses are unverified. Founder must read the T&C at subscription (outside the sandbox)
   before Phase 4 code; treat as a confirm, not a blocker.
2. **Forced-refresh latency and `search()` relevance are unmeasured** — both are empirically
   testable with the first €49 month; Phase 4's existing gate ("measured staleness
   documented against the Pro copy") covers the first.

## Confidence notes

- Highest-confidence items: `update` mechanics and Tracking endpoint (first-party Keepa
  code, fetched directly). Lowest: exact tier prices/notches (snippet-only, two aggregators,
  with one internal discrepancy) and everything about the license (unread).
- What would change the picture: a license clause restricting display of historical price
  data to end users (breaks the history/verdict feature, not alerts); forced refreshes being
  queued/slow (weakens the 15-min promise to "15-min checks, best-effort freshness"); slider
  pricing being materially non-linear below €129.

## Follow-ups most worth a deeper pass

1. **(Founder, outside sandbox, ~15 min)** Read the API T&C at keepa.com at subscription
   time — specifically redistribution/derived-display of price history and any non-compete
   clause — and log the outcome in `docs/knowledge/decisions.md`.
2. **(First paid month, ~1 hour)** Empirically measure `update=0` end-to-end latency and
   actual token draw on ~20 real ASINs, and run ~20 consumer-vocabulary queries through
   `search()` scoring top-3 relevance — this single session closes both remaining
   [ASSUMPTION]s and feeds the Phase 4 gate.
3. **(Optional, at `/architecture`)** Price the Add Tracking endpoint (token cost not found)
   as a near-free implementation of the free tier's daily checks — could cut free-tier
   polling cost to ~zero.
