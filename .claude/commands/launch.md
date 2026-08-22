---
description: "Stage 4 — launch plan and launch copy: channels, assets, day-1 checklist, day-2 plan"
argument-hint: "[optional: launch date or channel preferences]"
---

Create the launch plan and copy. Founder notes: **$ARGUMENTS**

**Inputs:** `docs/product/03-positioning.md` (the copy source of truth — required) and `docs/product/01-validation.md` (where the demand evidence says the audience actually is). Research protocol applies to channel claims.

## Steps

1. **Channel selection, evidence-based.** From the validation research: where do the target users demonstrably hang out? Pick a **primary channel** (the one that gets real attention for launch week) and at most two secondaries. Evaluate honestly against solo-founder economics: Product Hunt, HN Show, the specific subreddits/communities where complaints were found, SEO/content, cold outreach, existing audience. Rank by expected customers-per-hour-of-founder-time, and label each estimate [INFERENCE] or [ASSUMPTION].
2. **Launch assets** — draft in full, ready to publish, all derived from the positioning statement (voice: plain customer language, no feature-list drone):
   - Landing page copy: headline (positioning first clause), subhead, 3 benefit blocks, social-proof placeholder, CTA
   - The primary-channel post (e.g. PH tagline + description + first comment, or Show HN title + text)
   - 2–3 social posts and a launch email to any waitlist
3. **Day-1 checklist:** publish sequence with times, monitoring (PostHog live view, error tracking), a plan for responding to comments fast (the founder's #1 launch-day job), and a "if something breaks" contact-sheet referencing the rollback plan in `docs/engineering/05-ship.md`.
4. **Day-2+ plan** — launches are spikes, businesses are slopes: the repeatable weekly motion for the primary channel, built from the matching section of `.claude/references/growth-tactics.md` (content/community motion for PLG; the founder-led sales playbook — list, 3-touch sequence, demo-call loop — for B2B), and the metric from the PRD that tells you in 30 days whether the channel works.
5. **Two-lens gate:** the `adversary` agent on the plan (channel assumptions especially) and the `customer-voice` agent on every asset draft — it reads the landing copy and the channel post as the person scrolling past. Copy the persona would ignore gets rewritten before launch day, not after.
6. Write `docs/launch/01-launch-plan.md` using `docs/templates/launch-plan.md`, update `docs/00-status.md`. Next: launch (the founder's job), then `/measure`.
