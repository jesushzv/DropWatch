# Project Status

> Single source of truth for where this project is in the lifecycle. Every phase command updates this file. `/workflow-status` reads it; artifacts on disk outrank it if they disagree.

- **Project:** DropWatch — plain-English price-drop alerts, zero noise
- **Idea file:** `docs/product/00-brief.md` (external validation brief, supplied complete by the founder)
- **Stage:** Validate
- **Last updated:** 2026-08-23
- **Next command:** clear the two pre-ads blockers (domain `usedropwatch.com` registered +
  `privacy@usedropwatch.com` forwarding live; Meta Events Manager shows PageView + Lead) → launch
  Meta ads per `marketing/ads/ads-kit.md` → post the share-kit posts with UTM-tagged links
  (`?utm_source=reddit|facebook|x|dm`) → `/validate-idea` converts the probe when the thresholds
  resolve (decide by 2026-09-12)

## Gate ledger

| Gate | Verdict | Date | Notes |
|---|---|---|---|
| Validation | PENDING PROBE | 2026-08-22 | Landing page live (Vercel preview; production on merge). Probe = founding-user email capture to Supabase `dropwatch_leads`; denominator + payment-intent via PostHog (pageviews by utm_source, `signup_submitted` by source/tier, `tier_click`). Thresholds below — COMMITTED, founder approved 2026-08-22 |
| PRD | — | | brief covers scope; formalize with `/prd` post-GO |
| Positioning | — | | brief covers positioning; formalize post-GO |
| Architecture | — | | |
| Build plan | — | | phases: 0/0 complete |
| CI pipeline | — | | set up / skipped-on-record |
| Review | — | | APPROVED / NEEDS_FIX |
| Security | — | | Landing-scope only: RLS insert-only on `dropwatch_leads` verified 2026-08-22 |
| Design review | — | | done / skipped-on-record |
| Perf audit | — | | done / skipped-on-record |
| Legal (first deploy) | PENDING CONTACT | 2026-08-23 | Landing scope: privacy policy + terms written and footer-linked (`/privacy`, `/terms`). Consent banner NOT required — session replay verified off (0 `$snapshot` events in PostHog, 2026-08-23). Stripe Tax N/A: nothing is sold. **Blocker:** listed contact `privacy@usedropwatch.com` must resolve before ads run — a bouncing privacy contact is worse than none. |
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
