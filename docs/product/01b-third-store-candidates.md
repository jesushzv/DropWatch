# DropWatch — Third-store candidates (Target replacement)

> Follow-up research pass, 2026-08-23, after the founder asked whether another store could take
> Target's launch slot. Same protocol as `01-price-data-sources.md`: claims labeled
> [FACT]/[INFERENCE]/[ASSUMPTION], sources dated. Sourcing caveat: the sandbox proxy blocked
> direct fetches (notably developer.ebay.com); snippet-sourced evidence is labeled as facts
> about what the source says, not verified page content.

**Question:** Which US retailer (other than Target) could be DropWatch's third launch store
alongside Best Buy and Amazon-via-Keepa — judged on (a) legitimate, non-affiliate data
access, (b) monthly cost at ~1,000 tracked products with 15-minute polling, (c) audience fit?

## The cost yardstick

[INFERENCE] 1,000 products × 96 polls/day = ~96,000 checks/day ≈ 2.88M/month. Any commercial
per-request source at the $0.01–0.03 rate that killed Target costs **$29k–86k/month** at full
cadence — so the only viable paths are a free official API with batching/high limits, or
nothing.

## Findings by candidate

### 1. Walmart — official API exists, but it IS the affiliate API

- [FACT — snippets 2026-08-23] Walmart.io's Product Lookup API "gives access to item price
  and availability in real-time" ([walmart.io Product Lookup docs](https://walmart.io/docs/affiliates/v1/product-lookup)).
- [FACT] It lives under the **Affiliate / Content Provider API**: approval "requires a solid
  business case, and Walmart is selective" ([zinc.com/blog/walmart-api](https://www.zinc.com/blog/walmart-api));
  Walmart's affiliate service provider is Impact Radius, acceptance "in their sole
  discretion" ([affiliates.walmart.com](https://affiliates.walmart.com/faqs)).
- [FACT] Rate limit: 5,000 calls/day, higher by request
  ([developer.walmartlabs.com Terms](https://developer.walmartlabs.com/API_Terms_of_Use) —
  **staleness warning:** legacy domain; may predate current walmart.io terms).
- [FACT — absence] No documented ongoing-sales quota to *retain* access was found (unlike
  Amazon's Creators API, which requires 10+ sales/30 days). Absence of documentation is not
  absence of a clause in the signed agreement.
- [INFERENCE] $0 cost if approved; 5,000 calls/day covers 1,000 products at 15-min cadence
  **only if batch lookup exists** (≥20 items/call) — [ASSUMPTION] until keys are in hand.
  Audience fit is the best of any candidate; "Sony XM5s under $250" works verbatim.
- **Blocked/unblocked by one founder policy call:** does the brief's "no affiliate links"
  mean "no affiliate-program *membership* at all"? Walmart requires membership but (as far as
  documented) not sales.

### 2. eBay — free API, gated behind the eBay Partner Network, and wrong semantics

- [FACT — snippets 2026-08-23] "Use of eBay's Buy APIs in production is intended for eBay
  partners only… apply through the eBay Partner Network… meeting the standard eligibility
  requirements is not a guarantee" ([developer.ebay.com Buy API requirements](https://developer.ebay.com/api-docs/buy/static/buy-requirements.html)).
  No API fees; ~5,000 calls/day default.
- [INFERENCE] EPN is eBay's affiliate network; approval is judged on driving eBay purchases —
  weak odds for a no-affiliate app. Bigger problem: eBay has no single SKU price (thousands
  of listings by seller/condition), price history and "lowest in 6 months" don't map, and
  eBay's own free saved-search alerts already do the eBay version of this job. **Pass.**

### 3–7. Home Depot, Lowe's, Newegg, B&H, Costco — disqualified

- [FACT — snippets 2026-08-23] Home Depot: no official API; BigBox API from $15/mo for 500
  credits ≈ $0.03/request ([trajectdata BigBox pricing](https://trajectdata.com/ecommerce/big-box-api/pricing/)).
  Lowe's: the APIM portal is B2B/supplier infrastructure, not a public consumer-app API.
  Newegg: seller-only Marketplace APIs. B&H: no API at all, affiliate program only. Costco:
  ToS bans bots/data mining; scraper-only.
- [INFERENCE] All land in the Target cost/legal class (~$29k–86k/mo at cadence, or
  ToS-hostile). **Kill.**

### 8. Kroger — the only clean free official API found; wrong audience

- [FACT — snippets 2026-08-23] Public Products API free for registered developers, 10,000
  calls/day, no partner agreement ([developer.kroger.com](https://developer.kroger.com/reference/api/product-api-public)).
- [INFERENCE] Groceries are replenishment, not wishlist price-drops; store-specific prices.
  Feasibility A+, audience fit D. **Park** (possible future grocery-staples experiment).

## Verdict

**No candidate cleanly takes Target's slot. Launch with two stores (Best Buy +
Amazon/Keepa) and let founding users vote — with one cheap experiment in parallel:**

| Rank | Candidate | Non-affiliate access | Cost @ 1k/15-min | Fit | Call |
|---|---|---|---|---|---|
| 1 | Walmart | Affiliate *membership* gated; no documented sales quota | $0 if approved (batch unverified) | Excellent | **Conditional — free application worth submitting** |
| 2 | eBay | EPN-gated | $0 if approved | Poor semantics | Pass |
| 3 | Kroger | Clean | $0 | Poor (grocery) | Park |
| 4–8 | HD / Lowe's / Newegg / B&H / Costco | None | Target-class | Good–poor | Kill |

Note: the MVP excludes live retailer integrations anyway — this decision affects
**landing-page claims and roadmap sequencing only**. The current ballot copy ("Target,
Walmart, and more are on the ballot") makes no per-store promise and survives every finding
here.

## Follow-ups

1. **Submit the walmart.io Content Provider application** (free, ~1 hour): describe DropWatch
   honestly — price alerts, plain links, no tracking links — and ask affilops@wal-mart.com
   whether retaining API access requires active affiliate-link usage or sales. The approval
   decision is the one fact desk research cannot produce.
2. **Founder decision for `docs/knowledge/decisions.md`:** does "no affiliate links" mean "no
   affiliate-program membership at all"? This one line blocks or unblocks Walmart and eBay
   entirely.
3. From inside registered developer accounts: verify Walmart batch-lookup limits (items per
   call) — this determines whether a 5k/day cap can serve the 15-minute Pro promise.
