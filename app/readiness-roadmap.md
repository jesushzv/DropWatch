# DropWatch User-Readiness Roadmap

## Executive recommendation

DropWatch is ready for a controlled pilot, but not yet for broad user acquisition. The highest risk is not missing feature breadth; it is a user receiving an alert that appears precise but cannot explain whether the offer is available, comparable, fresh, or genuinely affordable at checkout.

The next release should therefore focus on **trust and operational clarity before integrations, growth loops, or visual expansion**. Existing functionality remains the product baseline: plain-English watch creation, automatic multi-retailer discovery, six-hour checks, email alerts, price history, manual logging, and watch controls.

## Current readiness assessment

| Area | Current state | Readiness | Why it matters |
| --- | --- | --- | --- |
| Core watch workflow | Authenticated CRUD, natural-language parsing, manual logging, history, and pause/resume are implemented. | Pilot-ready | The primary user journey exists. |
| Retailer discovery | Google Shopping, Amazon, and eBay are searched automatically through Price API. | Pilot-ready with monitoring | Provider responses can legitimately return no qualifying offer. |
| Automation | Six-hour schedule and manual checks work after the managed-runtime production-gate correction. | Pilot-ready after observability improvements | Users need to distinguish queued, checked, no-match, stale, and failed states. |
| Notifications | Postmark threshold emails, preference controls, and unsubscribe links are implemented. | Pilot-ready with evidence upgrades | Alerts must explain the offer context, not only the target crossing. |
| Trust layer | Scope exists, but landed-cost normalization is not implemented. | Launch blocker for the differentiated promise | Unknown shipping, tax, condition, and availability must not be presented as a complete deal. |
| Development testing | Protected development-only test-session harness and endpoint tests are implemented. | Ready | Repeatable authenticated acceptance testing is available without a production bypass. |
| External platform integrations | Compatibility strategy is scoped to deep links and future migration. | Defer | Full synchronization would add policy, maintenance, and data-quality risk before core value is proven. |

## Priority roadmap

### P0 — Make every check understandable and dependable

The first implementation slice should improve provider observability and the trust surface together. A manual check should immediately show **requested**, then each source should transition independently to **queued**, **completed with offer**, **completed with no qualifying offer**, or **failed**. The dashboard should refresh health after a request instead of requiring a page reload.

At the same time, extend price observations with nullable shipping, tax, estimated total, condition, fulfillment, availability, freshness, seller, destination, confidence, and evidence fields. Unknown values must remain unknown; they must never be coerced to zero or silently omitted from an alert explanation.

The alert policy for the pilot should remain conservative. New and in-stock offers are eligible by default. Used, refurbished, open-box, unavailable, stale, or ambiguous-variant offers should be excluded unless the user explicitly enables them. If shipping or tax is unavailable, the alert may still report an item-price match, but it must label the subtotal as incomplete and avoid claiming a delivered-price match.

### P1 — Give users a decision-ready alert and a reliable first-run experience

After P0, update the watch card, watch detail page, and email template to present the same evidence vocabulary. A useful alert should answer: what product and variant matched, which seller and retailer supplied it, what the item price was, what shipping and tax are known or unknown, when it was observed, what condition it is in, and why the alert was sent.

The onboarding flow should explain the difference between **item-price alerts** and **landed-cost alerts** without requiring a store choice. A ZIP code can be introduced as an optional input only when the user chooses stricter delivered-cost monitoring. Users should never need to leave DropWatch to continue monitoring; retailer links should be optional verification or purchase links.

### P2 — Run a measured limited pilot

Invite a small group of users with real products rather than opening acquisition broadly. Use observation mode or conservative notifications first, and review every alert that reaches a target. Record provider completion, offer completeness, stale observations, no-match outcomes, alert suppression reasons, and user corrections.

Pilot success should be judged by whether users trust and understand the signal, not by the raw number of retailer results. A no-match result is acceptable when it is clearly explained; a misleading match is not.

### P3 — Expand coverage only after the core signal is trusted

Only after the pilot demonstrates reliable alert semantics should DropWatch add ZIP-based tax estimation, richer shipping estimates, more retailer sources, browser or share-sheet capture, or migration helpers for other price-alert platforms. Existing platforms should initially be supported through outbound links and a simple product/watch import format, not live account synchronization.

