# Best Buy Developer / Products API terms — deep-read (Phase 0 item 3, research half)

> Research pass, 2026-08-23, executing the research portion of GO-day plan Phase 0 item 3
> (`02-go-day-plan.md`); the founder's support email to Best Buy dev support is the other
> half and remains open. Protocol per `.claude/references/research-protocol.md`: claims
> labeled [FACT]/[INFERENCE]/[ASSUMPTION], sources dated.

**Question:** As of 2026-08-23, what do the Best Buy Developer API terms say about
(1) caching/storing price data, (2) attribution, (3) key application
requirements/cost/timeline, and (4) rate limits and batch SKU lookups — and which of the
plan's three pre-committed decision branches does the evidence support?

**Prior context:** `01-price-data-sources.md` (2026-08-22) covered this at snippet level and
flagged the caching clause as the top risk. This pass deepens that; it does not contradict it.

## Sourcing caveats (read first — they bound every claim below)

- **[FACT — 2026-08-23]** Direct fetches of `developer.bestbuy.com/legal`,
  `bestbuyapis.github.io`, and `jentic.com` were **blocked by the sandbox egress proxy**
  (same failure mode as the 2026-08-22 pass; captured errors: `EGRESS_BLOCKED` for each
  domain). All claims about these pages are therefore **"what the source says per
  search-result snippet/summary," not verified page content.**
- A further degradation this pass: several quotes below come through the search engine's AI
  summary layer, one step removed from raw snippets. One summary rendered the caching clause
  as "you **may** store or cache content except on a temporary basis…" — grammatically
  garbled; the clause is almost certainly "**may not** store or cache… except on a temporary
  basis" [INFERENCE: the "except" construction only parses with a negation, and the same
  summary calls it a "caching restriction"]. Exact polarity and wording need the founder's
  own read of the page.
- No "last updated" date for the ToS page could be captured. Treat all ToS quotes as undated
  text of unknown revision.

## 1. Caching / storage clause

- **[FACT — per search-result summaries of developer.bestbuy.com/legal, two independent
  queries, 2026-08-23]** The current terms cap caching at **72 hours** and scope its purpose:
  content may be stored/cached only "on a temporary basis **not to exceed seventy-two (72)
  hours** solely **as necessary to provide better response times for displaying such
  Content**." This is more specific and more restrictive than the "no caching except on a
  temporary basis" paraphrase in the plan — there is a hard number, and the permitted purpose
  is display performance, not analysis.
- **[FACT — per search-result summary of the same page, 2026-08-23]** The terms also prohibit
  users from "reproduc[ing], modify[ing], sell[ing], distribut[ing], download[ing],
  transmit[ting], or **creat[ing] derivative works** of the Service or the Content, in whole
  or in part."
- **[INFERENCE]** A stored per-product **price-history table is on the wrong side of both
  clauses as snippeted**: it retains content far beyond 72 hours, for a purpose (trend
  analysis, "lowest in 6 months" verdicts) that is not "better response times for
  displaying," and a longitudinal price database is plausibly a "derivative work"/compilation.
  This reads **prohibited-leaning, not merely ambiguous**, for the price-history and
  deal-verdict features.
- **[INFERENCE]** The plan's middle branch ("rolling last-N points, defensible as temporary")
  is **weaker than the plan assumed**: the 72-hour cap gives a bright line, so the maximally
  defensible fallback is a rolling **≤72-hour** window, and even that is purpose-scoped to
  display caching, not baseline comparison. However —
