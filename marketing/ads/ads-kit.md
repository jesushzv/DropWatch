# DropWatch — Facebook/Instagram validation kit

Assets live in `out/` (regenerate with `node marketing/ads/render.mjs` after editing `src/`).
Everything below is written to be pasted directly into Meta. Destination for every ad and link:
the production page with the paid-channel UTM (never the bare URL — the probe reads channels
separately, and paid must not blend with organic).

- Facebook ads → `https://usedropwatch.com/?utm_source=fb-ads&utm_medium=paid&utm_campaign=validation`
- Instagram ads → `https://usedropwatch.com/?utm_source=ig-ads&utm_medium=paid&utm_campaign=validation`
- Organic page posts → `?utm_source=facebook` / `?utm_source=instagram`

## Page setup

- **Name:** DropWatch · **Handle:** @getdropwatch (fallbacks: @dropwatchapp, @usedropwatch)
- **Category:** Product/Service (or App Page)
- **Profile picture:** `out/profile-1080.png` · **FB cover:** `out/cover-facebook-1640x624.png`
- **Bio / short description (IG, ≤150 chars):**
  "One plain-English price alert. Zero noise. Get pinged the second your price hits — never a
  deal blast. Early access + 3 months of Pro free ↓"
- **About (FB):**
  "DropWatch watches one exact thing at one exact price — 'Sony XM5s under $250, Amazon or Best
  Buy' — and only speaks when it drops. No feed, no coupon clutter, no daily 'hot deals' email.
  Launching soon; founding users get early access and 3 months of Pro free."

## Ad copy (mix & match with any creative)

Meta limits worth respecting: primary text shows ~125 chars before "See more"; headline ≤40
chars; description ≤30 chars. CTA button: **Sign up**.

**Primary text**
1. "The price dropped on a Tuesday. It was back up by Thursday. You found out Friday. DropWatch
   sends one alert the second your price hits — and nothing else, ever." (A/C)
2. "Type 'AirPods Pro under $200' and you're done. One alert when it drops, across Amazon,
   Target, and Best Buy. No deal blasts, no coupon clutter." (B)
3. "Free deal tools earn on volume, so they bury the one thing you want under 200 you don't.
   DropWatch is the opposite: one exact thing, one exact price, one alert." (C)

**Headlines (≤40 chars)**
1. "Stop missing price drops" (24)
2. "One alert. Zero noise." (22)
3. "Set it in one sentence" (22)

**Descriptions (≤30 chars)**
1. "3 months of Pro free" (20)
2. "Early access — no card" (22)

## Creatives

| File | Angle | Placement |
|---|---|---|
| `out/ad-a-worked-example-1080.png` | The notification you'd get | FB/IG feed |
| `out/ad-a-story-1080x1920.png` | Same, vertical | Stories/Reels |
| `out/ad-b-one-sentence-1080.png` | "That's the whole setup" | FB/IG feed |
| `out/ad-c-anti-noise-1080.png` | "You wanted one deal, not 40" | FB/IG feed |

## Campaign shape (validation-sized)

- **Objective:** Traffic (link clicks). Don't use a Leads objective — the landing page IS the
  form, and PostHog/Supabase are the source of truth, not Meta's lead metrics.
- **Meta Pixel:** installed (founder-directed, 2026-08-23 — supersedes this kit's original
  "no pixel needed" call). The pixel exists to feed Meta's delivery optimization and unlock
  retargeting later; it is NOT a probe instrument — the committed thresholds are still read
  only from the PostHog dashboard. Setup in "Pixel setup" below.
- **Budget:** $10/day, 7–10 days, hard cap ≈ $100. At typical $0.50–1.50 consumer CPCs that's
  ~70–200 visitors — enough to clear the 100-visitor per-channel floor alongside organic. Only
  extend past the cap if the channel is converting ≥ the iterate band (≥2%).
- **Audience:** US (launch stores are US retailers), age 25–45, interests: online shopping +
  price comparison / deal-of-the-day + Amazon; exclude nothing else — keep it broad enough for
  the algorithm at this budget. One ad set; put all 3 feed creatives + story in it and let Meta
  optimize.
- **Read the results** on the PostHog "DropWatch Probe" dashboard (linked from
  `docs/00-status.md`) — `fb-ads` / `ig-ads` appear as their own utm_source rows. Paid traffic
  converts below community traffic; judge it against the same committed thresholds but expect
  the organic channels to lead.

## Pixel setup

The site loads the pixel only when the `VITE_META_PIXEL_ID` env var is set at build time
(`src/lib/metaPixel.ts`); it fires `PageView` on load and a `Lead` standard event on real
signups (tier name attached when a tier button started the signup; honeypot submissions never
fire it). No email or other PII is ever sent to Meta.

1. **Create the pixel/dataset:** Events Manager (business.facebook.com/events_manager2) →
   Connect data → Web → name it "DropWatch" → skip the partner-integration step (code is
   already in the site). Copy the Dataset/Pixel ID (a ~15-digit number).
2. **Set the env var:** Vercel → project `dropwatch` → Settings → Environment Variables →
   add `VITE_META_PIXEL_ID` = the ID, Production only (keeps previews/dev pixel-free) →
   redeploy production so the build picks it up.
