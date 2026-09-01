# DropWatch — validation brief (source of truth)

> Supplied complete by the founder on 2026-08-22, produced outside this repo. Every decision
> below is made; the landing page implements it verbatim. **If anything in this repo conflicts
> with this brief, the brief wins.** [FACT: founder-supplied; decisions not re-derived here.]

## Pivot addendum — 2026-09-01 (supersedes conflicting lines below)

> [FACT: founder ratified 2026-09-01; recorded in `docs/knowledge/decisions.md`.] While building the
> app on Manus the founder pivoted its value proposition. The brief below is kept verbatim as the
> original; where this addendum and the body disagree, **the addendum wins.**

- **Differentiator:** the trust-evidence alert. Every alert states the delivered price (shipping and
  tax when the store publishes them; "unknown" otherwise, never a silent $0), the condition (new by
  default; used, refurbished and open-box excluded unless the user opts in), availability,
  freshness (an offer older than 12 hours is stale and suppressed), the seller, and a confidence
  grade. In the app roadmap's words: *fewer, clearer alerts with enough evidence to decide whether
  the offer is worth acting on.* The job moved from "don't miss the drop" to "don't get fooled by a
  deal that isn't real." The acquisition hook — one quiet, exact, plain-English alert — is unchanged.
- **Stores:** automatic discovery across Google Shopping's merchants, Amazon and eBay via PriceAPI.
  The user never picks a store. Best Buy is *not* a launch source (supersedes "Amazon and Best Buy at
  launch"); it joins Target and Walmart on the founding-user ballot for dedicated integrations.
- **Cadence:** every six hours, not instant (supersedes "the second it drops"). The landing page
  positions this honestly: built for drops that last days, not flash sales that last minutes.
- **Alert basis:** item price, estimated delivered total, or verified delivered total, chosen per
  watch; an optional destination ZIP is context only until the provider supplies shipping and tax.
- **Pricing on the page:** Pro Plus is $99/year (supersedes both $129/year and $12.99/month). Tiers
  are a willingness-to-pay hypothesis; the app has no tiering built.
- **Still true:** Plain-English Alert Builder as the hero, the target user, the positioning against
  noise, the demo-moment structure, the design system and voice.

## Product context

DropWatch is a deal-alert app for busy professionals (25–40) who shop online constantly but
have no time to hunt for deals. Today they add things to wishlists at midnight, then miss the
price drop a week later because it happened during a workday and lasted a few hours. Existing
tools blast volume — coupon extensions, spammy deal newsletters, generic "hot deals" apps —
when what this person wants is the opposite: one alert, for one exact thing, at one exact
price. DropWatch lets them say it in plain English ("AirPods Pro under $200," "any Patagonia
jacket 40% off") and get pinged the second it happens across the stores they actually use. No
feed to scroll, no coupon clutter, no noise.

Why now: mobile commerce keeps growing, retailers reprice constantly, and shoppers are already
comfortable with push notifications — but the tools serving them are ad-funded and optimized
for volume, not relevance. That leaves a clear gap for a paid product that respects a limited
attention budget.

Money: freemium. Basic alerts are free. Power users pay $9.99/month (Pro) for unlimited
alerts, all supported stores, price history, and instant notifications; $12.99/month (Pro
Plus) adds priority support and early features. (Note: the landing page's pricing section,
which is the implement-verbatim layer, lists Pro Plus at $129/year.) The landing page's only
job is to prove people want this badly enough to hand over an email.

## Decisions (hard constraints)

- **Hero feature:** Plain-English Alert Builder — you type what you want and your target price
  ("Sony WH-1000XM5 under $250, Amazon or Best Buy") and it becomes a structured, tracked
  alert that fires the moment the price crosses your line. Classification: text-transform.
- **Target user:** a busy professional who shops online all the time, hates hunting for deals,
  and keeps missing price drops on things sitting in their wishlist.
- **Positioning:** unlike coupon extensions and deal feeds that bury you in noise, DropWatch
  watches one exact thing at one exact price and only speaks when it drops.
- **MVP scope (post-validation build):**
  1. Plain-English Alert Builder (hero): user types a sentence + target price; an LLM parses
     it into a structured alert (product, stores, threshold) saved to their dashboard.
  2. Alert dashboard: view, edit, pause, and delete alerts.
  3. Paste-a-price tracker: user pastes a product link and its current price; the app logs
     entries over time and charts the price history.
  4. Threshold email alert: when a logged or imported price crosses the user's target, an
     email alert fires instantly.
  5. Deal-quality verdict: an LLM writes a one-line read on any tracked price ("Lowest logged
     in 6 months — buy" / "Typical sale price — wait").
- **Not in the MVP:** live retailer API integrations or automated price polling, web scraping,
  mobile push notifications, native iOS/Android apps, browser extension, affiliate links,
  budgeting/finance integrations, white-label or enterprise packages.

## Demo moment (worked example — implemented verbatim on the page)

Two side-by-side panels. Left, "You type this once":
"Sony WH-1000XM5 headphones — tell me if they drop under $250 at Amazon or Best Buy."
Right, "The one alert you get — 11 days later", a notification card:

> PRICE DROP — Sony WH-1000XM5
> $248.00 at Best Buy · was $348.00 (29% off)
> Lowest price in 6 months. Your target was $250.
> Deal read: Below its Black Friday price. This is the buy window.
> [View deal] [Pause alert]

Below the card: a 6-month price line chart, flat around $329–$348 with one sharp dip to $248
at the right edge, dip marked with an accent dot and the label "$248 — alert sent".

## Design spec (the design system — implemented as CSS tokens in `src/styles.css`)

- Vibe: "Wirecutter-clean" — calm editorial trust, plainspoken utility, light page.
- Colors: background #FBFAF7 · surface #F3F0E9 · border #E3DED3 · text-primary #211D16 ·
  text-muted #6E675B · accent #D9480F · accent-hover #B53B0A · text-on-accent #FFFFFF.
  Accent is for CTA buttons, the price-drop number in the demo card, and the recommended-tier
  badge only — never section backgrounds, decorative shapes, or body text.
- Type: Sora headings / Inter body. h1 48/700/1.1 · h2 32/700/1.2 · h3 20/600/1.35 ·
  body 17/400/1.6 · small 14/400/1.5.
- Spacing 4/8/16/24/32/48/64/96; max content width 1080px; 96px section padding; 8px radius;
  1px borders; flat, no shadows; outline icons only.
- Nav: wordmark + "How it works · Pricing · FAQ" + one CTA. Section rhythm: strict
  background/surface alternation, no gradients.
- Hero visual art brief: photorealistic phone on a warm oak desk, one clean notification.
  (Implemented as a flat token-palette SVG — no image generation in the build environment.)
- Logo art brief: flat vector price tag tilted 15°, downward arrow cut out of center, #D9480F
  with #211D16 string loop. (Implemented as SVG: `public/logo.svg`, doubles as favicon.)

## Landing page copy

Implemented verbatim in `src/App.tsx` — that file is the canonical transcription of the
brief's copy layer (hero, problem, how-it-works, benefits, pricing tiers, FAQ, final CTA).

## Email capture

- Offer: founding-user early access before public launch + 3 months of Pro free when live.
- CTA text everywhere: "Claim 3 months of Pro free". Email-only field, placeholder
  "you@work-or-home.com". Privacy note: "Just for early access. No newsletters, no selling
  your email."
- Success state (verbatim): "You're in as a founding user. When DropWatch opens for early
  access, you'll get one email with your invite link and your 3 free months of Pro attached —
  nothing else before then."
- Placement: hero, immediately after the demo moment, final CTA; tier buttons capture
  email + tier name.
- #1 follow-up objection: "Why pay $9.99/month when free deal tools exist?" — answered by
  contrasting one precise alert with the noise-and-affiliate model of free tools (FAQ #2).

## Share kit (ready to post — swap [YOUR LINK] for the production URL)

> Tag each link so PostHog attributes the channel: append `?utm_source=reddit`,
> `?utm_source=facebook`, `?utm_source=x`, or `?utm_source=dm` respectively. Per-channel
> conversion is read against the thresholds in `docs/00-status.md`.

**Reddit, r/Frugal:** "I keep missing price drops on stuff I've decided to buy — not impulse
stuff, things I've researched and I'm just waiting on. The drop happens midweek while I'm
working, lasts a day, and I find out after it's back up. CamelCamelCamel helps for Amazon, but
I couldn't find anything that watches one exact thing at one exact price across multiple
stores without drowning me in 'hot deals' I never asked for. So I've been working on exactly
that: you type 'Sony XM5s under $250, Amazon or Best Buy' and you get one alert when it
happens, nothing else ever. I put together a page for this showing how it works — would
genuinely like this community's take, since you all know deal tools better than anyone. Is
the noise problem real for you, or am I overweighting it? [YOUR LINK]"

**Facebook, Deal Hunters United:** "Question for this group: how do you track prices on things
you've already decided to buy? I talked to a bunch of people who shop online constantly, and
the pattern was the same — wishlist full of stuff, price drops on a random Tuesday, gone
before they see it. I'm building a tool where you set an alert in plain English ('any
Patagonia jacket 40% off') and it only pings you when your price hits. No daily deal blasts.
I put together a page for this and I'd rather hear honest criticism from actual deal hunters
than compliments from friends. What would make this useless for you? [YOUR LINK]"

**X/LinkedIn:** "Free deal tools have a built-in conflict: they earn on ad and affiliate
volume, so they're designed to show you MORE deals, not the one you're waiting for. That's why
your inbox has 40 'hot deals' emails and you still missed the laptop drop. I'm building the
opposite — set one plain-English alert ('AirPods Pro under $200'), hear nothing until it hits.
I put together a page for this and I'm looking for honest feedback before building further:
[YOUR LINK]"

**DM version:** "Hey — I'm building a tool for people who shop online a lot but keep missing
price drops: you set one plain-English alert like 'XM5s under $250' and it only pings you when
that exact price hits, across stores. I put together a page showing how it'd work and I'd
really value your honest take before I build more: [YOUR LINK]"
