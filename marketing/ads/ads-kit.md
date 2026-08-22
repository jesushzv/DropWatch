# DropWatch — Facebook/Instagram validation kit

Assets live in `out/` (regenerate with `node marketing/ads/render.mjs` after editing `src/`).
Everything below is written to be pasted directly into Meta. Destination for every ad and link:
the production page with the paid-channel UTM (never the bare URL — the probe reads channels
separately, and paid must not blend with organic).

- Facebook ads → `https://dropwatch-jesushzvs-projects.vercel.app?utm_source=fb-ads&utm_medium=paid&utm_campaign=validation`
- Instagram ads → `https://dropwatch-jesushzvs-projects.vercel.app?utm_source=ig-ads&utm_medium=paid&utm_campaign=validation`
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
  form, and PostHog/Supabase are the source of truth, not Meta's lead metrics. No Meta Pixel
  needed for the probe; conversion is measured on our side.
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

## Honest caveats

- A brand-new page + new ad account gets extra review friction: expect the first ads to sit in
  review for hours–a day, and keep the page filled out (profile, cover, about, 1–2 organic
  posts) before submitting ads — empty pages trigger rejections.
- "3 months of Pro free" is a launch promise; the page's FAQ already says nothing is bought
  today, which keeps the ad claim clean. Don't add urgency/scarcity claims the product can't
  back — Meta flags them and the brief's voice forbids them anyway.
- Landing page currently lives on a vercel.app subdomain. Ads to vercel.app URLs are allowed
  but look less trustworthy in the ad's display link; if paid becomes a real channel, a custom
  domain (~$10) is the single highest-leverage upgrade — say the word and it's a small change.
