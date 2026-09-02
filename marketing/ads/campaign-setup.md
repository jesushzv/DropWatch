# DropWatch — Meta campaign setup (click-by-click)

The marketing department's build sheet. Assets in `out/`, copy variants in `ads-kit.md`, plan and
rules in `../launch-rollout.md`. Everything here is paste-ready. Budget and audience follow the
ads kit's validation-sized shape; nothing here is a growth campaign.

**What this campaign is for:** ~70–200 US visitors to the landing page over 10 days, tagged so the
probe can read the paid channel on its own. It is not for likes, followers, or Meta's "leads".

---

## 0. Before you open Ads Manager (5 minutes)

- [ ] Facebook page has profile picture (`out/profile-1080.png`), cover
      (`out/cover-facebook-1640x624.png`), About text (from `ads-kit.md`), and at least one post.
      Fix the existing post's link to `https://www.usedropwatch.com/?utm_source=facebook`.
- [ ] Instagram account connected to the page (Page settings → Linked accounts). If you don't
      have one, skip Instagram placements below — do not delay the launch to create one.
- [ ] Ad account has a payment method and the spending limit is set to **$100** (Ads Manager →
      Billing → Account spending limit). This is the hard cap from the kit; set it in the tool,
      not in your head.
- [ ] Pixel "DropWatch" shows `PageView` and `Lead` in Events Manager (done 2026-09-02).
- [ ] The five links below are copied from **this file**, not from a chat window.

## 1. Structure and naming

One campaign, one ad set, four ads. Meta needs volume in one ad set to learn at $10/day;
splitting the budget across ad sets starves all of them.

```
Campaign   DW-Validation-2026-09          Objective: Traffic
  Ad set   DW-US-25-45-shoppers            Budget $10/day · 2026-09-02 → 2026-09-12
    Ad     DW-A-worked-example-feed        out/ad-a-worked-example-1080.png
    Ad     DW-A-worked-example-story       out/ad-a-story-1080x1920.png
    Ad     DW-B-one-sentence               out/ad-b-one-sentence-1080.png
    Ad     DW-C-anti-noise                 out/ad-c-anti-noise-1080.png
```

## 2. Campaign level

| Setting | Value | Why |
|---|---|---|
| Buying type | Auction | default |
| Objective | **Traffic** | buys link clicks; the page is the form. Not Leads (Meta's lead forms bypass the page and the probe), not Engagement (buys likes), not Sales (needs purchase events that don't exist) |
| Campaign name | `DW-Validation-2026-09` | |
| Special ad categories | none | |
| Advantage+ campaign budget | **off** | one ad set anyway; keeps the budget where you can see it |
| A/B test | off | four creatives in one ad set *is* the test at this budget |

## 3. Ad set level

**Conversion**

| Setting | Value |
|---|---|
| Conversion location | Website |
| Performance goal | **Maximize number of link clicks** |
| Pixel | DropWatch |

Not "landing page views" — that costs more per click at this budget and the probe counts
pageviews itself. Not "conversions" — with ~0 Lead events Meta cannot optimise for it and will
either stall or overspend.

**Budget & schedule**

| Setting | Value |
|---|---|
| Budget | Daily, **$10.00** |
| Start | today, as soon as approved |
| End | **2026-09-12 23:59** local time — set an end date; do not rely on remembering to stop |
| Ad scheduling | all day |

