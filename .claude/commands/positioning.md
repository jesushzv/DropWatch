---
description: "Stage 2 — positioning statement and pricing hypothesis"
argument-hint: "[optional: pricing constraints or positioning instincts to test]"
---

Write the positioning and pricing brief. Founder notes: **$ARGUMENTS**

**Inputs:** `docs/product/01-validation.md` (competitor scan, target user) and `docs/product/02-prd.md` (the v1 promise). Follow `.claude/references/research-protocol.md` — pricing claims about competitors are [FACT]s with sources or they don't count.

## Steps

1. **Positioning statement** (Moore format, filled with real words, no placeholders left):
   > For **[specific target user]** who **[unmet need]**, **[product]** is a **[category the buyer already understands]** that **[key benefit]**. Unlike **[primary alternative]**, it **[sharpest differentiator]**.

   Test it: would the target user recognize themselves in the first clause? Is the differentiator durable, or a weekend of work for the incumbent? Use the customer's vocabulary from the validation evidence (their forum complaints are your copy bank).
2. **Press-release paragraph.** Working-backwards style: 3–5 sentences announcing the launch as if it already happened, in plain customer language. If this is hard to write compellingly, the positioning isn't done.
3. **Pricing hypothesis.**
   - Anchor: what the customer pays today for the alternative (tool, spreadsheet-hours, or pain).
   - Model choice with reasoning: flat / per-seat / usage / one-time. For a solo founder, bias toward simple: few tiers, obvious upgrade trigger.
   - A specific number per tier, defended against the anchor and competitor table — and against unit costs (LLM/API costs per user if any). Use `.claude/references/saas-finance.md` for margin math and benchmarks (gross margin floor, payback expectations).
   - What would make you raise it (pricing is a hypothesis; note the signal that triggers a revisit).
4. **Two-lens gate:** dispatch the `adversary` (attacks the logic) and `customer-voice` (reacts as the person — does the first clause land in 5 seconds, or would they close the tab?) agents on the draft, in parallel. Repair what either surfaces; the customer-voice reaction is a filter, not evidence. Then write `docs/product/03-positioning.md` using `docs/templates/positioning.md`.
5. **Update** `docs/00-status.md`. Next: `/architecture` (if not already done) or `/build-plan`.

This artifact feeds `/launch` directly — the landing-page headline is the positioning statement's first clause, so write it like it will be shipped, because it will.