3. **Verify:** Events Manager → Test events → open the production URL → `PageView` appears;
   submit a test signup → `Lead` appears. (Test signups land in Supabase — note the email
   used so it can be discounted.) The Meta Pixel Helper browser extension works too.
4. **Ads Manager:** keep the Traffic objective; the ad account will now also report Leads as
   a column, but read demand only on the PostHog dashboard.

## Pre-flight checklist (all must be true before the first ad goes live)

Ordered by what blocks a launch, not by effort.

1. **Privacy policy + terms reachable** — `/privacy` and `/terms`, linked in the page footer.
   Live as of 2026-08-23. Meta's ad review looks for these on a data-collecting landing page, and
   the site runs analytics plus the pixel.
2. **The privacy contact actually resolves** — `privacy@usedropwatch.com` must reach a real inbox.
   Domain done; **mail forwarding still outstanding** (no MX records as of 2026-08-24). See
   "Domain + privacy contact setup" below. A published contact address that bounces is the one
   failure worse than not publishing one.
3. **Pixel verified receiving** — Events Manager → Test events shows `PageView` on load and `Lead`
   on a test signup. The code is confirmed in the deployed bundle; only Meta's receiving end is
   unverified until you look.
4. **Facebook page filled out** — profile picture, cover, About, and 1–2 organic posts. Empty pages
   plus a new ad account is the classic rejection combination.
5. **Destination URLs carry the paid UTMs** — never the bare URL; paid must not blend with organic.

## Domain + privacy contact setup

Founder decided 2026-08-23 to register `usedropwatch.com` before the ad spend, and to buy it
directly in Vercel. Every exact-match alternative was taken — `dropwatch.com`, `.app`, `.io`,
`.co`, `.net`, `.me`, `.xyz`, `.shop`, plus `getdropwatch.com` and `trydropwatch.com` — which is
also why the ads kit's primary handle `@getdropwatch` has no matching domain; `@usedropwatch` now
matches and is the better primary.

**1. Attach the domain — DONE 2026-08-24.** Verified live: `usedropwatch.com` and
`www.usedropwatch.com` both resolve to Vercel, nameservers are `ns1`/`ns2.vercel-dns.com`, and
`https://usedropwatch.com/privacy` returns 200 with `cleanUrls` working. Note the custom domain is
served *without* the `x-robots-tag: noindex` header the vercel.app host carries, so the page is now
indexable by search engines — intended, but worth knowing it changed.

**2. Forward the privacy alias — OUTSTANDING, and the last thing blocking ads.**
Confirmed 2026-08-24: the domain has **no MX and no TXT records at all**, so mail to
`privacy@usedropwatch.com` currently goes nowhere. That address is published on two live pages.

Use an MX-record forwarding service — ImprovMX and Forward Email both have free tiers and work by
adding records in Vercel's DNS panel, no nameserver change. **Do not use Cloudflare Email Routing
here:** it requires pointing the domain's nameservers at Cloudflare, which would take DNS
management away from Vercel for no benefit.

The flow is the same for either provider:

1. Sign up, add `usedropwatch.com` as the domain.
2. Create the alias `privacy@` → forward to the founder's personal inbox. A catch-all (`*@`) is
   also fine and means a typo'd address still reaches you.
3. The provider shows the exact MX records (two, with priorities) and one SPF TXT record. Add them
   in Vercel → Domains → `usedropwatch.com` → DNS. **Copy them from the provider's own screen, not
   from memory or from this file** — hostnames change and a stale record silently breaks delivery.
4. Wait for the provider's dashboard to report the domain verified. Vercel-hosted DNS usually
   propagates in minutes, not hours.

**Then send a real test email to `privacy@usedropwatch.com` from an unrelated account and confirm
it lands.** Do not treat a green checkmark in the provider dashboard as proof — only a received
message is. The address is published in the privacy policy and terms; an alias that silently
bounces is worse than having listed a personal address.

Nothing needs to *send* from this address for the probe — inbound forwarding is enough. Sending as
`privacy@usedropwatch.com` (SMTP credentials, DKIM) only matters once you email the founding-user
list at launch.

**3. Swap the URLs — DONE 2026-08-24.** Destination URLs in this file, and `og:url` /
`og:image` / `twitter:image` in `index.html`, now point at `https://usedropwatch.com`.
`PRODUCTION_HOSTS` in `src/lib/analytics.ts` already listed both the apex and `www`, so analytics
counts the new host with no code change; the vercel.app host is deliberately kept in that list so
any traffic still landing there is not silently dropped from the probe.

## Honest caveats

- A brand-new page + new ad account gets extra review friction: expect the first ads to sit in
  review for hours–a day, and keep the page filled out (profile, cover, about, 1–2 organic
  posts) before submitting ads — empty pages trigger rejections.
- "3 months of Pro free" is a launch promise; the page's FAQ already says nothing is bought
  today, which keeps the ad claim clean. Don't add urgency/scarcity claims the product can't
  back — Meta flags them and the brief's voice forbids them anyway.
- Resolved 2026-08-24: ads now point at `usedropwatch.com` rather than the vercel.app subdomain,
  which reads as more trustworthy in the ad's display link and removes the `x-robots-tag: noindex`
  that made the vercel.app host invisible to search engines.