- **[INFERENCE]** The **core alerting loop can be built to require no stored Best Buy content
  at all**: the user's threshold is user data, not Best Buy content; each poll fetches a
  fresh price and compares it to the threshold in-flight. The dedup/re-arm state ("was it
  below threshold last poll?") is one boolean/price-point per product, discardable within 72
  hours. So the caching clause threatens the *history/verdict features*, not Best Buy
  alerting itself.
- **[FACT — absence finding, 2026-08-23]** Searched for precedent of consumer price-history
  trackers openly built on the official API: found scraper-vendor tutorials (Oxylabs, Bright
  Data — they scrape precisely because they aren't bound by the API terms) and generic "build
  a price tracker with the official API" marketing (stevesie.com, nextract.dev), but **no
  example of a consumer app publicly displaying long-horizon Best Buy price history sourced
  from the official API**. Absence is consistent with the prohibition reading.

## 2. Attribution

- **[FACT — per search-result summary of developer.bestbuy.com/legal, 2026-08-23]** "You must
  **clearly and conspicuously attribute the source of all Content as received from Best
  Buy**." Additionally: may not "modify, obscure or otherwise disable the functioning of
  **links** to the Website… provided within the Content," and may not "omit, modify or
  obscure the text, images, artwork, **logos, copyright or similar notices**" in received
  content.
- **[FACT — search snippets, carried from 2026-08-22 pass]** Failure to attribute is grounds
  for key suspension; response links expire after 7 days.
- **[FACT — absence finding, 2026-08-23]** No language found distinguishing **UI vs. email**
  surfaces. **[INFERENCE]** "All Content" plus "clearly and conspicuously" means alert emails
  showing a Best Buy price/product are attribution surfaces too — the plan's Phase 3 scoping
  (attribution in product-confirm UI **and** alert emails) is the right conservative read.
  The 7-day link expiry is a real constraint for emails: a triggered alert email should link
  via a freshly-fetched URL, not one stored at alert-creation time.
- **[FACT — absence finding, 2026-08-23]** No specific logo/badge/branding-kit requirement
  surfaced ("attribute the source" wording only). Exact required form (text vs. logo) is
  unresolved — cheap to ask in the same support email.

## 3. API key application

- **[FACT — Best Buy's own Medium announcement, snippet, re-confirmed 2026-08-23]** "Best Buy
  no longer takes new key requests if the email listed is from a free email service" —
  **business/company email required** for new Products API keys; the Commerce API
  additionally requires an invite, the Products API does not. (Policy dates to ~2016 per
  DZone/API Evangelist coverage; no evidence found of it being relaxed.) The plan's
  assumption is confirmed at snippet level.
- **[FACT — search snippets: stevesie.com "it's free to use — you simply need to register,"
  nextract.dev pricing page, 2026-08-23]** Third-party sources describe the key as **free**.
  **[ASSUMPTION — still not confirmed against Best Buy's own current pages]** No pricing
  found anywhere, but the portal itself remains unfetchable. Upgrade from the plan's bare
  [ASSUMPTION] to "assumption with corroborating secondary sources."
- **[FACT — absence finding, 2026-08-23]** **No source found stating an approval timeline** —
  not on snippets of the portal, not in forums. The 2016 announcement's "wants to get to know
  your company" framing supports the plan's "discretionary, takes time" posture [INFERENCE],
  but "days vs. weeks" is unknowable from outside. Apply early (Phase 0 item 2 already says
  so); the Phases 3↔4 swap contingency stands.

## 4. Rate limits and batch lookup

- **[FACT — per search-result summary citing developer.bestbuy.com/legal and the official
  bestbuy-sdk-js README, 2026-08-23]** Standard approved keys: **50,000 calls/day and 5
  requests/second**; exceeding limits returns **403**. (Matches the 2026-08-22 findings; the
  official JS SDK "automatically throttles to 5 req/s.")
- **[FACT — per search-result summary of bestbuyapis.github.io, 2026-08-23]** Products API
  supports multi-SKU queries via attribute filters (SKU values OR'd with `|`), and "**by
  default the max page size is 100** (meaning 100 unique results)," with pagination beyond
  that.
- **[INFERENCE]** The effective batch ceiling is therefore **~100 SKUs per call** (one
  `sku in(...)`-style query returning up to a 100-result page) — consistent with the earlier
  pass's "~100-SKU batch historically documented." Practical sub-constraint: very long OR'd
  SKU lists may hit URL-length limits before 100; untested. This resolves the plan's
  "[ASSUMPTION — confirm batch size]" to a snippet-level FACT of 100-per-page, pending a live
  API call at key receipt for final confirmation.
- **[INFERENCE — capacity check]** At ~100 SKUs/call, even 1,000 Pro-tier Best Buy products
  on 15-min polls ≈ 10 calls × 96/day = **~960 calls/day**, roughly 2% of quota. Rate limits
  are a non-issue for DropWatch's scale; the binding Best Buy constraint is legal (caching),
  not technical.

## Verdict

**The evidence points to decision branch 1 — plan as if Best Buy denies stored history —
while the support email is pending.** Price-history + deal-verdict should be drafted as
**Amazon-only features** at `/prd`, with Best Buy history as an upgrade-if-cleared, not a
downgrade-if-denied. The middle branch needs one repair: its "rolling last-N points" fallback
should be restated as a **rolling ≤72-hour window** (the snippeted clause gives a bright-line
number the plan didn't have), and even that is purpose-scoped shakily. The good news the plan
can bank: the core Best Buy *alerting* mechanism (threshold vs. fresh fetch, ≤72h dedup
state) appears buildable without violating the caching clause at all, so branch 1 is a
feature haircut, not a store loss.

**What only the founder's support email can resolve** (suggested asks, in priority order):

1. Does storing per-product price observations beyond 72 hours — to show users price history
   and "good deal" context — violate §(caching)/§(derivative works), or is there a permitted
   path (e.g., storing only prices *we displayed to a user*, or aggregate stats)?
2. Is retaining a single last-observed price per product (for alert dedup/re-arm) within the
   72-hour temporary-caching allowance?
3. What form must attribution take (text credit vs. logo), and does it apply to alert emails;
   confirm the key is free and typical approval time for a solo LLC.

**Confidence notes / what would change the picture:**

- Everything from `developer.bestbuy.com/legal` here is **search-summary-mediated, unverified
  text of unknown revision date** — a single direct page read by the founder outranks this
  entire section and could flip the 72-hour number or reveal successor language. That read is
  Phase 0 item 3's other half and remains mandatory.
- If the founder's read shows the caching clause scoped only to *display* caching with a
  separate data-use allowance elsewhere in the ToS (couldn't be ruled out from snippets), the
  verdict softens to "ambiguous — email decides."
- No 2025–2026 deprecation/shutdown announcements for the Developer API surfaced [FACT —
  absence finding, 2026-08-23]; the program appears live and stable.

**Follow-ups:**

1. Founder's direct full-text read of `developer.bestbuy.com/legal` outside the sandbox
   (already planned; now the single highest-value action — the derivative-works and 72-hour
   clauses need exact verbatim capture).
2. Once a key arrives: one live `sku in(...)` call with 100 SKUs to convert the batch-size
   inference into captured output (also settles the URL-length question).
3. The "store only prices shown to users in-session" precedent question — ask in the same
   support email rather than research further.

## Sources

All accessed 2026-08-23, via search snippets/summaries unless noted:
[Best Buy Developer Terms and Conditions](https://developer.bestbuy.com/legal)
(egress-blocked; snippet-only),
[Best Buy API documentation](https://bestbuyapis.github.io/api-documentation/)
(egress-blocked; snippet-only),
[Best Buy Developer Portal — Our APIs](https://developer.bestbuy.com/apis),
[Best Buy's API-access announcement (Medium)](https://medium.com/best-buy-developers/announcing-a-change-to-best-buy-s-api-access-b09afc4bc27a),
[DZone coverage of the email policy](https://dzone.com/articles/best-buy-will-not-issue-api-keys-to-free-email-acc),
[API Evangelist coverage](https://apievangelist.com/2016/03/30/best-buy-will-not-issue-api-keys-to-free-email-accounts-and-wants-to-get-to-know-your-company/),
[bestbuy-sdk-js README](https://github.com/BestBuyAPIs/bestbuy-sdk-js),
[streetmerchant discussion #669](https://github.com/jef/streetmerchant/discussions/669)
(fetched directly; internal-API only, not the developer API),
[stevesie.com Best Buy API page](https://stevesie.com/apps/best-buy-api),
[nextract.dev Best Buy API page](https://nextract.dev/apis/best-buy-api/),
[Oxylabs price-tracker tutorial](https://github.com/oxylabs/best-buy-price-tracker),
[Bright Data Best Buy price tracker](https://brightdata.com/products/insights/price-tracker/best-buy),
[publicapis.io Best Buy entry](https://publicapis.io/best-buy-api).
