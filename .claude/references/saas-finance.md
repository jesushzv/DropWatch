# SaaS Finance Reference

Definitions, formulas, and solo-stage benchmarks. `/measure` uses these definitions when reading numbers; `/positioning` uses them when defending a price. Adapted from standard SaaS finance practice (see deanpeters/Product-Manager-Skills credits in README).

## Core formulas

| Metric | Formula | Notes |
|---|---|---|
| MRR | Σ active subscriptions' monthly value | Annual plans ÷ 12; exclude one-time fees |
| ARR | MRR × 12 | |
| Churn (logo, monthly) | customers lost in month ÷ customers at month start | Count only paying customers |
| Revenue churn (gross) | MRR lost ÷ MRR at month start | Downgrades count as partial loss |
| Net revenue retention | (start MRR − churn − downgrades + expansion) ÷ start MRR | >100% means expansion outruns churn |
| ARPU | MRR ÷ paying customers | |
| LTV (simple) | ARPU ÷ monthly revenue churn rate | Meaningless before ~6 months of churn data — say so |
| CAC | sales+marketing spend ÷ new customers acquired | For a solo founder, include ad spend AND founder-hours × an honest hourly value |
| CAC payback | CAC ÷ (ARPU × gross margin) | In months |
| Gross margin | (revenue − COGS) ÷ revenue | COGS: hosting, LLM/API costs, payment fees, support tooling |
| Burn / runway | monthly costs − MRR; runway = cash ÷ net burn | The solo founder's real deadline |

## Benchmarks (indie/bootstrapped SaaS, rough)

- **Monthly logo churn:** <3% good, 3–6% workable early, >8% = leaky bucket — fix retention before buying growth.
- **NRR:** ≥100% excellent for indie; 90%+ acceptable pre-expansion-features.
- **LTV:CAC:** ≥3:1 healthy; <2:1 means the channel is buying revenue, not building it.
- **CAC payback:** <6 months comfortable for bootstrapped (you're funding CAC from cash flow, not VC).
- **Gross margin:** 80%+ classic SaaS; LLM-heavy products often start 50–70% — margin expansion (caching, model right-sizing via `/perf-audit`) is then a roadmap item, not an afterthought.
- **Trial→paid:** ~2–5% freemium, ~10–25% free trial with card, ~40%+ trial with card upfront. Know which model you're benchmarking against.

## Product-market fit signals

PMF is not a metric — it's a judgment call these signals inform. `/measure` checks them when deciding whether to keep iterating toward fit or start scaling spend (scaling before fit burns the runway on filling a leaky bucket):

- **Retention curve flattens.** Cohort retention that declines then *plateaus* at a meaningful level (any stable non-zero floor by week 8–12) is the single strongest quantitative signal. A curve still sloping to zero = no fit yet, regardless of top-line growth.
- **Sean Ellis test:** ask active users "how would you feel if you could no longer use this?" — ≥40% answering "very disappointed" is the classic threshold. At solo scale run it as a one-question in-app survey once there are ~30+ active users; below that, read the verbatims not the percentage.
- **Organic pull:** users arriving un-attributed (word of mouth, unprompted mentions), feature requests phrased as "I need" not "you should", complaints when something breaks (silence when broken = nobody cared).
- **Anti-signals that fake it:** launch-spike usage, logo churn masked by acquisition, enthusiasm from friends/other founders, high signups with flat activation.

Decision rule of thumb: **before** these signals, every `/grow` cycle and release should target fit (activation/retention); **after** them, shifting spend and cycles toward acquisition is justified. Record the call in `docs/knowledge/decisions.md` — "we judged PMF reached on DATE because X" is a decision future-you will want to audit.

## Traps

- **Small-number theater:** growth percentages under ~100 customers are noise; report absolute numbers ("+3 customers") until the base is real.
- **Blended churn hiding cohorts:** early adopters churn differently than month-6 signups; check cohorts once there are ≥3 months of them.
- **Ignoring founder time in CAC:** "free" channels (content, community) cost the scarcest resource there is. Price it.
- **LTV on 2 months of data:** extrapolated LTV early on is fiction; label it [ASSUMPTION] and use payback months instead.
