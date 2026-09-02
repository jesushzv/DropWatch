# DropWatch — probe traffic rollout (2026-09-02 → 2026-09-12)

**The job:** get ~210 more real visitors to `www.usedropwatch.com` by 2026-09-12 so the committed
thresholds in `docs/00-status.md` can be read at all. Today: 88 real visitors, 0 real signups,
zero channels running. Ten days.

## Should the existing Facebook posts be boosted instead of running the kit's ads? No.

- **Boost optimizes for the wrong thing.** "Boost post" defaults to engagement — reactions and
  comments — not link clicks. The probe needs clicks that land on the page; Ads Manager's
  **Traffic** objective buys exactly that.
- **Boosts contaminate the read.** A boosted organic post carries the organic link
  (`utm_source=facebook`), so paid clicks blend into the organic channel and neither can be judged
  against its 100-visitor floor. The kit's ads use `fb-ads` / `ig-ads` so paid stays separate.
- **The existing post link has no tag at all.** Boosting it would spend money on visitors who
  land as "came from nowhere".
- **The kit's creatives are already rendered and pivot-corrected** (`marketing/ads/out/`).

Keep the existing posts — they are what makes the page look real to Meta's reviewers. Fix their
link (see the share kit), then run real ads.

## The plan: three channels in parallel, organic leads

| Channel | What | Expected by 09-12 | Owner |
|---|---|---|---|
| **Meta paid** | Traffic objective, one campaign, one ad set, all 4 creatives, US, 25–45, interests: online shopping + price comparison / deal-of-the-day + Amazon. $10/day, 10 days, hard cap $100. | 70–200 visitors (at $0.50–1.50 CPC) | founder — Ads Manager |
| **Communities** | Share-kit posts: 2–3 Facebook deal/frugal groups, 2–3 subreddits where founder-feedback posts are welcome. Feedback framing, not a launch announcement. | 50–150 visitors, the highest-intent traffic | founder — posting |
| **Personal network** | X/LinkedIn post + 10–20 DMs to people who shop online a lot. | 20–50 visitors | founder — 30 min |

Paid traffic converts below community traffic; the kit says to expect organic to lead. All three
together clear the 300 floor with margin. Any one alone probably does not.

## Day by day

**Day 0 — today.** (1) Edit the existing Facebook post link to `?utm_source=facebook`. (2) Build
the Meta campaign per `marketing/ads/ads-kit.md` → "Campaign shape": Traffic objective, the
`fb-ads` link for the Facebook placement and `ig-ads` for Instagram, upload the four creatives
from `marketing/ads/out/`, primary text 1–3 and headlines 1–3 from the kit, $10/day. Submit for
review. New page + new ad account: expect review to take hours, possibly a day. (3) Post the X /
LinkedIn text and send the first DMs while review runs.

**Day 1.** Post in Facebook groups (one per group, spaced out; read each group's rules). Post the
Reddit version in one feedback-friendly subreddit. Reply to every comment — replies keep the post
alive and are the qualitative signal the probe cannot capture.

**Day 2.** If the ads are approved and spending: confirm `fb-ads` and `ig-ads` appear as their own
rows in PostHog by the end of the day. If they do not, the tag is wrong — stop and fix before
spending more. Second subreddit.

**Days 3–9.** Leave the ads alone — no edits (each edit resets Meta's learning). One community
post every other day. Answer comments and DMs. Do not read conversion; read *delivery* (below).

**Day 10 — 2026-09-12.** Stop spend. Run `/validate-idea` against the thresholds with the host
filter and founder-traffic discount applied. If the 300 floor was not reached, the recorded finding
is "couldn't buy the denominator" — a channel problem — not a KILL.

## The daily 5-minute health check (delivery, not conversion)

Automated: a routine reads PostHog at 14:00 UTC every day and reports, per `utm_source` on
production hosts with founder traffic excluded: pageviews, uniques, signups, tier clicks, and days
remaining. It reports counts only. **It does not judge the thresholds** — nothing is read before
300 visitors, and reading early is the after-the-fact rationalisation the thresholds were written
to prevent.

What the founder checks by eye: Ads Manager shows spend and clicks; PostHog shows the same day's
clicks under `fb-ads` / `ig-ads`. If Meta reports clicks and PostHog shows none, the tag or the
pixel-less-bundle trap is back — stop spend and check which project serves the domain.

## Rules that hold for the whole window

- **No copy changes.** The one iteration is spent (2026-09-01). A second needs a written waiver.
- **No reading the thresholds before the floor.** Counts yes, verdicts no.
- **Every link is `www` and tagged**, pasted from `marketing/share-kit.md`, never from a chat.
- **No urgency claims** in ads or posts ("only 100 spots", "ends tonight").
- **Stop spend at $100** unless a channel is already at or above the 2% iterate band.