## Release gates

| Gate | Minimum requirement before opening the pilot |
| --- | --- |
| Import reliability | At least 95% of requested source checks reach a terminal state within the defined provider window; every non-terminal check is visibly stale or pending. |
| Alert evidence | 100% of sent alerts include retailer, offer URL, observed time, condition status, availability status, and explicit shipping/tax confidence. |
| Conservative policy | No alert treats missing shipping or tax as zero, and no default alert includes used, refurbished, open-box, unavailable, or ambiguous-variant offers. |
| Duplicate control | Repeated callbacks for the same provider job cannot send duplicate target notifications. |
| User comprehension | In a five-user pilot, at least four users can correctly explain whether an alert is an item-price match or a delivered-cost match. |
| Recovery | Provider failures expose a readable reason and a retry or next-check expectation; they do not appear as a silent “no deal.” |
| Privacy and safety | Test authentication remains unreachable in production; webhook signatures, user ownership checks, unsubscribe behavior, and secret handling remain covered by automated tests. |

## Operating metrics

Track these metrics per source and per watch: request count, terminal completion rate, median and p95 provider latency, no-match rate, failure rate, stale-check rate, offer completeness rate, alert count, suppressed-alert count, duplicate-alert count, and user-reported incorrect-match count.

The product metrics should be activation to first valid watch, first completed check, first understandable alert, seven-day watch retention, and the percentage of users who keep email alerts enabled. A high alert volume is not a success metric if users disable notifications because the evidence is unclear.

## Recommended next build slice

The immediate build should be **Provider Check Status and Trust Evidence v1**:

1. Add normalized nullable offer fields and confidence semantics to the database and provider processing path.
2. Make source-level check status and no-match reasons visible in the dashboard.
3. Refresh import health after “Check now” and show the last checked timestamp.
4. Update target emails and watch details to explain item price versus incomplete landed cost.
5. Add regression tests for unknown shipping/tax, condition filtering, stale offers, no-match callbacks, duplicate callbacks, and alert suppression.
6. Run a limited real-product pilot before adding external platform synchronization.

This sequence preserves DropWatch’s existing user value while making the differentiation credible: **fewer, clearer alerts with enough evidence to decide whether the offer is worth acting on.**

## Implementation validation note — 2026-08-27

The local preview shows the retained dashboard flow intact. The watch list now displays the active watch’s alert basis, and the detail view adds a Trust Evidence panel without displacing target, current-price, history, or activity sections. The current Sony watch correctly shows no offer evidence because the live provider run returned a no-match result. The edit workflow now exposes item-price, estimated-delivered-total, and verified-delivered-total bases, optional destination ZIP, and observation mode.

## ZIP and landed-cost policy

A destination ZIP is optional context, not a promise that DropWatch can independently calculate checkout tax. DropWatch stores the ZIP and uses provider-supplied shipping or tax fields when present. Missing shipping or tax remains explicitly unknown, and the estimated total is not presented as a verified checkout total. A future tax service may be added only after its jurisdiction, product-taxability, seller-nexus, and privacy requirements are validated.

## Final visual validation note — 2026-08-27

The updated dashboard renders the Sony watch with separate Amazon and eBay provider statuses in Import Health. The detail view preserves the existing Wirecutter-clean hierarchy while adding Trust Evidence and clearly states that a ZIP is context only until the provider supplies shipping and tax. Existing target, history, activity, and manual logging surfaces remain visible and usable.

## Published trust-layer acceptance note — 2026-08-27

The new checkpoint is live at `dropwatch-2xkgfc7i.manus.space`. The authenticated dashboard reports that six-hour UTC checks are enabled. The manual provider request completed from the published dashboard, and the Import Health panel displays the current Amazon and eBay source states. The Sony watch remains an existing user watch and was not modified or removed during this verification.

## Go-to-market roadmap

### Phase 0 — Restore a dependable public release

The current deployment blocker is platform capacity, not application code: Cloud Run has reached the `ServicesPerProject` quota in `us-east1`. Do not invite outside users until the published release can be created and updated reliably. Escalate the quota issue through Manus Support with the project identifier, region, and quota details. In parallel, keep development and preview validation active so product work does not stall.

The exit gate is a successful published deployment from the current checkpoint, a signed-in smoke test, a successful manual provider request, and confirmation that the six-hour schedule remains enabled after deployment.

