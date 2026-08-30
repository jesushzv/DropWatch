# Project Status

> Single source of truth for where this project is in the lifecycle. Every phase command updates this file. `/workflow-status` reads it; artifacts on disk outrank it if they disagree.

- **Project:** DropWatch — plain-English price-drop alerts, zero noise
- **Idea file:** `docs/product/00-brief.md` (external validation brief, supplied complete by the founder)
- **Stage:** Validate
- **Last updated:** 2026-08-29
- **Next command:** unchanged by the PR #16 review — the probe is still the priority. Clear the last
  pre-ads blocker — `privacy@usedropwatch.com` mail forwarding
  (still 0 MX records as of 2026-08-24; the pixel and domain are done and verified) → confirm
  PageView + Lead in Meta Events Manager → launch Meta ads per `marketing/ads/ads-kit.md` → post
  the share-kit posts with UTM-tagged links (`?utm_source=reddit|facebook|x|dm`) →
  `/validate-idea` converts the probe when the thresholds resolve (decide by 2026-09-12)

## Gate ledger

| Gate | Verdict | Date | Notes |
|---|---|---|---|
| Validation | PENDING PROBE | 2026-08-22 | Landing page live (Vercel preview; production on merge). Probe = founding-user email capture to Supabase `dropwatch_leads`; denominator + payment-intent via PostHog (pageviews by utm_source, `signup_submitted` by source/tier, `tier_click`). Thresholds below — COMMITTED, founder approved 2026-08-22 |
| PRD | — | | brief covers scope; formalize with `/prd` post-GO. **Now an input gap:** the architecture brief had to be written against `00-brief.md` because `docs/product/02-prd.md` does not exist |
| Positioning | — | | brief covers positioning; formalize post-GO |
| Architecture | DONE | 2026-08-29 | `docs/engineering/01-architecture.md`. Verdict: keep the app as the MVP, do not rebuild (ADR-1), conditional on four cuts — Supabase Postgres + RLS (ADR-2), Supabase Auth (ADR-3), Anthropic direct (ADR-4), delete dead vendor surface (ADR-7). Hosting: Vercel serverless (ADR-5). MVP ships manual price logging only; PriceAPI imports built but disabled (ADR-6). **Written against `00-brief.md` — no PRD exists.** Brief only; nothing implemented, and nothing should be until the validation gate resolves |
| Build plan | — | | phases: 0/0 complete |
| CI pipeline | SET UP | 2026-08-29 | `.github/workflows/ci.yml`: landing-page job (build + asserts root-relative asset base) and app job (typecheck, test, build + asserts vendor runtime stays out of the bundle). Runs a MySQL service so the six integration suites execute rather than skip — **112 passed / 2 skipped in CI**, vs 105/9 without a database — and fails the job if an integration suite skips, so a broken database cannot look green. Job timeouts and concurrency cancellation set. Added while reviewing PR #16; the repo had no CI before |
| Review | RESOLVED | 2026-08-29 | Full review of PR #16 found it would have taken production down — verified on its own Vercel preview that `/` served the bundled Express server as text/plain and `/landing-page/` 404'd. Fixes in #17 (merged into #16, then #16 → main, commit 0c8ec66): landing restored to the root, app moved to `app/`, 6 security fixes, suite made hermetic (8 failures → 0), production HTML 368 kB → 826 B, initial JS 929 → 531 kB, CI added. Production re-verified after merge: landing page at `/`, `/privacy` 200, Meta Pixel and `dropwatch_leads` capture intact. Follow-up in PR #18 closed the coverage gaps: **50 → 112 tests**, adding router authorization coverage (every protected procedure rejects anonymous callers; row ownership comes from the session, never from input) and covering the six security fixes. Each new suite was mutation-tested. Still owed: `/security-check`, and eslint/prettier which have no CI gate |
| Security | — | | Landing-scope only: RLS insert-only on `dropwatch_leads` verified 2026-08-22. App scope not yet gated — `/security-check` is owed before `app/` ships. Fixed while reviewing PR #16: unauthenticated storage proxy, non-expiring provider callback signature, SameSite=None session cookie, missing appId check, test-auth reachable with NODE_ENV unset, state-changing GET unsubscribe |
| Design review | — | | done / skipped-on-record |
| Perf audit | — | | done / skipped-on-record |
| Legal (first deploy) | PENDING CONTACT | 2026-08-24 | Landing scope: privacy policy + terms live on production (`/privacy`, `/terms`, both HTTP 200) and footer-linked. Consent banner NOT required — session replay verified off (0 `$snapshot` events in PostHog, 2026-08-23). Stripe Tax N/A: nothing is sold. **Blocker unchanged:** `privacy@usedropwatch.com` has no MX records as of 2026-08-24, so the published contact bounces. Gate flips to PASS on a received test email, not on a provider dashboard checkmark. |
| Observability | — | | verified / skipped-on-record |
| Ship | — | | |
| Launch | — | | |