**Audience** — keep it broad. At $10/day, narrow audiences cost more per click and give Meta
nothing to optimise with. *(Interest names are Meta's; type them in the detailed-targeting search
box and pick the closest match — [ASSUMPTION: names verified from memory, not live; Meta renames
interests.)*

| Setting | Value |
|---|---|
| Locations | **United States** (people living in) — launch stores are US retailers |
| Age | **25–45** |
| Gender | All |
| Languages | English (All) |
| Detailed targeting — interests | Online shopping · Coupons · Discounts and allowances · Amazon.com · Comparison shopping · Deal of the day |
| Detailed targeting — behaviors | Engaged shoppers |
| Advantage detailed targeting | **on** (let Meta expand if it finds cheaper clicks) |
| Exclusions | none |
| Custom audiences | none (there is nothing to retarget yet) |

Estimated audience size should read in the tens of millions. If it reads under 1M, you have
over-narrowed — remove interests until it doesn't.

**Placements**

| Setting | Value |
|---|---|
| Placements | **Advantage+ placements (automatic)** |
| Devices | All |
| Platforms | Facebook + Instagram (+ Audience Network and Messenger are fine at this budget; Meta will route almost nothing there) |

Automatic placements is deliberate: at $10/day, manual placement selection just raises the price
per click. The story creative covers Stories/Reels; the three square creatives cover feeds.

**Optimization & delivery**

| Setting | Value |
|---|---|
| Bid strategy | Highest volume (lowest cost) — no bid cap |
| Attribution | 7-day click, 1-day view (default) |

## 4. Ad level — four ads, each with its own pairing

Common to all four:

| Setting | Value |
|---|---|
| Identity | Facebook page: DropWatch · Instagram: @usedropwatch (if connected) |
| Format | Single image |
| Call to action button | **Sign up** |
| Display link | `www.usedropwatch.com` |
| Website URL — Facebook placements | `https://www.usedropwatch.com/?utm_source=fb-ads&utm_medium=paid&utm_campaign=validation` |
| Website URL — Instagram placements | Meta uses one URL per ad. Use the `fb-ads` URL for all four; PostHog's `$referrer` (`l.facebook.com` vs `l.instagram.com`) splits them at read time. Do **not** build separate Instagram ads just for the tag. |
| Tracking | Pixel DropWatch on; no URL parameters field needed (they are in the URL already) |
| Multi-advertiser ads | off |
| Advantage+ creative enhancements | **off** — Meta's auto-cropping and "text improvements" have rewritten copy into claims before; the copy below is exact |

### Ad 1 — `DW-A-worked-example-feed` · `out/ad-a-worked-example-1080.png`

The strongest creative: it shows the actual alert, including the delivered price, condition and
stock line — the pivot in one image.

- **Primary text:** "The price dropped on a Tuesday. It was back up by Thursday. You found out
  Friday. DropWatch sends one alert when your price hits — with the delivered price, the
  condition, and whether it's in stock — and nothing else, ever."
- **Headline:** "Stop missing price drops"
- **Description:** "3 months of Pro free"

### Ad 2 — `DW-A-worked-example-story` · `out/ad-a-story-1080x1920.png`

Same creative, vertical. Meta will show it in Stories and Reels; feed placements get the square
ads. Copy shows less in Stories, so lead with the shortest line.

- **Primary text:** "One alert when your price really hits — delivered price, new, in stock.
  Nothing else, ever."
- **Headline:** "One alert. Zero noise."
- **Description:** "Early access — no card"

### Ad 3 — `DW-B-one-sentence` · `out/ad-b-one-sentence-1080.png`

The setup-is-trivial angle.

- **Primary text:** "Type 'AirPods Pro under $200' and you're done. One alert when it drops —
  new, in stock, delivered price — across Amazon, eBay, and Google Shopping. No deal blasts, no
  coupon clutter."
- **Headline:** "Set it in one sentence"
- **Description:** "3 months of Pro free"

### Ad 4 — `DW-C-anti-noise` · `out/ad-c-anti-noise-1080.png`

The anti-noise angle — the positioning against free deal tools.

- **Primary text:** "Free deal tools earn on volume, so they bury the one thing you want under 200
  you don't. DropWatch is the opposite: one exact thing, one exact price, one alert — and it checks
  the deal is real before it tells you."
- **Headline:** "One alert. Zero noise."
- **Description:** "Early access — no card"

Character limits, all within Meta's: primary text shows ~125 characters before "See more"
(hook is in the first sentence of each), headlines ≤ 40, descriptions ≤ 30.

**Words that never appear in any ad:** instant · the second · Best Buy · pick your stores ·
limited spots · ends tonight · guaranteed. The first four are false of the product; the rest are
urgency claims the brief forbids and Meta's review flags.

## 5. Submit, then the review wait

Publish all four ads together. A new page plus a new ad account gets extra scrutiny:
expect **hours, possibly a day**, in review. Use the wait for the community posts.

**If an ad is rejected:** read the reason. The usual ones for a page like this:

- *"Personal attributes"* — copy implies something about the viewer ("you keep missing…"). Ad 1
  is the most exposed. Fallback primary text: "Price drops happen midweek and last a day.
  DropWatch sends one alert when a price hits your target — with the delivered price, condition,
  and stock — and nothing else."
- *"Landing page"* — reviewer could not load the page or found no privacy policy. Both are live;
  request a re-review, don't edit.
- *"Unacceptable business practices"* — almost always a false positive on new accounts. Request
  review; if it sticks, it is the account not the ad, and the organic channels carry the probe.

Never fix a rejection by adding urgency or removing the "early access" framing — that framing is
what keeps the "3 months free" claim honest.

## 6. Day 2 — the only check that matters early

Ads Manager says it spent money and got clicks. Open PostHog the same day and confirm
`fb-ads` shows up as its own `utm_source` row on a production host. If Meta reports clicks and
PostHog shows zero under `fb-ads`:

1. Open the ad's website URL field and check the tag survived (Meta sometimes strips parameters
   when "URL parameters" is also filled — leave that field empty).
2. `curl -sL https://www.usedropwatch.com/ | grep -o '/assets/index-[^"]*\.js'` then grep the
   bundle for the pixel ID — if it is missing, the wrong Vercel project is serving the domain.
   Stop spend until fixed.

## 7. Days 3–10 — do not touch

Every edit to an ad set resets Meta's learning phase and the price per click jumps. No new
creatives, no audience changes, no budget changes. The one exception: pause an ad only if it has
spent more than $15 with zero clicks, which at these creatives will not happen.

What "normal" looks like at $10/day for this audience *(ranges, not promises — [INFERENCE from
typical US consumer CPCs, not from DropWatch data])*:

| Metric | Normal | Worry |
|---|---|---|
| Cost per link click | $0.50–1.50 | > $3 after $30 spent |
| Clicks per day | 7–20 | < 3 |
| CTR (link) | 0.8–2% | < 0.4% |
| PostHog `fb-ads` uniques ÷ Meta link clicks | 60–90% | < 40% (tag or blocker problem) |

## 8. Day 10 — stop and hand over

The end date stops spend automatically. Export nothing from Meta; the probe is read from PostHog
with the host filter and founder-traffic discount, per `docs/00-status.md`. If `fb-ads` is
converting at or above the 2% iterate band at the cap, the kit allows extending spend; that is a
founder call, recorded in the status ledger.