### Phase 1 — Harden the core alert loop

The first marketable product is not a broad deal-discovery engine. It is a quiet watchlist that reliably tells a user whether a specific product is worth checking. Before acquisition, verify that every provider request reaches a visible terminal state, no-match results are understandable, stale offers are suppressed, duplicate callbacks cannot duplicate emails, and every sent alert explains its evidence and alert basis.

The release gate is 95% or better terminal completion within the provider window, zero known duplicate notifications in the test cohort, 100% evidence completeness for sent alerts, and no alert that treats unknown shipping or tax as zero.

### Phase 2 — Run a controlled pilot

Recruit approximately five to ten users who already monitor products and ask each to create two or three real watches. Start with observation mode or conservative item-price alerts, not a public growth campaign. Review every target match and every user correction. The pilot should test whether users understand the difference between item price and delivered-cost evidence, whether no-match states feel trustworthy, and whether the six-hour cadence is useful rather than noisy.

The pilot gate is at least four of five users correctly explaining an alert’s basis, no unresolved high-severity alert-correctness issue, and evidence that users keep at least one watch active for seven days. Track activation to first watch, first completed check, first understandable alert, watch retention, email opt-in, no-match rate, provider failure rate, stale-offer rate, alert suppression rate, and incorrect-match reports.

### Phase 3 — Launch a narrow public beta

After the pilot gate passes, open the product through a simple landing page and a small waitlist. Position DropWatch around **fewer, clearer alerts with enough evidence to decide**, not around the number of retailers or deals found. The primary call to action should be one plain-English watch, followed by a clear explanation of what the user will receive. Keep acquisition channels narrow enough that support and alert review remain manageable.

Do not add full synchronization with Google Shopping, Keepa, CamelCamelCamel, or Honey at this stage. Deep links and a simple import/export format are sufficient compatibility measures; DropWatch should remain the primary monitoring surface.

### Phase 4 — Expand only from measured demand

Prioritize the next expansion based on observed user friction. If users primarily ask “Can I trust this total?”, validate provider shipping and tax coverage and then add stronger delivered-cost handling. If users primarily ask for faster capture, prioritize share-sheet or browser capture. If users primarily ask to migrate existing watches, add a simple import format. Broader platform synchronization should remain deferred until there is demonstrated demand and a clear policy-safe integration surface.

## Immediate owner action list

| Timing | Owner action | Completion evidence |
| --- | --- | --- |
| Now | Escalate the deployment quota blocker. | Support case includes `ServicesPerProject`, `us-east1`, current use of 1,000/1,000, and project identifier. |
| Before pilot | Run the signed-in smoke test on the newly published checkpoint. | Dashboard, watch creation, manual check, activity timeline, and unsubscribe path verified. |
| Pilot week | Recruit five to ten real-product users and review matches manually. | Pilot log with watch IDs, provider outcomes, alert basis, corrections, and user comprehension notes. |
| After pilot | Decide whether to open a narrow beta. | All launch gates pass and no high-severity correctness issue remains. |
| Only after evidence | Choose one expansion: delivered-cost coverage, capture workflow, or migration helper. | User-request frequency and implementation plan justify the selected slice. |

## Go-to-market decision

DropWatch should be treated as **pilot-ready but not broad-launch-ready until the deployment quota is cleared and the alert-quality gates are measured with real users**. The fastest path to market is therefore not more integrations. It is a dependable public release, a small observation-led pilot, and a narrow beta built around the trust advantage already implemented.

## Pilot onboarding script

Send each pilot user this short orientation before they create their first watch:

> **Welcome to the DropWatch pilot.** DropWatch monitors products you already intend to buy and alerts you when a qualifying price signal appears. Start by creating one watch in plain English, such as “Sony WH-1000XM5 under $250.” You do not need to choose a store; DropWatch searches the supported sources automatically.
>
> For your first watch, turn on **Observation mode** if you want DropWatch to record matches without sending an email. Use this mode while learning how the provider evidence looks. If you enable emails, read the alert basis carefully: **item price** means the product price reached your target, while **estimated or verified total** applies stricter landed-cost evidence. A ZIP code is optional context and does not create a checkout-tax guarantee.
>
> A **no qualifying offer** result is not a failure. It means the checked sources returned no offer that met the product, condition, availability, freshness, or trust rules at that time. A provider failure is different and will show a reason or retry expectation.
>
> After each check, please report whether the product match was correct, whether the price and retailer were understandable, whether shipping or tax evidence was clear, and whether you would act on the alert. Use the feedback form or reply with the watch name, approximate check time, and what looked wrong. Do not send payment information or credentials.