## Probe thresholds — COMMITTED 2026-08-22 (founder approved)

> Pre-committed before traffic so no result can be rationalized after the fact. Read the
> numbers on the PostHog dashboard "DropWatch Probe":
> https://us.posthog.com/project/550322/dashboard/2021853
>
> Signals:
> **interest** = visitor→signup conversion (PostHog pageviews ÷ `signup_submitted`);
> **payment intent** = share of signups arriving through a pricing-tier button (`tier` set).
> Free-email signups alone are NOT demand evidence — the tier split is the demand read.

- **Denominator floor:** read nothing before 300 unique visitors overall; read a channel only
  after it has 100 visitors (utm_source). **Count from 2026-08-23 forward** — the ~22 pageviews
  before that date are founder QA from localhost and preview builds. Analytics is now gated to
  production hosts, so this contamination cannot recur.
- **GO:** ≥5% overall visitor→signup AND ≥30 total signups AND ≥20% of signups via a
  pricing-tier button. Next step: `/prd`, and a priced follow-up ("reserve your spot for $5,
  credited at launch") to founding users to convert interest into demand evidence.
- **KILL/PIVOT:** <2% overall visitor→signup after 500 visitors, OR <10% of signups via
  pricing-tier buttons (nobody signals paying). Kill branch is real: record and stop.
- **Between (2–5%, or tier-share 10–20%):** one iteration allowed (copy or channel mix, not
  both blind), then re-read against the same numbers. No second iteration without a recorded
  founder waiver.
- **Decide by 2026-09-12.** If traffic hasn't reached the denominator floor by then, the
  finding is "couldn't buy the denominator" — a channel problem, recorded as such, not a
  silent extension.

## Waivers & accepted risks

<!-- Every skipped gate or accepted risk gets a dated line here. Nothing is skipped silently. -->

- 2026-08-22 — Founder supplied a finished external validation brief (idea, positioning, design
  system, copy, pricing — all decided) and directed a straight build of the validation landing
  page. In-repo Stage 0–2 artifacts and gates waived by founder; the landing page IS the
  Stage-1 probe. If anything conflicts with the brief, the brief wins.
- 2026-08-22 — **Brief deviation, founder-directed:** launch-store copy softened from "At
  launch: Amazon, Target, and Best Buy" to "Amazon and Best Buy at launch; founding users vote
  on what comes next (Target, Walmart, and more on the ballot)". Trigger: adversary pass on
  the GO-day plan (KS-1) — Target has no viable data source at launch economics, so the old
  copy acquired signups on a promise the plan can't keep. This is an honesty correction made
  before meaningful traffic (~4 founder pageviews at change time), recorded distinct from the
  thresholds' one performance-iteration allowance, which remains unused. Candidate
  replacement stores under research (Walmart, eBay, et al.) — outcome will land in
  `docs/product/01b-third-store-candidates.md`.

## Log

<!-- One dated line per meaningful state change, newest first. -->

- 2026-08-24 — **Pixel confirmed live on the ad destination; duplicate project gone.** Founder moved
  `usedropwatch.com` (and `www`) onto the `dropwatch` project and deleted `drop-watch`
  (`prj_0tMgB16cnllifE4AfcFHqJwmGUpA` now returns 404). Verified from the bundle the live site
  actually serves, not from a deploy status: `https://www.usedropwatch.com/` loads
  `index-BIVefZtg.js`, which contains the pixel ID once, the `connect.facebook.net/en_US/fbevents.js`
  loader, and the `fbq("track","Lead",{content_name})` call. The pixel-less `index-DJYSEZEm.js` is no
  longer served anywhere.

  Two notes from the move: the apex now **308-redirects to `www`**, so every ad click costs one extra
  hop and `og:url` (the apex) no longer matches the host that serves the page — harmless for the
  probe since both hosts are in `PRODUCTION_HOSTS`, but worth flipping to apex-served if you want
  the canonical to match. And `usedropwatch.com` still has **0 MX and 0 TXT records**, so
  `privacy@usedropwatch.com` — printed on the live privacy policy and terms — still bounces. That is
  now the only item blocking the ad launch.

- 2026-08-24 — **Caught before ad spend: the custom domain was serving a pixel-less build.** A second
  Vercel project, `drop-watch` (`prj_0tMgB16cnllifE4AfcFHqJwmGUpA`), had been created against this
  same repo, and `usedropwatch.com` was attached to *it* rather than to `dropwatch`
  (`prj_l7DMfbbVAMUvlvB3rQArQjn76bCV`, the project named in CLAUDE.md). `VITE_META_PIXEL_ID` is set
  only on `dropwatch`, and Vite inlines it at build time, so the same commit produced two different
  bundles:

  | Host | Project | Bundle | Meta Pixel |
  |---|---|---|---|
  | `dropwatch-jesushzvs-projects.vercel.app` | `dropwatch` | `index-BIVefZtg.js` | present (ID + `fbevents`) |
  | `usedropwatch.com` | `drop-watch` | `index-DJYSEZEm.js` | **absent** |

  Every ad destination URL points at `usedropwatch.com`, so had this shipped, Meta would have had no
  PageView or Lead signal to optimise delivery against and no retargeting audience — while the
  PostHog probe kept working normally, making the gap easy to miss. Resolution (founder decision,
  dashboard action): move the domain onto `dropwatch` and delete `drop-watch`. Verify by re-fetching
  the bundle from `usedropwatch.com` and grepping for the pixel ID — a green Vercel deploy is not
  evidence.

- 2026-08-24 — **Custom domain live.** `usedropwatch.com` registered and attached to the Vercel
  `dropwatch` project (founder purchased directly). Verified: apex and `www` resolve to Vercel,
  nameservers `ns1`/`ns2.vercel-dns.com`, `https://usedropwatch.com/privacy` returns 200 with
  `cleanUrls` intact. Ad destination URLs and the absolute `og:url`/`og:image`/`twitter:image` now
  point at the custom domain; `PRODUCTION_HOSTS` already covered it, and the vercel.app host stays
  in that allowlist so stray traffic still counts. Side effect worth noting: the custom domain does
  **not** carry the `x-robots-tag: noindex` header the vercel.app host does, so the page is now
  indexable. Also recorded: every exact-match domain was taken (`dropwatch.com`/`.app`/`.io`/`.co`/
  `.net`/`.me`/`.xyz`/`.shop`, `getdropwatch.com`, `trydropwatch.com`), so the ads kit's primary
  handle `@getdropwatch` has no matching domain — `@usedropwatch` is the better primary now.

  **Still blocking ads:** the domain has no MX/TXT records, so `privacy@usedropwatch.com` — published
  on two live pages — does not receive mail. Setup steps in `marketing/ads/ads-kit.md`.

- 2026-08-23 — **Pre-ads readiness pass.** Privacy policy + terms of service published as static
  pages (`public/privacy.html`, `public/terms.html`, served at `/privacy` and `/terms` via
  `vercel.json` `cleanUrls`) and linked from the footer — closes the silently-skipped Legal gate,
  which had no recorded waiver. `og:image`/`twitter:image` made absolute (relative URLs are dropped
  by Facebook's scraper, so organic FB/IG link posts had no preview image). PostHog now initialises
  only on production hosts, matching the Meta Pixel's env gate: localhost, Vercel previews, and QA
  runs no longer enter the probe's denominator. Founder decisions recorded: privacy + terms (not
  privacy alone), contact via a `usedropwatch.com` alias (not a personal Gmail), domain bought
  before the ad spend.

- 2026-08-23 — Probe instrumentation verified end-to-end on production: a signup at 20:36 UTC
  landed in Supabase `dropwatch_leads` (source `demo`) **and** PostHog as `signup_submitted` in the
  same second; Meta Pixel confirmed present in the deployed bundle (ID `1502750084950357`, firing
  PageView + Lead). This closes the "one real test signup on production" step. That address is a
  founder test — discount it from the probe count.

- 2026-08-23 — Phase 0 items 3+4 research halves done in tandem with the probe (founder asked
  for parallel progress; probe itself untouched — PostHog read at 20:19 UTC showed ~13
  pageviews/~5 uniques and no `signup_submitted` yet; superseded the same evening by the
  verified test signup logged above). **Best Buy ToS** (`docs/product/01c-bestbuy-api-terms.md`):
  snippet evidence shows a 72-hour caching cap purpose-scoped to display + a derivative-works
  clause → plan price-history/deal-verdict as **Amazon-only (decision branch 1)** pending
  the founder's support email; core Best Buy alerting buildable without stored content;
  batch size ≈100 SKUs, rate limits a non-issue. **Keepa license**
  (`docs/product/01d-keepa-license-findings.md`): default staleness ≤~1h, but `update=0`
  forced refresh (~2 tokens/check, first-party-code-verified) keeps the 15-min Pro promise
  alive with **no per-store copy split and no Rainforest fallback**; €99–170/month budget
  holds (≈300 products ≈ €99–129); alert use strongly evidenced as intended; license
  full-text still founder-read-at-subscription. Remaining Phase 0 founder tasks: Best Buy key
  application + support email (domain now registered); Keepa T&C read at checkout.

- 2026-08-23 — Meta Pixel installed on the landing page (founder-directed, for FB/IG ad
  delivery optimization; supersedes the ads kit's "no pixel needed" call). Loads only when
  `VITE_META_PIXEL_ID` is set in Vercel; fires PageView + Lead, no PII to Meta. Probe
  thresholds still read exclusively from the PostHog dashboard. Setup steps:
  `marketing/ads/ads-kit.md` → "Pixel setup".

- 2026-08-22 — Conditional GO-day build plan written (`docs/product/02-go-day-plan.md`) from
  the price-data research; activates only on a validation GO — gate slots stay empty until the
  formal `/prd` → `/architecture` → `/build-plan` run. Phase 0 (zero-cost, during probe):
  domain purchase, Best Buy API key application, Best Buy + Keepa ToS reads, LLM provider
  decision.

- 2026-08-22 — Repo created as a clone of the workflow framework; landing page moved here from
  the portfolio hub (`claude-code-ai-development-workflow`, PR #2 there now removes it and
  records the graduation). App lives at repo root; Vercel project `dropwatch` linked to this
  repo; Supabase `dropwatch_leads` unchanged.
- 2026-08-22 — Landing page built verbatim from the founder's brief: copy + design system
  implemented as specified; leads to Supabase `dropwatch_leads` (RLS insert-only for anon,
  verified with captured output); QA'd at 1280px/375px, 0px horizontal overflow. Deviations
  (recorded in the build PR): no AI Studio / Gemini / Firebase in the build environment —
  framework stack used instead; hero image and logo are flat token-palette SVGs.
