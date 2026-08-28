---
description: "Stage 0 — capture a new product idea and give it a first honest score"
argument-hint: "<one-line description of the idea>"
---

Capture a new idea into the portfolio: **$ARGUMENTS**

## Steps

1. **Check prior art first** (per `.claude/references/research-protocol.md`): scan `docs/ideas/` and `docs/knowledge/` for the same or adjacent ideas, including killed ones. If a near-duplicate exists, say so and ask whether to revive/merge instead of creating a new file.
2. **Interview briefly.** Ask the founder 3–5 questions max, only ones that change the score: who specifically has this problem, how they solve it today, why the founder is positioned to build it, what the monetization guess is. If they gave enough in the argument, skip questions you can answer from it.
3. **Write the idea file** at `docs/ideas/<kebab-slug>.md` using `docs/templates/idea.md`. Fill every section; mark unknowns as [ASSUMPTION] rather than inventing facts.
4. **Score it (ICE, 1–10 each, be stingy):**
   - **Impact** — revenue potential × how much the founder cares. A niche tool the founder loves can outscore a big market they'd dread.
   - **Confidence** — how much *evidence* (not enthusiasm) exists that people pay for this. Default is low: unvalidated ideas score ≤4.
   - **Ease** — how fast a solo founder on the default stack ships a sellable v1. Weeks = 8+, months = ≤4.
5. **Name the riskiest assumption** — the one belief that, if false, kills the idea — and suggest the cheapest Proof-of-Life probe that would test it (a landing page, 5 interviews, a concierge version).
6. **Report**: the score, the riskiest assumption, and the honest next step — usually `/compare-ideas` if the backlog has rivals, or `/validate-idea` if this one is clearly next.

Do not start validating or building. Capturing must stay cheap, or ideas stop being captured.
