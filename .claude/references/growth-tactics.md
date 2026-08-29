# Growth Tactics Playbook

Execution playbooks per binding constraint, read by `/grow`, `/launch`, and `/roadmap`. `/measure` names the constraint; this file says how to attack it at solo scale. Everything here is a hypothesis to pre-register and grade, not a guarantee.

## Constraint: Traffic (not enough of the right people arrive)

- **Double down on the validated channel first.** The launch plan named a primary channel with a 30-day kill metric — check it before adding channels. One channel worked ≫ three channels tried.
- **SEO/content motion** (compounding, slow): target the queries your validation evidence showed people actually searching (their complaint vocabulary = keyword list). Cadence over heroics: 1–2 pieces/week answering one real question each, interlinked, with the product as the natural next step. Expect months; pre-register the 90-day check (impressions → clicks → signups per piece).
- **Free tool / engineered lead magnet**: a single-purpose free version of one slice of the product, launched separately. High effort — treat as a `/roadmap` release with its own hypothesis.
- **Referral loop**: only after retention holds (inviting users to a leaky bucket wastes the invites). Simplest viable: give-get incentive on the action users already value.
- **Communities**: answer real questions where the audience lives (the validation brief says where); the weekly quota from the launch plan's day-2 motion. Sell by being findable, not by pitching.

## Constraint: Activation (they arrive, they don't reach the value)

- **Watch 10 session replays** of new signups before theorizing (PostHog has them; consent per the compliance reference). The drop-off point is usually visible within an hour of watching.
- **Shorten time-to-value**: move the "aha" action into the first session — prefill demo data, kill optional setup steps, defer email verification, make the empty state do the onboarding.
- **Onboarding email nudge**: one behaviorally-triggered email ("you created X, here's the one next step") beats a 7-part drip. Trigger off the PostHog event that predicts retention.
- Experiment shape: big swings ("replace the 4-step wizard with one prefilled example") — indie traffic can't detect small ones.

## Constraint: Retention (they activate, then leave)

Table stakes first — these are releases, not experiments; build via `/roadmap` if missing:
- **Dunning / failed-payment recovery**: retry schedule + pre-dunning card-expiry email + in-app banner. Stripe Smart Retries + Billing emails cover most of it — turn them on. Routinely the highest-ROI automation in indie SaaS: involuntary churn is often 20–40% of total churn.
- **Cancellation flow**: one-question exit survey (feeds `/feedback`), plus a save offer where honest (pause plan, downgrade tier). Never dark-pattern the cancel button.
- **Lifecycle email**: the re-engagement trigger ("your report is ready", "3 new X since you left") tied to real product events — requires Resend beyond transactional; small release.
Then diagnose: cohort curves (`saas-finance.md` traps apply), churned-user feedback from the ledger, and whether churners ever activated at all (if not, the real constraint is activation).

## Constraint: Monetization (they stay, revenue doesn't follow)

- Re-run the pricing analysis in `/positioning` with live data: conversion by tier, upgrade-trigger hit rate, unit costs from `/perf-audit`. Post-launch pricing changes are experiments — grandfather existing users, pre-register the readout.
- Usual indie fixes, in order of frequency: price too low (2× it for new signups and watch conversion), free tier too generous (move the value line), upgrade trigger invisible (surface it at the moment of hitting the limit).

## Constraint: B2B — the channel is founder-led sales

For B2B ideas the day-2+ motion is outreach, not content. Solo-scale playbook:
- **List**: 50–100 named prospects matching the validation brief's specific person — from communities they post in, tool directories, job postings mentioning the problem. Quality over volume; a CRM is a spreadsheet at this stage.
- **Outreach sequence**: 3 touches over ~2 weeks — (1) short, specific, about *their* observable problem (reference something real; no "I hope this finds you well"), (2) value nudge (a genuinely useful artifact: teardown, benchmark, checklist), (3) breakup note. Personalization is the mechanism; automation that removes it removes the channel.
- **The call**: demo the core loop on *their* data within the first 10 minutes; price on the call; ask for the close or the concrete objection. Every objection is a `/feedback` entry.
- **Metrics**: replies/meeting rate/close rate per 50 sends, pre-registered like any channel bet. 50 sends with zero meetings is a positioning finding, not a volume problem — revisit `/positioning` before sending 500.

## The audience asset (portfolio-level — compounds across every product)

Distribution is the #1 solo bottleneck, and the only channel you own outright is an audience. Unlike a product, it survives pivots and sunsets — treat it as portfolio infrastructure, not per-product marketing:

- **One home, owned**: a personal/brand newsletter (email list — platforms change, exported lists don't) plus one social platform where your target users actually are. The list is the asset; social is the top of its funnel.
- **Build-in-public cadence, honestly**: share the real numbers, the failed experiments, the `/retro` lessons — the workflow generates this material for free (a graded experiment is a post; a kill decision is a post). Sanitized highlight reels don't compound; specifics do.
- **Between probe and launch, keep the waitlist warm**: the validation landing page collected emails — one short update every 2–3 weeks during the build (a real screenshot, a decision made, an honest delay) keeps launch day from opening to a cold list. Queue it into the build phases; a warm 200-person list beats most launch-day channel spikes.
- **Every product feeds the asset**: launch posts, changelog updates, sunset postmortems all point back to the list. When product N+1 hits `/launch`, the audience *is* the primary channel candidate — and its size/warmth is a [FACT] in that launch plan, not a hope.
- Budget it like any channel: it costs founder-hours (CAC includes them) — ~2 hours/week sustained beats 10 hours in launch week only.

## Rules of engagement

- One experiment per constraint at a time; grade before the next (see `/grow`).
- Tactics that manufacture regret — fake scarcity, hidden cancels, spam-grade outreach — are out of scope regardless of conversion math; they poison the review-and-referral loop a solo brand lives on.
- Every section's results feed `docs/knowledge/`: a channel that worked (or died) for one product is the cheapest head start for the next one.
