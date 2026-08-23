# DropWatch — Price-Data Source Research (US retailers)

> Research pass run 2026-08-22 by the research-analyst agent, ahead of any GO decision, so the
> full-MVP architecture choice starts from current facts instead of stale priors. Claims are
> labeled [FACT]/[INFERENCE]/[ASSUMPTION] per the research protocol; sources dated 2026-08-22.
> Access note: the research sandbox's egress proxy blocked direct fetches to several vendor
> sites (developer.bestbuy.com, keepa.com, webservices.amazon.com, trajectdata.com,
> priceapi.com, and others) — for those, evidence is dated search-result snippets, labeled as
> such: facts about what the source says, not independently verified page content.

**Question:** What are the current (2026-08) availability, cost, and terms of live price-data
sources for Best Buy, Amazon, and Target, plus multi-retailer aggregators, and what store
phasing + monthly cost should DropWatch's MVP plan for (100–1,000 tracked products;
15–30-min polling for paid, daily for free)?

## Prior context

Checked `docs/knowledge/decisions.md`, `assumptions.md`, `lessons.md` — all empty tables; no
prior research on retail price data. Nothing relevant found.

---

## 1. Best Buy Developer API

- **[FACT — search snippets, 2026-08-22]** The Best Buy Developer Portal
  ([developer.bestbuy.com](https://developer.bestbuy.com/)) is live and describes an API suite
  for querying "Products, Stores, Categories, and much more"; documentation is also mirrored at
  [bestbuyapis.github.io/api-documentation](https://bestbuyapis.github.io/api-documentation/).
  No shutdown or deprecation notices surfaced in searches.
- **[FACT — search snippet of Best Buy's own Medium announcement, 2026-08-22]** Best Buy
  [announced a change to API access](https://medium.com/best-buy-developers/announcing-a-change-to-best-buy-s-api-access-b09afc4bc27a):
  "Best Buy no longer takes new key requests if the email listed is from a free email service"
  (Gmail/Yahoo etc.). New sign-ups require a company/business email address. The Commerce API
  additionally requires contacting Best Buy for an invite; the Products API does not.
- **[FACT — search snippets, 2026-08-22]** Standard approved keys are rate-limited to
  **5 requests/second and 50,000 calls/day**; exceeding limits returns 403
  ([developer.bestbuy.com/legal](https://developer.bestbuy.com/legal) snippet,
  [nextract.dev](https://nextract.dev/apis/best-buy-api/), Bubble forum thread).
- **[FACT — search snippets, 2026-08-22]** The Products API exposes live prices: `salePrice`
  field, `onSale=true` filtering, "regular and sale prices," and "most product information is
  updated near real-time, including product pricing"
  ([bestbuyapis.github.io](https://bestbuyapis.github.io/api-documentation/),
  [publicapis.io](https://publicapis.io/best-buy-api)).
- **[FACT — search snippet of ToS, 2026-08-22]** Relevant terms from
  [developer.bestbuy.com/legal](https://developer.bestbuy.com/legal): mandatory, conspicuous
  attribution of content to Best Buy (failure = key suspension); **no caching content "except
  on a temporary basis"**; response links expire after 7 days; if the app offers commerce, Best
  Buy must be included among commerce options in the first/primary tier.
- **[ASSUMPTION — untested]** The API key is free of charge. Historically true and no pricing
  was found anywhere, but the portal could not be fetched to confirm current terms.
- **[INFERENCE]** A consumer price-alert app is likely permissible (the API exists for
  third-party product/price display; attribution rules assume consumer-facing apps), **but the
  "no caching except temporary" clause may prohibit storing long-term price history**, and
  DropWatch's alerting model (store last-seen price, compare on poll) sits in a gray zone.
  Needs a direct ToS read or a question to Best Buy dev support.

## 2. Amazon

### (a) Product Advertising API 5.0 — effectively dead; its replacement is worse for DropWatch

- **[FACT — search snippets incl. Amazon's own docs page titled "PA-API 5 Deprecation Notice",
  2026-08-22]** PA-API 5.0 was **deprecated April 30, 2026, endpoint shut down May 15, 2026**;
  Offers V1 (live pricing) retired January 31, 2026. Replacement is the **Amazon Creators API**
  ([freshstore.com migration guide](https://blog.freshstore.com/amazon-creators-api-pa-api-retirement/),
  [dev.to auth-layer post](https://dev.to/th3nate/amazon-pa-api-v5-is-shutting-down-april-30-2026-here-is-what-changes-at-the-auth-layer-22ek)).
  Any plan assuming PA-API 5.0 is available is stale as of today.
- **[FACT — search snippets, 2026-08-22]** Creators API access requires an approved Amazon
  Associates account **plus 10+ qualifying (shipped) sales in the trailing 30 days per
  marketplace**; falling below 10 suspends access. Starts at 1 req/sec, scaling with affiliate
  sales. Free to use
  ([velantio.com](https://velantio.com/blog/how-to-get-amazon-creators-api-access),
  [keywordrush.com](https://www.keywordrush.com/blog/amazon-creator-api-what-changed-and-how-to-switch/)).
- **[INFERENCE]** Creators API is **not viable** for an app that explicitly won't use affiliate
  links (a hard "not in MVP" in the brief): access is conditioned on continuously generating
  affiliate sales, so a no-affiliate DropWatch could never earn or keep access.

### (b) Keepa API (Amazon data reseller, includes price history)

- **[FACT — search snippets from revenuegeeks.com and keepa.com/api-docs, 2026-08-22]** Keepa
  API is a **prepaid monthly subscription priced by token-generation rate, no free tier**.
  Entry: **€49/month for 20 tokens/minute** (≈28,800 tokens/day, ≈892,800/month). Preset tiers
  at €459, €2,499, €11,099, with a slider for custom rates in between. Effective cost ≈ €5.49
  per 100k tokens at entry. Tokens expire 60 minutes after generation
  ([revenuegeeks Keepa API page](https://revenuegeeks.com/software/keepa/api),
  [keepa.com/api-docs](https://keepa.com/api-docs/) — direct fetch blocked).
- **[FACT — search snippets, 2026-08-22]** Most product lookups cost **1 token per ASIN
  including full price history**; extras (offers pages, buy box, forced live update) cost more
  ([keepaapi.readthedocs.io](https://keepaapi.readthedocs.io/en/latest/product_query.html)).
- **[ASSUMPTION — unverified]** Keepa data freshness: standard responses reflect Keepa's own
  crawl cadence, not guaranteed live prices; forcing a live refresh costs extra tokens. The
  default staleness window could not be pinned — verify before promising 15-minute accuracy on
  Amazon.
- **[ASSUMPTION — unverified]** Keepa's API terms permit powering consumer-facing price
  alerts. The license text could not be read; the third-party-tool ecosystem built on it is an
  [INFERENCE] that alert use is tolerated — confirm against the actual license before launch.

### (c) Alternative Amazon data providers

- **[FACT — search snippets, 2026-08-22]** **Rainforest API** (Traject Data): 100 free
  requests/month; cited figures ~$0.01/request base, "Starter $66 for 10,000 credits,"
  "$375/month for 100,000 requests" — roughly $3.75–8.30 per 1,000 requests, an order of
  magnitude pricier than Keepa per check, with no bundled price history
  ([asinspotlight comparison](https://www.asinspotlight.com/blog/asinspotlight-api-vs-rainforest-api)).
- **[FACT — search snippet, 2026-08-22]** Anecdotal ceiling: one team reported Keepa costs
  reaching **€500/month** at scale
  ([Pangolinfo Medium post](https://medium.com/@pangolinfo/how-we-escaped-keepas-500-month-trap-and-built-our-own-amazon-data-infrastructure-2f4e8939e8af)
  — vendor-interested source; treat as marketing-adjacent).

## 3. Target

- **[FACT — 2026-08-22]** No official public Target API for product prices exists. Target's
  official APIs are B2B (Target Plus marketplace order management; internal partner
  platforms). Nothing developer-facing for catalog/price retrieval.
- **[FACT — search snippets, 2026-08-22]** The unofficial **RedSky** endpoints still power
  Target.com and return JSON with prices; 2025-dated guides describe them as working
  ([unwrangle guide](https://www.unwrangle.com/blog/how-to-scrape-target-com/),
  [scrape.do guide](https://scrape.do/blog/target-scraping/)). **But** recent reports say
  Target captcha-blocks datacenter/home IPs and "the API seems to have become more closed off
  recently" — scrapers now route through residential proxies. **[INFERENCE]** RedSky is free
  but operationally unstable and adversarial; unsuitable as the load-bearing source for a paid
  product.
- **[FACT — search snippets, 2026-08-22]** Commercial Target-data pricing: **RedCircle API**
  (Traject Data, Target-specific) from **$15/month for 500 credits** (~$0.03/request entry).
  **Unwrangle** (covers Target, Amazon, Best Buy, Costco, Lowe's, etc.): plans **from
  $99/month**, 1 credit/request. **ScraperAPI**: Hobby $49/month for 100,000 credits, but
  Target requires anti-bot measures that multiply credit cost.
- **[FACT — search snippets of Target's T&Cs, 2026-08-22]** Target's Terms & Conditions
  **expressly prohibit scraping**: "any use of data extraction, scraping, mining, or other
  data gathering tools, or creating a database by systematically downloading or storing site
  content" ([scrapeops](https://scrapeops.io/websites/target/)).
- **[FACT — 2026-08-22]** Legal posture: under *hiQ v. LinkedIn* (9th Cir., 2022), scraping
  public data likely isn't a CFAA violation, but **breach-of-contract and state tort claims
  remain live** — hiQ ultimately took a $500k judgment and an injunction
  ([Morgan Lewis](https://www.morganlewis.com/blogs/sourcingatmorganlewis/2022/12/linkedin-v-hiq-landmark-data-scraping-suit-provides-guidance-to-data-scrapers-and-web-operators)).
  **[INFERENCE]** Scraping Target (directly or via a vendor) is probably low criminal risk but
  carries real civil/ban risk against explicit ToS; a commercial intermediary shifts
  operational burden, not necessarily legal exposure, for a branded consumer app.

## 4. Multi-retailer aggregators

- **[FACT — search snippets, 2026-08-22]** **PriceAPI** (metoda): credit-based; Starter
  **€499/month for 50,000 credits**; EU-comparison-shopping oriented; Target/Best Buy coverage
  not confirmed. **[INFERENCE]** Poor fit.
- **[FACT — search snippets, 2026-08-22]** **SerpApi Google Shopping**: ~$25/1,000 searches
  ($75/month for 5,000). **[INFERENCE]** Useful for product discovery/onboarding, but fuzzy
  product matching, lagging prices, and cost make it wrong for the polling loop.
- **[FACT — search snippets, 2026-08-22]** **Unwrangle** is the closest single-vendor
  multi-retailer fit found (Amazon, Target, Best Buy, Costco, Lowe's, Sam's Club; from
  $99/month, 1 credit/request). Credits-per-tier beyond the $99 floor not captured.
- **[FACT — absence finding, 2026-08-22]** No aggregator was found offering *retailer-official*
  (non-scraped) multi-retailer price data. Every multi-retailer option located is
  scraping-based.

---

## Verdict

**Recommended phasing: (1) Best Buy at launch, (2) Amazon via Keepa at or shortly after
launch, (3) Target deferred — daily-only via a commercial API (RedCircle/Unwrangle) only if
validation shows Target demand justifies ~10x the data cost.**

**Cost model** — 1,000 tracked products: 300 paid-tier at 15-min polls (96 checks/day each),
700 free at daily polls:

| Store | Volume | Cost |
|---|---|---|
| Best Buy (official API) | 300×96 + 700 = 29,500 calls/day — under the 50,000/day cap even with zero batching | **$0** |
| Amazon (Keepa) | ≈885,000 tokens/month vs. €49 plan's ~892,800 — fits with ~1% headroom; buy one slider notch up | **€49–99 ≈ $53–107/mo** [INFERENCE] |
| Target (if added, daily-only, 1,000 products) | 30,000 req/mo × ~$0.01–0.03 | **~$300–900/mo — deferred** |
| Target at 15-min for 300 paid products | 864,000 req/mo × $0.01+ | **≥$8,600/mo — non-starter** |

**Total recommended stack (phases 1–2): roughly $55–110/month.** Worst case (all 1,000
products on 15-min polling): Best Buy needs request batching [ASSUMPTION — ~100-SKU batch
queries historically documented, current docs unfetched] and Keepa ≈ €120–170/month — still
cheap. The binding constraint is never Amazon/Best Buy cost; it's Target.

**Top 2 risks:**

1. **Both launch stores rest on unverified terms.** Best Buy's "no caching except on a
   temporary basis" clause may prohibit the stored price baselines (and price-history feature)
   DropWatch needs, and its business-email-gated approval is discretionary; Keepa's API
   license terms on powering consumer alerts could not be read at all. Either vendor could
   lawfully cut DropWatch off. Mitigation: read both ToS in full (outside the research
   sandbox) and email both developer-relations contacts before writing code against them.
2. **Amazon coverage is a single-third-party dependency with no official fallback.** PA-API is
   dead (May 2026) and its successor structurally excludes non-affiliate apps, so if Keepa
   repriced, throttled, or lost its own Amazon access, DropWatch's most-demanded store goes
   dark; the fallbacks (Rainforest-class scrapers) cost ~10x per check.

**Follow-ups most worth a deeper pass (founder, outside the sandbox):**

1. Full-text read of Best Buy API ToS (`developer.bestbuy.com/legal`) and the Keepa API
   license — specifically caching/price-history and consumer-alert redistribution clauses.
2. Keepa data freshness: default staleness of a 1-token product response, and token cost of a
   forced live refresh. Determines whether "15-minute alerts" is honest for Amazon.
3. Unwrangle credits-per-tier beyond the $99 floor — if ~$99 buys ≥50k credits/month, a
   daily-polling Target tier becomes affordable earlier than modeled.