The pilot operator should walk each user through five steps: create one watch; confirm the default condition and alert basis; run or wait for the first provider check; inspect the per-source result and activity timeline; and submit a short rating for correctness, clarity, and actionability. Review every alert and correction within one business day, and pause a watch rather than changing its target when investigating a questionable result.

## Deployment status recheck — 2026-08-27

The public domain `dropwatch-2xkgfc7i.manus.space` is reachable again after the platform reported a successful deployment. The unauthenticated landing page loads normally and presents the sign-in flow. A fresh authenticated smoke test is still required because the browser session is not currently signed in to the newly published instance.

## Cloud Run quota resolution note — 2026-08-27

The previously observed Cloud Run `ServicesPerProject` quota failure in `us-east1` was resolved sufficiently for the platform to create and publish a new service. Evidence: the platform returned a successful deployment for checkpoint `9e93f99d`, reported the domain `dropwatch-2xkgfc7i.manus.space` as available, and the public landing page loaded successfully on recheck. No support ticket was required for this resolution. The remaining launch check is authenticated smoke testing on the newly published instance.

## Simplified onboarding visual validation — 2026-08-28

Desktop and mobile previews show the new first-run hierarchy clearly: the promise is visible at the top, the three-step Quick Start tutorial precedes watch creation, and the primary Create watch action remains prominent. On mobile, the tutorial stacks into readable cards, the watch builder remains usable, and the existing automation, import health, email, and watchlist sections remain accessible below. The tutorial can be dismissed and reopened from the How it works link; advanced trust settings are now grouped under an optional disclosure in the edit flow.

## Onboarding accessibility and first-time smoke-check — 2026-08-28

The simplified dashboard was visually checked at desktop and mobile sizes. The Quick Start tutorial appears before the primary watch builder, stacks cleanly on mobile, and keeps the existing automation, import-health, email, and watchlist sections available. The tutorial dismiss control has an accessible label, the main tutorial is associated with a heading, and advanced settings use native `details`/`summary` disclosure. Primary actions remain native buttons and inputs with existing focus-ring styles.

The development preview loads the sign-in screen and therefore cannot complete an authenticated first-time smoke test without a browser login. The automated onboarding coverage verifies tutorial visibility, dismissal persistence, manual reopening, plain-English watch creation, and automatic retailer-source defaults. A post-login smoke check remains the final human verification step.

## Tutorial regression and accessibility evidence — 2026-08-28

The normal Vitest suite now executes the tutorial UI test and the simplified watch-builder UI tests. Coverage confirms that the tutorial can be dismissed and reopened from the persistent How it works trigger, the decision persists in storage, plain-English creation calls the typed creation path, and manual entry remains available with automatic retailer-source defaults. The tutorial test also verifies its heading and labeled dismiss button are discoverable and that the dismiss control can receive keyboard focus. Full validation after these additions passed with 49 tests passed and 2 skipped, followed by a clean type check and production build.

An authenticated first-time-user smoke test remains the final human check because the development preview requires sign-in and the current browser session is not authenticated.

## Advanced settings accessibility validation — 2026-08-28

The Edit watch disclosure was validated in `server/editWatch.ui.test.ts`: the native `details` element starts closed, opens on mouse activation of its `summary`, the summary receives focus, and the disclosure closes again through the focused interaction path. The onboarding keyboard test in `server/alertBuilder.ui.test.ts` traverses the dismiss control, plain-English input, manual-entry control, and Create watch button in order; the primary button retains visible `focus-visible` styling classes. This supplements the tutorial’s labeled dismiss-control and focus assertions.

## Authenticated smoke-test status — 2026-08-28

The published domain currently returned `ERR_SSL_PROTOCOL_ERROR` during the post-release smoke check, while the development preview loaded the expected sign-in screen but had no authenticated session. The automated component and router coverage is complete; the remaining human verification requires signing in again through the browser once the published host is reachable.
