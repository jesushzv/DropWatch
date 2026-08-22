---
description: "Portfolio level — read every product's state, allocate the founder's week, move lessons between living products"
argument-hint: "[optional: hours available this week, e.g. '20h']"
---

Run the portfolio review. Founder capacity this week: **$ARGUMENTS** (blank = ask, once).

Run from the **portfolio hub** clone. The hub's `docs/portfolio.md` is the registry — one line per product: name, local repo path (or GitHub repo), stage, MRR. Create it on first run by asking the founder what exists.

## Steps

1. **Pull each product's state**: read its `docs/00-status.md`, latest `/measure` review, and open gate verdicts (local paths directly; GitHub repos via the API/MCP). Products still in Stage 0–2 live in the hub's own `docs/ideas/` via `/compare-ideas` — don't duplicate that ranking here, import its top line.
2. **Portfolio table**: product, stage, MRR & trend, binding constraint, next action per its own status file, and — honestly — weeks since the founder last touched it. A product untouched for 6+ weeks that isn't explicitly in maintenance mode is a silent zombie; name it.
3. **Allocate the week** against stated capacity and the standing rules: one product in Build at a time (PLAYBOOK's WIP limit); a live product's fire (churn spike, broken core loop) outranks a new product's feature; maintenance-mode products get their 30-minute keep-alive slot, not ambition. Output: a short list — this week, product X gets N days on [its next action], products Y/Z get keep-alive only.
4. **Move lessons between living products.** Scan each product's recent `docs/knowledge/lessons.md` entries for portfolio-grade rules (channel results, pricing findings, stack landmines) and copy them into the hub's knowledge base *now* — not at sunset. Flag when one product's validated finding contradicts another's active assumption.
5. **Portfolio-level honesty**: if total MRR across products has been flat for a quarter while product count grows, say the uncomfortable thing — the portfolio is diversifying instead of compounding, and the next allocation should concentrate, not spread. Append the dated review to the hub's `docs/00-status.md` log.

Cadence: weekly while more than one product is live; skip it while there's only one (its own `/workflow-status` suffices).
